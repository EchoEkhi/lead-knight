const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    upload: { type: String },
    download: { type: String },
    dataLimit: { type: String },
    timeUsed: {
        type: String

    },
    timeLimit: { type: String },
    peerLimit: { type: Number },
    createdOn: {
        type: Date,
        default: Date.now
    }
})

userSchema.virtual('peers', {
    ref: 'peers',
    localField: 'name',
    foreignField: 'user'
})

module.exports = userSchema