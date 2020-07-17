require('dotenv').config();
const express = require('express')
const app = express()
const graphQLHTTP = require('express-graphql').graphqlHTTP
const graphQL = require('./graphql')
const mongoose = require('mongoose')
const wireguard = require('./wireguard')

mongoose.connect(process.env.DB_CONNECTION_STRING, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(console.log('Database connected'))

// checks for root permission in order to access the WG interface
if (process.env.SUDO_UID) {
    console.log('Root permission acquired')
} else {
    console.error('Root permission failed, terminating');
    process.exit(-1)
}

// load peer information in the database into WireGuard CLI
wireguard.initialize()
    .then(console.log('WireGuard initialized'))

// start the server
app.listen(process.env.PORT)
console.log('Server running')

// setup GraphQL route
app.use('/', graphQLHTTP({
    schema: graphQL.schema,
    graphiql: true
}))

// periodically check the WireGuard CLI for updates
setInterval(wireguard.checkStatus, process.env.CHECK_STATUS_INTERVAL)