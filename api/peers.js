const {
    GraphQLObjectType,
    GraphQLInputObjectType,
    GraphQLList,
    GraphQLString,
    GraphQLNonNull,
    GraphQLBoolean
} = require('graphql')

const { Peer } = require('../db/index')

const peers = require('../db/peers')

const PeerType = new GraphQLObjectType({
    name: 'Peer',
    description: 'This is a WireGuard peer',
    fields: () => ({
        publicKey: { type: GraphQLNonNull(GraphQLString) },
        privateKey: { type: GraphQLString },
        allowedIP: { type: GraphQLString },
        endpoint: { type: GraphQLString },
        latestHandshake: { type: GraphQLString },
        enabled: { type: GraphQLBoolean },
        upload: { type: GraphQLString },
        download: { type: GraphQLString },
        timeUsed: { type: GraphQLString },
        dataLimit: { type: GraphQLString },
        timeLimit: { type: GraphQLString },
        user: { type: GraphQLString },
        device: { type: GraphQLString },
        description: { type: GraphQLString },
        createdOn: { type: GraphQLString }
    })
})

const PeerFilterType = new GraphQLInputObjectType({
    name: 'PeerFilterType',
    description: 'Input type for filtering peers for modification',
    fields: () => ({
        publicKey: { type: GraphQLString },
        user: { type: GraphQLString },
        enabled: { type: GraphQLBoolean },
        device: { type: GraphQLString }
    })
})

const PeerCreationType = new GraphQLInputObjectType({
    name: 'PeerCreationType',
    description: 'Input type for creating peers',
    fields: () => ({
        user: { type: GraphQLString },
        device: { type: GraphQLString },
        description: { type: GraphQLString },
        enabled: { type: GraphQLBoolean },
        dataLimit: { type: GraphQLString },
        timeLimit: { type: GraphQLString }
    })
})

const PeerMutationType = new GraphQLInputObjectType({
    name: 'PeerMutationType',
    description: 'Input type for modifying peers. Set attribute to null to remove the attribute',
    fields: () => ({
        description: { type: GraphQLString },
        enabled: { type: GraphQLBoolean },
        dataLimit: { type: GraphQLString },
        timeLimit: { type: GraphQLString }
    })
})

const RootPeerQuery = {
    peers: {
        type: GraphQLList(PeerType),
        description: 'A list of filterable peers',
        args: {
            filter: { type: PeerFilterType }
        },
        resolve: (parent, args) => Peer.find(args.filter)
    }
}

const RootPeerMutation = {
    addPeer: {
        type: PeerType,
        description: 'Add a peer',
        args: { data: { type: PeerCreationType } },
        resolve: (parent, args) => peers.add(args.data)
    },
    updatePeers: {
        type: GraphQLList(PeerType),
        description: 'Update a peer\'s attributes',
        args: {
            filter: { type: PeerFilterType },
            data: { type: PeerMutationType }
        },
        resolve: (parent, args) => peers.update(args.filter, args.data)
    },
    clearPeers: {
        type: GraphQLList(PeerType),
        description: 'Clear a peer\'s usage attributes (e.g. upload, download, timeUsed) and reenables the peer',
        args: {
            filter: { type: PeerFilterType }
        },
        resolve: (parent, args) => peers.clear(args.filter, args.data)
    },
    removePeers: {
        type: GraphQLList(PeerType),
        description: 'Remove filterable peers the server',
        args: {
            filter: { type: PeerFilterType }
        },
        resolve: (parent, args) => peers.remove(args.filter)
    }
}

module.exports = {
    PeerType,
    RootPeerQuery,
    RootPeerMutation
}