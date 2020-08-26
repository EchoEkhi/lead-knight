const {
    GraphQLSchema
} = require('graphql')

const rootSchema = new GraphQLSchema({
    query: require('./query'),
    mutation: require('./mutation')
})

module.exports = rootSchema