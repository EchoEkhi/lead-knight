const {
    GraphQLError
} = require('graphql')

const { User } = require('./index')
const peers = require('./peers')

// add a user to the database
async function add(data) {

    // check if the database already have a overlapping username
    if (await User.findOne({ name: data.name })) throw new GraphQLError('A user with the same name already exists.')

    // create new user object
    const user = new User(data)

    // save new user to database
    user.save()

    return user

}

// update users' attributes
async function update(filter, data) {

    // look up users in database
    const users = await User.find(filter)

    // check if users exist
    if (!users.length) throw new GraphQLError('User not found.')

    users.forEach(user => {

        // if undefined, do not write; if null, delete data by setting undefined; else, write new data
        if (data.dataLimit !== undefined) user.dataLimit = data.dataLimit === null ? undefined : data.dataLimit
        if (data.timeLimit !== undefined) user.timeLimit = data.timeLimit === null ? undefined : data.timeLimit
        if (data.peerLimit !== undefined) user.peerLimit = data.peerLimit === null ? undefined : data.peerLimit

        // write changes to database
        user.save()

    })

    return users

}

// clear user's attributes
async function clear(filter) {

    // look up users in database
    const users = await User.find(filter)

    // check if users exist
    if (!users.length) throw new GraphQLError('User not found.')

    users.forEach(user => {

        // reset the user's peers attributes and unblock them
        peers.clear({ user: user.name })

        // reset the user's usage attributes (just in case, can't hurt)
        user.upload = '0'
        user.download = '0'
        user.timeUsed = '0'

        // write changes to database
        user.save()

    })

    return users

}

// remove a user from the database
async function remove(filter) {

    // look up users in database
    const users = await User.find(filter)

    // check if users exist
    if (!users.length) throw new GraphQLError('Users not found.')

    users.forEach(user => {

        // remove all peers belonging to the user
        peers.remove({ user: user.name })

        // remove the user from the database
        user.remove()

    })

    return users

}

module.exports = {
    add,
    update,
    clear,
    remove
}