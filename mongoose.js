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
    latestHandshake: { type: String },
    upload: {
        type: String,
        required: true,
        default: '0'
    },
    lastUpload: { type: String },
    download: {
        type: String,
        required: true,
        default: '0'
    },
    lastDownload: { type: String },
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
    description: { type: String },
    createdOn: {
        type: Date,
        default: new Date
    }
})

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    upload: { type: String },
    download: { type: String },
    dataLimit: { type: String },
    timeUsed: {
        type: String,

    },
    timeLimit: { type: String },
    peerLimit: { type: Number },
    createdOn: {
        type: Date,
        default: new Date
    }
})

Peer = mongoose.model('peers', peerSchema)
User = mongoose.model('users', userSchema)

module.exports = {
    Peer: Peer,
    User: User
}