const wireguard = require('./wireguard')
const Peer = require('./mongoose').Peer
const {
    GraphQLSchema,
    GraphQLObjectType,
    GraphQLString,
    GraphQLList,
    GraphQLNonNull,
    GraphQLInt
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
            resolve: async(parent, args) => await Peer.findOne({ publicKey: args.publicKey }).exec()
        },
        peers: {
            type: new GraphQLList(PeerType),
            description: 'List of peers',
            resolve: async() => await Peer.find().lean()
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
            resolve: () => wireguard.addPeer()
        },
        blockPeer: {
            type: GraphQLString,
            description: 'Block a peer from connecting',
            args: {
                publicKey: { type: GraphQLNonNull(GraphQLString) }
            },
            resolve: (parent, args) => wireguard.blockPeer(args.publicKey)
        },
        unblockPeer: {
            type: GraphQLString,
            description: 'Unblock a peer from connecting',
            args: {
                publicKey: { type: GraphQLNonNull(GraphQLString) }
            },
            resolve: (parent, args) => wireguard.unblockPeer(args.publicKey)
        },
        removePeer: {
            type: GraphQLString,
            description: 'Remove a peer the server',
            args: {
                publicKey: { type: GraphQLNonNull(GraphQLString) }
            },
            resolve: (parent, args) => wireguard.removePeer(args.publicKey)
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