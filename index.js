require('dotenv').config()
const express = require('express')
const mongoose = require('mongoose')
const ipWhitelist = require('ip-whitelist')
const app = express()

const graphQLHTTP = require('express-graphql').graphqlHTTP

mongoose.connect(process.env.DB_CONNECTION_STRING, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
    .then(console.log('Database connected'))

// checks for root permission in order to access the WG interface
if (process.env.SUDO_UID) {

    console.log('Root permission acquired')

} else {

    throw new Error('Root permission failed, terminating')

}

// load peer information in the database into WireGuard CLI
require('./wg/index').init()
    .then(console.log('WireGuard initialized'))

// start the server
app.listen(process.env.PORT)
console.log('Server running')

/*
 * // debugging code to find your IP address
 *app.use((req, res, next) => {
 *    console.log(req.connection.remoteAddress)
 *    next()
 *})
 */


// set up IP whitelisting for basic access control
app.use(ipWhitelist(ipWhitelist.array(process.env.WHITELISTED_IPS.split(','))))

// setup GraphQL route
app.use('/', graphQLHTTP({
    schema: require('./api/index'),
    graphiql: process.env.ENABLE_GRAPHIQL
}))

// periodically check the WireGuard CLI for updates
setInterval(require('./heartbeat/index'), process.env.CHECK_STATUS_INTERVAL)