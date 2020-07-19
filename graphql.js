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
    GraphQLInputObjectType
} = require('graphql')


const PeerType = new GraphQLObjectType({
    name: 'Peer',
    description: 'This is a WireGuard peer',
    fields: () => ({
        publicKey: { type: GraphQLNonNull(GraphQLString) },
        privateKey: { type: GraphQLString },
        allowedIP: { type: GraphQLString },
        endpoint: { type: GraphQLString },
        latestHandshake: { type: GraphQLInt },
        enabled: { type: GraphQLBoolean },
        upload: { type: GraphQLInt },
        download: { type: GraphQLInt },
        timeUsed: { type: GraphQLString },
        dataLimit: { type: GraphQLString },
        timeLimit: { type: GraphQLString },
        user: { type: GraphQLString },
        device: { type: GraphQLString },
        description: { type: GraphQLString },
        createdOn: { type: GraphQLString }
    })
})

const UserType = new GraphQLObjectType({
    name: 'User',
    description: 'This tracks the ownership of peers',
    fields: () => ({
        name: { type: GraphQLNonNull(GraphQLString) },
        upload: { type: GraphQLString },
        download: { type: GraphQLString },
        timeUsed: { type: GraphQLString },
        dataLimit: { type: GraphQLString },
        timeLimit: { type: GraphQLString },
        peerLimit: { type: GraphQLInt }
    })
})

const PeerFilterType = new GraphQLInputObjectType({
    name: 'PeerFilterType',
    description: 'Input type for filtering peers for modification',
    fields: () => ({
        publicKey: { type: GraphQLString },
        user: { type: GraphQLString },
        enabled: { type: GraphQLBoolean }
    })
})

const PeerMutationType = new GraphQLInputObjectType({
    name: 'PeerMutationType',
    description: 'Input type for modifying peers. Set attribute to null to remove the attribute',
    fields: () => ({
        user: { type: GraphQLString },
        description: { type: GraphQLString },
        enabled: { type: GraphQLBoolean },
        dataLimit: { type: GraphQLString },
        timeLimit: { type: GraphQLString }
    })
})

const UserFilterType = new GraphQLInputObjectType({
    name: 'UserFilterType',
    description: 'Input type for filtering users for modification',
    fields: () => ({
        name: { type: GraphQLNonNull(GraphQLString) }
    })
})

const UserMutationType = new GraphQLInputObjectType({
    name: 'UserMutationType',
    description: 'Input type for modifying users. Set attribute to null to remove the attribute',
    fields: () => ({
        peerLimit: { type: GraphQLInt },
        dataLimit: { type: GraphQLString },
        timeLimit: { type: GraphQLString }
    })
})

const RootQueryType = new GraphQLObjectType({
    name: 'Query',
    description: 'Root Query',
    fields: () => ({
        peers: {
            type: GraphQLList(PeerType),
            description: 'A list of filterable peers',
            args: {
                filter: { type: PeerFilterType }
            },
            resolve: async(parent, args) => await Peer.find(args.filter).exec()
        },
        users: {
            type: GraphQLList(UserType),
            description: 'A list of filterable users',
            args: {
                filter: { type: UserFilterType }
            },
            resolve: async(parent, args) => await User.find(args.filter).exec()
        }
    })
})

const RootMutationType = new GraphQLObjectType({
    name: 'Mutation',
    description: 'Root mutation',
    fields: () => ({
        addPeer: {
            type: PeerType,
            description: 'Add a peer',
            args: { data: { type: PeerMutationType } },
            resolve: (parent, args) => wireguard.addPeer(args.data)
        },
        updatePeers: {
            type: GraphQLList(PeerType),
            description: 'Update a peer\'s attributes',
            args: {
                filter: { type: PeerFilterType },
                data: { type: PeerMutationType }
            },
            resolve: (parent, args) => wireguard.updatePeers(args.filter, args.data)
        },
        clearPeers: {
            type: GraphQLList(PeerType),
            description: 'Clear a peer\'s usage attributes (e.g. upload, download, timeUsed) and reenables the peer',
            args: {
                filter: { type: PeerFilterType }
            },
            resolve: (parent, args) => wireguard.clearPeers(args.filter, args.data)
        },
        removePeers: {
            type: GraphQLList(PeerType),
            description: 'Remove filterable peers the server',
            args: {
                filter: { type: PeerFilterType }
            },
            resolve: (parent, args) => wireguard.removePeers(args.filter)
        },
        addUser: {
            type: UserType,
            description: 'Add a user',
            args: {
                name: { type: GraphQLNonNull(GraphQLString) },
                data: { type: UserMutationType }
            },
            resolve: (parent, args) => wireguard.addUser(args.name, args.data)
        },
        updateUsers: {
            type: GraphQLList(UserType),
            description: 'Update users\' attributes',
            args: {
                filter: { type: UserFilterType },
                data: { type: UserMutationType }
            },
            resolve: (parent, args) => wireguard.updateUsers(args.filter, args.data)
        },
        clearUsers: {
            type: GraphQLList(UserType),
            description: 'Clear users\' usage attributes and reenables their peers',
            args: {
                filter: { type: UserFilterType }
            },
            resolve: (parent, args) => wireguard.clearUsers(args.filter)
        },
        removeUsers: {
            type: GraphQLList(UserType),
            description: 'Remove users',
            args: { filter: { type: UserFilterType } },
            resolve: (parent, args) => wireguard.removeUsers(args.filter)
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