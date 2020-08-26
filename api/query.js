const {
    GraphQLObjectType
} = require('graphql')

const RootQueryType = new GraphQLObjectType({
    name: 'RootQuery',
    description: 'Root query type.',
    fields: () => ({
        ...require('./peers').RootPeerQuery,
        ...require('./users').RootUserQuery,
        ...require('./server').RootServerQuery
    })
})

module.exports = RootQueryType