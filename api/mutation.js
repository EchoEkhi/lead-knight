const {
    GraphQLObjectType
} = require('graphql')

const RootMutationType = new GraphQLObjectType({
    name: 'RootMutation',
    description: 'Root mutation type.',
    fields: () => ({
        ...require('./peers').RootPeerMutation,
        ...require('./users').RootUserMutation
    })
})

module.exports = RootMutationType