const express = require('express')
const app = express()
const graphQLHTTP = require('express-graphql').graphqlHTTP
const graphQL = require('./graphql')
const mongoose = require('mongoose')

mongoose.connect('mongodb://localhost/lead-knight', { useNewUrlParser: true, useUnifiedTopology: true })
    .then(console.log('Database connected'))

app.listen(8081)

console.log('Server running')

app.use('/', graphQLHTTP({
    schema: graphQL.schema,
    graphiql: true
}))