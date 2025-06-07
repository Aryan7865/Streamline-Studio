const mongoose = require('mongoose');

const RawFileSchema = new mongoose.Schema({
    filename: { type: String, required: true },
    uploader: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    uploadedAt: { type: Date, default: Date.now },
    filePath: { type: String, required: true },
});

module.exports = mongoose.model('RawFile', RawFileSchema);
