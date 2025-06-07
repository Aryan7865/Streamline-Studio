const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const router = express.Router();
const User = require('../models/User');
const authMiddleware = require('../middleware/authMiddleware');

// Register route
router.post('/register', async (req, res) => {
    try {
        const { username, email, password, role } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "User already exists" });
        }

        // Hashing password
        const hashedPassword = await bcrypt.hash(password, 10);
        const secretKey = Math.random().toString(36).substring(2, 10);

        // Create new user
        const newUser = new User({
            username,
            email,
            password: hashedPassword,
            role,
            secretKey
        });

        // Save user to database
        await newUser.save();

        res.json({ message: "User registered successfully" });

    } catch (err) {
        console.error('Error registering user:', err);
        res.status(500).json({ message: 'Registration failed' });
    }
});

// Login route
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user by email
        const user = await User.findOne({ email : email });
        // If user not found
        if (!user) {
            return res.status(400).json({ message: "User not found" });
        }

        // Compare password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Generate JWT token
        const token = jwt.sign({ userId: user._id, email:user.email,role: user.role }, process.env.JWT_SECRET);

        res.json({ token });

    } catch (err) {
        console.error('Error logging in:', err);
        res.status(500).json({ message: 'Login failed' });
    }
});

// Fetch secret key for YouTuber
router.get('/fetch-secret-key',authMiddleware,async (req,res)=>{
    try{
        const userId = req.user.userId;
        const user = await User.findById(userId);
        if(!user){
            return res.status(404).json({ message: 'User not found' });
        }
        if (user.role !== 'YouTuber') {
            return res.status(403).json({ message: 'User is not a YouTuber' });
        }
        res.json({ secretKey: user.secretKey });
    }
    catch (err) {
        console.error('Error fetching secret key:', err);
        res.status(500).json({ message: 'Failed to fetch secret key' });
    }
})


// Secret key generation route (for YouTubers)
router.post('/generate-secret', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.userId; // Extract user ID from authMiddleware

        // Find user by ID
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check if user is not a YouTuber
        if (user.role !== 'YouTuber') {
            return res.status(403).json({ message: 'User is not a YouTuber' });
        }

        // Generate a random secret key
        const secretKey = Math.random().toString(36).substring(2, 10);

        // Update user with generated secret key
        user.secretKey = secretKey;
        await user.save();

        res.json({ email: user.email, secretKey });

    } catch (err) {
        console.error('Error generating secret key:', err);
        res.status(500).json({ message: 'Failed to generate secret key' });
    }
});


// Secret key validation route (for Editors)
router.post('/validate-secret', authMiddleware, async (req, res) => {
    try {
        const { email, secretKey } = req.body;
        const editor = req.user;

        // Find YouTuber by secret key
        const youtuber = await User.findOne({
            email: email,
            secretKey :secretKey,
            role: 'YouTuber'
        });

        if (!youtuber) {
            return res.status(404).json({ message: 'YouTuber not found or invalid secret key' });
        }

        // Update the editor's associatedUser field
        if(!editor.associatedUser){
            const updatedEditor = await User.findOneAndUpdate(
                { email: editor.email },
                { associatedUser: youtuber.email },
                { new: true }
            )
            if (!updatedEditor) {
                return res.status(404).json({ message: 'Editor not found' });
            }
        }

        if(!youtuber.associatedUser){
            // Update the YouTuber's associatedUser field
            const updatedYouTuber = await User.findOneAndUpdate(
                { email: youtuber.email },
                { associatedUser: editor.email },
                { new: true }
            );

            if (!updatedYouTuber) {
                return res.status(500).json({ message: 'Failed to update YouTuber' });
            }
        }

        // Return name and email of the YouTuber
        return res.json({
            message: 'Association successful',
            youtuber: { username: youtuber.username, email: youtuber.email }
        });

    } catch (err) {
        console.error('Error validating secret key:', err);
        res.status(500).json({ message: 'Failed to validate secret key' });
    }
});



module.exports = router;