const {
    GraphQLError
} = require('graphql')

const { Peer, User } = require('./index')
const wg = require('../wg/index')

// add a peer in WireGuard CLI and updates the database
async function add(data) {

    // check for the user's peerLimit
    if (data) if (data.user) {

        const user = await User.findOne({ name: data.user })

        // check if the user is in the database
        if (user) {

            // check if the user has reached their peer limit
            if (await Peer.countDocuments({ user: user.name }) >= user.peerLimit) {

                throw new GraphQLError('User peer limit reached.')

            }

        }

    }

    // add a peer in CLI and save to database
    let peer = new Peer(await wg.create())

    if (data) {

        // assign other optional attributes
        peer.enabled = data.enabled === undefined ? true : data.enabled
        peer.user = data.user
        peer.device = data.device
        peer.description = data.description
        peer.dataLimit = data.dataLimit
        peer.timeLimit = data.timeLimit

    } else peer.enabled = true

    // write to database
    peer = await peer.save()

    // check if peer is disabled by default
    if (!peer.enabled) wg.remove(peer)

    return peer

}

// updates a peer's attributes
async function update(filter, data) {

    // look up the peer in the database
    const peers = await Peer.find(filter)

    // check if the peers exist
    if (!peers.length) {

        throw new GraphQLError('Peer not found.')

    }

    peers.forEach(peer => {

        // if undefined, do not write; if null, delete data by setting undefined; else, write new data
        if (data.user !== undefined) peer.user = data.user === null ? undefined : data.user
        if (data.description !== undefined) peer.description = data.description === null ? undefined : data.description
        if (data.dataLimit !== undefined) peer.dataLimit = data.dataLimit === null ? undefined : data.dataLimit
        if (data.timeLimit !== undefined) peer.timeLimit = data.timeLimit === null ? undefined : data.timeLimit

        if (data.enabled !== undefined) {

            if (data.enabled) wg.add(peer)
            else wg.remove(peer)

            peer.enabled = data.enabled

        }

        // write changes to database
        peer.save()

    })

    return peers

}

// clears a peer's usage attributes
async function clear(filter) {

    // look up the peer in the database
    const peers = await Peer.find(filter)

    // check if the peers exist
    if (!peers.length) {

        throw new GraphQLError('Peer not found.')

    }

    peers.forEach(peer => {

        // reset the peer's usage attributes
        peer.upload = '0'
        peer.download = '0'
        peer.timeUsed = '0'

        // reenable the peer
        wg.add(peer)

        // write changes to database
        peer.save()

    })

    return peers

}

// removes peers in WireGuard CLI and the database
async function remove(filter) {

    // look up peers in database
    const peers = await Peer.find(filter)

    // check if the peers exist
    if (!peers.length) {

        throw new GraphQLError('Peer not found.')

    }

    // remove each of the peer from the database and the CLI
    peers.forEach(peer => {

        wg.remove(peer)
        peer.remove()

    })

    return peers

}

module.exports = {
    add,
    update,
    clear,
    remove
}