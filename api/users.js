const {
    GraphQLObjectType,
    GraphQLInputObjectType,
    GraphQLString,
    GraphQLList,
    GraphQLNonNull,
    GraphQLInt
} = require('graphql')

const { User } = require('../db/index')

const users = require('../db/users')

const { PeerType } = require('./peers')

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
        peerLimit: { type: GraphQLInt },
        peers: { type: GraphQLList(PeerType) }
    })
})

const UserFilterType = new GraphQLInputObjectType({
    name: 'UserFilterType',
    description: 'Input type for filtering users for modification',
    fields: () => ({
        name: { type: GraphQLNonNull(GraphQLString) }
    })
})

const UserCreationType = new GraphQLInputObjectType({
    name: 'UserCreationType',
    description: 'Input type for creating users',
    fields: () => ({
        name: { type: GraphQLNonNull(GraphQLString) },
        peerLimit: { type: GraphQLInt },
        dataLimit: { type: GraphQLString },
        timeLimit: { type: GraphQLString }
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

const RootUserQuery = {
    users: {
        type: GraphQLList(UserType),
        description: 'A list of filterable users',
        args: {
            filter: { type: UserFilterType }
        },
        resolve: (parent, args) => User.find(args.filter).populate('peers')
    }
}

const RootUserMutation = {
    addUser: {
        type: UserType,
        description: 'Add a user',
        args: {
            data: { type: UserCreationType }
        },
        resolve: (parent, args) => users.add(args.data)
    },
    updateUsers: {
        type: GraphQLList(UserType),
        description: 'Update users\' attributes',
        args: {
            filter: { type: UserFilterType },
            data: { type: UserMutationType }
        },
        resolve: (parent, args) => users.update(args.filter, args.data)
    },
    clearUsers: {
        type: GraphQLList(UserType),
        description: 'Clear users\' usage attributes and reenables their peers',
        args: {
            filter: { type: UserFilterType }
        },
        resolve: (parent, args) => users.clear(args.filter)
    },
    removeUsers: {
        type: GraphQLList(UserType),
        description: 'Remove users',
        args: { filter: { type: UserFilterType } },
        resolve: (parent, args) => users.remove(args.filter)
    }
}

module.exports = {
    UserType,
    RootUserQuery,
    RootUserMutation
}