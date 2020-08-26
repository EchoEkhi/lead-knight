const {
    GraphQLObjectType,
    GraphQLString
} = require('graphql')

const { Server } = require('../db/index')

const ServerType = new GraphQLObjectType({
    name: 'Server',
    description: 'This is the server\'s statistics',
    fields: () => ({
        publicKey: { type: GraphQLString },
        upload: { type: GraphQLString },
        download: { type: GraphQLString },
        timeUsed: { type: GraphQLString }
    })
})

const RootServerQuery = {
    server: {
        type: ServerType,
        description: 'Server statistics',
        resolve: () => Server.findOne({ serverSettings: true }).exec()
    }
}

module.exports = {
    RootServerQuery
}