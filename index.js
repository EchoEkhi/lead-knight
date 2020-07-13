const express = require('express')
const wireguard = require('./wireguard')
const graphQLHTTP = require('express-graphql').graphqlHTTP
const {
    GraphQLSchema,
    GraphQLObjectType,
    GraphQLString,
    GraphQLList,
    GraphQLNonNull,
    GraphQLInt
} = require('graphql')
const app = express()

const PeerType = new GraphQLObjectType({
    name: 'Peer',
    description: 'This is a WireGuard peer',
    fields: () => ({
        publicKey: { type: GraphQLNonNull(GraphQLString) },
        endpoint: { type: GraphQLString },
        latestHandshake: { type: GraphQLInt },
        upload: { type: GraphQLInt },
        download: { type: GraphQLInt },
        allowedIPs: { type: new GraphQLList(GraphQLString) }

    })
})

const RootQueryType = new GraphQLObjectType({
    name: 'Query',
    description: 'Root Query',
    fields: () => ({
        peer: {
            type: PeerType,
            description: 'A single peer',
            args: {
                publicKey: { type: GraphQLString }
            },
            resolve: (parent, args) => wireguard.getStatus().peers.find(peer => peer.publicKey === args.publicKey)
        },
        peers: {
            type: new GraphQLList(PeerType),
            description: 'List of peers',
            resolve: () => wireguard.getStatus().peers
        }
    })
})

const schema = new GraphQLSchema({
    query: RootQueryType
})

app.listen(8081)

console.log('Server running')

console.log(wireguard.getStatus())

app.use('/', graphQLHTTP({
    schema: schema,
    graphiql: true
}))