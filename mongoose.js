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
    device: { type: String },
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

const serverSchema = new mongoose.Schema({
    serverSettings: { type: Boolean },
    publicKey: { type: String },
    upload: { type: String },
    download: { type: String },
    timeUsed: { type: String }
})

const Peer = mongoose.model('peers', peerSchema)
const User = mongoose.model('users', userSchema)
const Server = mongoose.model('server', serverSchema, 'server')

module.exports = {
    Peer: Peer,
    User: User,
    Server: Server
}