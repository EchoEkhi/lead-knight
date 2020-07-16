const wireguard = require('./wireguard')
const Peer = require('./mongoose').Peer
const User = require('./mongoose').User
const {
    GraphQLSchema,
    GraphQLObjectType,
    GraphQLString,
    GraphQLList,
    GraphQLNonNull,
    GraphQLInt,
    GraphQLBoolean,
    GraphQLScalarType,
    isNonNullType
} = require('graphql')


const PeerType = new GraphQLObjectType({
    name: 'Peer',
    description: 'This is a WireGuard peer',
    fields: () => ({
        publicKey: { type: GraphQLNonNull(GraphQLString) },
        endpoint: { type: GraphQLString },
        latestHandshake: { type: GraphQLInt },
        upload: { type: GraphQLInt },
        download: { type: GraphQLInt },
        allowedIP: { type: new GraphQLList(GraphQLString) }

    })
})

const UserType = new GraphQLObjectType({
    name: 'User',
    description: 'This tracks the ownership of peers',
    fields: () => ({
        name: { type: GraphQLNonNull(GraphQLString) },
        upload: { type: GraphQLString },
        download: { type: GraphQLString },
        dataLimit: { type: GraphQLString },
        timeUsed: { type: GraphQLString },
        timeLimit: { type: GraphQLString }
    })
})

const peerFilter = {
    publicKey: { type: GraphQLString },
    user: { type: GraphQLString },
    enabled: { type: GraphQLBoolean }
}

const RootQueryType = new GraphQLObjectType({
    name: 'Query',
    description: 'Root Query',
    fields: () => ({
        peers: {
            type: GraphQLList(PeerType),
            description: 'A list of filterable peers',
            args: peerFilter,
            resolve: async(parent, args) => await Peer.find(args).exec()
        },
        getStatus: {
            type: GraphQLString,
            resolve: () => wireguard.checkStatus()
        },
        users: {
            type: GraphQLList(UserType),
            description: 'A list of filterabe users',
            args: {
                name: { type: GraphQLString }
            },
            resolve: async(parent, args) => await User.find(args).exec()
        }
    })
})

const RootMutationType = new GraphQLObjectType({
    name: 'Mutation',
    description: 'Root mutation',
    fields: () => ({
        addPeer: {
            type: GraphQLString,
            description: 'Add a peer',
            args: {
                user: { type: GraphQLString },
                description: { type: GraphQLString }
            },
            resolve: (parent, args) => wireguard.addPeer(args)
        },
        blockPeer: {
            type: GraphQLList(GraphQLString),
            description: 'Block a peer from connecting',
            args: peerFilter,
            resolve: (parent, args) => wireguard.blockPeer(args)
        },
        unblockPeer: {
            type: GraphQLList(GraphQLString),
            description: 'Unblock a peer from connecting',
            args: peerFilter,
            resolve: (parent, args) => wireguard.unblockPeer(args)
        },
        removePeer: {
            type: GraphQLList(GraphQLString),
            description: 'Remove a peer the server',
            args: peerFilter,
            resolve: (parent, args) => wireguard.removePeer(args)
        },
        addUser: {
            type: GraphQLString,
            description: 'Add a user',
            args: {
                name: { type: GraphQLNonNull(GraphQLString) },
                peerLimit: { type: GraphQLInt },
                dataLimit: { type: GraphQLString },
                timeLimit: { type: GraphQLString }
            },
            resolve: (parent, args) => wireguard.addUser(args)
        }
    })
})

const schema = new GraphQLSchema({
    query: RootQueryType,
    mutation: RootMutationType
})

module.exports = {
    schema: schema
}