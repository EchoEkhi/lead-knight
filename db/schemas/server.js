const mongoose = require('mongoose')

const serverSchema = new mongoose.Schema({
    serverSettings: { type: Boolean },
    publicKey: { type: String },
    upload: { type: String },
    download: { type: String },
    timeUsed: { type: String }
})

module.exports = serverSchema