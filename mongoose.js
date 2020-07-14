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
    latestHandshake: { type: Date },
    upload: { type: String },
    download: { type: String },
    allowedIP: { type: String },
    enabled: { type: Boolean },
    user: { type: String },
    createdOn: { type: Date }
})

Peer = mongoose.model('peers', peerSchema)

module.exports = {
    Peer: Peer
}