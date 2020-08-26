const mongoose = require('mongoose')

const peerSchema = new mongoose.Schema({
    publicKey: {
        type: String,
        required: true
    },
    privateKey: {
        type: String,
        required: true
    },
    endpoint: { type: String },
    latestHandshake: {
        type: String,
        required: true,
        default: '0'
    },
    upload: {
        type: String,
        required: true,
        default: '0'
    },
    lastUpload: {
        type: String,
        required: true,
        default: '0'
    },
    download: {
        type: String,
        required: true,
        default: '0'
    },
    lastDownload: {
        type: String,
        required: true,
        default: '0'
    },
    dataLimit: { type: String },
    timeUsed: {
        type: String,
        required: true,
        default: '0'
    },
    timeLimit: { type: String },
    allowedIP: { type: String },
    enabled: {
        type: Boolean,
        required: true,
        default: true
    },
    user: { type: String },
    device: { type: String },
    description: { type: String },
    createdOn: {
        type: Date,
        default: Date.now
    }
})

module.exports = peerSchema