const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const authRoutes = require('./routes/auth');
const fileRoutes = require('./routes/file');
const cors = require('cors');
const { google } = require('googleapis');
const fetch = require('node-fetch').default;
const fs = require('fs');
const path = require('path');
const User = require('./models/User');
const EditedFile = require('./models/EditedFile');

dotenv.config();

const port = process.env.PORT || 8000;
const app = express();

app.use(cors({
    origin: 'http://localhost:5173', // or whatever your frontend URL is
    credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/file', fileRoutes);

// MongoDB connection
mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log('Connected to MongoDB');
        app.listen(port, () => {
            console.log(`Server running on port ${port}`);
        });
    })
    .catch((err) => {
        console.error('MongoDB connection error:', err);
    });

// Google OAuth2 setup
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI;

const oauth2Client = new google.auth.OAuth2(
    CLIENT_ID,
    CLIENT_SECRET,
    REDIRECT_URI
);

app.get('/auth/google', (req, res) => {
    const { userId, videoId } = req.query;
    const state = JSON.stringify({ videoId, userId });

    const authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: ['https://www.googleapis.com/auth/youtube.upload'],
        state: state,
        redirect_uri: REDIRECT_URI // Make sure this matches your .env file
    });
    res.json({ authUrl }); // Send the URL as JSON instead of redirecting
});

app.get('/auth/google/callback', async (req, res) => {
    const { code, state } = req.query;
    const { userId, videoId } = JSON.parse(state);
    try {
        const { tokens } = await oauth2Client.getToken(code);

        // Store tokens in your database securely associated with the user
        await storeTokensInDatabase(userId, tokens);

        res.redirect(`/publish/${videoId}?userId=${userId}`);
    } catch (error) {
        console.error('Error getting tokens:', error.response?.data || error.message || error);
        res.redirect(`http://localhost:5173/upload-result?success=false&error=${encodeURIComponent(error.message)}`);
    }
});

app.get('/publish/:videoId', async (req, res) => {
    const videoId = req.params.videoId;
    const userId = req.query.userId;

    try {
        const video = await getVideoFromDatabase(videoId);
        const tokens = await getTokensFromDatabase(userId);

        if (!tokens || !tokens.access_token || !tokens.refresh_token) {
            throw new Error('No access or refresh token');
        }

        const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
        oauth2Client.setCredentials(tokens);

        // Check if token is expired and refresh if needed
        if (tokens.expiry_date && tokens.expiry_date <= Date.now()) {
            const newTokens = await oauth2Client.refreshAccessToken();
            await storeTokensInDatabase(userId, newTokens.credentials);
            oauth2Client.setCredentials(newTokens.credentials);
        }

        // Download video from Cloudinary
        const response = await fetch(video.cloudinaryLink);
        if (!response.ok) {
            throw new Error('Failed to download video from Cloudinary');
        }

        const videoPath = path.join(__dirname, 'video.mp4');
        const fileStream = fs.createWriteStream(videoPath);
        await new Promise((resolve, reject) => {
            response.body.pipe(fileStream);
            response.body.on('error', reject);
            fileStream.on('finish', resolve);
        });

        // Upload video to YouTube
        const uploadResponse = await google.youtube('v3').videos.insert({
            auth: oauth2Client,
            part: 'snippet,status',
            requestBody: {
                snippet: {
                    title: video.title,
                    description: video.description,
                    tags: video.tags,
                },
                status: {
                    privacyStatus: 'public',
                },
            },
            media: {
                body: fs.createReadStream(videoPath),
            },
        });

        // Check if file exists before deleting
        if (fs.existsSync(videoPath)) {
            fs.unlinkSync(videoPath);
        }

        res.redirect(`http://localhost:5173/upload-result?success=true&videoId=${videoId}`);
    } catch (error) {
        console.error('Error uploading video to YouTube:', error.response?.data || error.message || error);
        res.redirect(`http://localhost:5173/upload-result?success=false&error=${encodeURIComponent(error.message)}`);
    }
});


async function getVideoFromDatabase(videoId) {
    try {
        const video = await EditedFile.findById(videoId);
        if (!video) {
            throw new Error('Video not found');
        }

        return {
            cloudinaryLink: video.filePath,
            title: video.filename,
            description: `Edited video uploaded by user ${video.uploader}`, // Include uploader's ID in the description
            tags: ['edited', 'video'], // Add any tags you want here
        };
    } catch (error) {
        console.error('Error fetching video from database:', error);
        throw error;
    }
}

// Implement these functions to interact with your database
async function storeTokensInDatabase(userId, tokens) {
    try {
        // Check if tokens.expires_in is valid and calculate the expiry date correctly
        const tokenExpiryDate = new Date(Date.now() + (tokens.expires_in ? tokens.expires_in * 1000 : 0));
        if (isNaN(tokenExpiryDate.getTime())) {
            throw new Error("Invalid token expiry date");
        }

        await User.findByIdAndUpdate(userId, {
            googleAccessToken: tokens.access_token,
            googleRefreshToken: tokens.refresh_token,
            googleTokenExpiryDate: tokenExpiryDate,
        });
        console.log('Tokens stored successfully');
    } catch (error) {
        console.error('Error storing tokens:', error);
    }
}

async function getTokensFromDatabase(userId) {
    try {
        const user = await User.findById(userId);
        if (user) {
            return {
                access_token: user.googleAccessToken,
                refresh_token: user.googleRefreshToken,
                expiry_date: user.googleTokenExpiryDate,
            };
        }
        throw new Error('User not found');
    } catch (error) {
        console.error('Error getting tokens:', error);
        throw error;
    }
}
