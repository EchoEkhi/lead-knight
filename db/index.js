const mongoose = require('mongoose')

module.exports = {
    Server: mongoose.model('server', require('./schemas/server'), 'server'),
    User: mongoose.model('users', require('./schemas/users')),
    Peer: mongoose.model('peers', require('./schemas/peers'))
}