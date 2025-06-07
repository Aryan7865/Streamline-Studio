const express = require('express');
const router = express.Router();
const RawFile = require('../models/RawFile');
const EditedFile = require('../models/EditedFile');
const User = require('../models/User'); // Assuming you have a User model
const auth = require('../middleware/authMiddleware');

// Fetch raw videos
router.get('/raw', auth, async (req, res) => {
    try {
        const email  = req.user.email;

        if (!email) {
            return res.status(400).json({ message: "Email is required" });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        if(user.role === 'YouTuber'){
            const rawVideos = await RawFile.find({ uploader: user._id })
                .sort({ uploadedAt: -1 }); // Sort by newest first

            return res.json(rawVideos);
        }
        else if(user.role === 'Editor'){
            associatedUserEmail = user.associatedUser;
            const assUser = await User.findOne({email: associatedUserEmail});
            const rawVideos = await RawFile.find({ uploader: assUser._id })
                .sort({ uploadedAt: -1 }); // Sort by newest first

            return res.json(rawVideos);
        }

    } catch (error) {
        console.error('Error fetching raw videos:', error);
        res.status(500).json({ message: "Server error" });
    }
});

// Fetch edited videos
router.get('/edited', auth, async (req, res) => {
    try {
       const email = req.user.email;

        if (!email) {
            return res.status(400).json({ message: "Email is required" });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        if(user.role === 'Editor'){
            const editedVideos = await EditedFile.find({ uploader: user._id })
                .sort({ uploadedAt: -1 }); // Sort by newest first

            return res.json(editedVideos);
        }
        else if(user.role === 'YouTuber'){
            const associatedUserEmail = user.associatedUser;
            const assUser = await User.findOne({email: associatedUserEmail});
            const editedVideos = await EditedFile.find({ uploader: assUser._id })
                .sort({ uploadedAt: -1 }); // Sort by newest first

            return res.json(editedVideos);
        }

    } catch (error) {
        console.error('Error fetching edited videos:', error);
        res.status(500).json({ message: "Server error" });
    }
});

// Save raw video info
router.post('/save-raw', auth, async (req, res) => {
    try {
        const { filename, filePath } = req.body;
        const uploaderEmail = req.user.email; 

        const user = await User.findOne({ email: uploaderEmail });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const newRawFile = new RawFile({
            filename,
            filePath,
            uploader: user._id
        });

        await newRawFile.save();

        res.status(201).json({ message: "Raw video info saved successfully", video: newRawFile });
    } catch (error) {
        console.error('Error saving raw video info:', error);
        res.status(500).json({ message: "Server error" });
    }
});

// Save edited video info
router.post('/save-edited', auth, async (req, res) => {
    try {
        const { filename, filePath } = req.body;
        const uploaderEmail = req.user.email; // Assuming your auth middleware attaches user info

        const user = await User.findOne({ email: uploaderEmail });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const newEditedFile = new EditedFile({
            filename,
            filePath,
            uploader: user._id
        });

        await newEditedFile.save();

        res.status(201).json({ message: "Edited video info saved successfully", video: newEditedFile });
    } catch (error) {
        console.error('Error saving edited video info:', error);
        res.status(500).json({ message: "Server error" });
    }
});

module.exports = router;