const execSync = require('child_process').execSync
const config = require('./config')
const { exec } = require('child_process')
const Peer = require('./mongoose').Peer

function getStatus() {
    return JSON.parse(execSync('bash ./json.sh'))
}

// initialize the WireGuard CLI according to the database
function initialize() {
    // clear WireGuard CLI configurations, your wg0.conf should only contain the interface and no peers (unless you have default ones for access control)
    execSync('systemctl restart wg-quick@wg0')

    // load peers in the database into CLI (if it is enabled)
    Peer.find({ enabled: true })
        .then(peers => {
            for (i in peers) {
                execSync('wg set wg0 peer ' + peers[i].publicKey + ' allowed-ips ' + peers[i].allowedIP + '/32')
            }
        })
}

// add a peer in WireGuard CLI and updates the database
async function addPeer(user) {
    // generate a valid peer IP in sequence

    async function getAllowedIP() {
        function IPtoInt(IP) {
            return (IP.split('.')[2] * 200) + (IP.split('.')[3] - 10)
        }

        function intToIP(count) {
            return config.localIPRange + Math.floor(count / 200).toString() + '.' + ((count % 200) + 10).toString()
        }

        let documents = await Peer.find({}).exec()
        let IPs = []

        // loop through all peers and extract allowedIP into IPs
        for (i in documents) {
            IPs.push(IPtoInt(documents[i].allowedIP))
        }
        // sort the IPs array
        IPs.sort()
        console.log(IPs)
            // check if there are any gaps in IP assignment
        for (i in IPs) {
            // if so, return the gap IP. At the end of the array, it will compare to undefined, which will return true, and trigger it to return the next available IP.
            if (IPs[i] + 1 !== IPs[parseInt(i + 1)]) {
                return intToIP(IPs[i] + 1)
            }
        }
        // In case it's empty (undefined === undefined is true) return the next available IP, which is 0
        return intToIP(0)

    }

    // add a peer in CLI and save to database
    let peer = new Peer(JSON.parse(execSync('bash ./add.sh ' + await getAllowedIP()).toString()))

    peer.enabled = true
    peer.createdOn = new Date
    peer.user = user

    peer = await peer.save()

    // returns the publicKey of the peer so the user can identify it
    return peer.publicKey

}

// removes the peer in WireGuard CLI and updates the database
async function blockPeer(publicKey) {
    // look up the peer in database
    peer = await Peer.findOne({ publicKey: publicKey }).exec()

    // check if the peer exists
    if (!peer) {
        return "Peer not found"
    }
    peer.enabled = false
    await peer.save()

    // remove the peer from CLI
    // !! use peer.publicKey instead of publicKey to avoid command injection
    execSync('wg set wg0 peer ' + peer.publicKey + ' remove')
    return peer.publicKey
}

// restores the peer in the WireGuard CLI and updates the database
async function unblockPeer(publicKey) {
    // look up the peer in database
    peer = await Peer.findOne({ publicKey: publicKey }).exec()

    // check if the peer exists
    if (!peer) {
        return "Peer not found"
    }
    peer.enabled = true
    await peer.save()

    // add the peer to CLI
    // !! use peer.publicKey instead of publicKey to avoid command injection
    execSync('wg set wg0 peer ' + peer.publicKey + ' allowed-ips ' + peer.allowedIP + '/32')
    return peer.publicKey
}

// removes the peer in WireGuard CLI and the database 
async function removePeer(publicKey) {
    // look up the peer in database
    peer = await Peer.findOne({ publicKey: publicKey }).exec()

    // check if the peer exists
    if (!peer) {
        return "Peer not found"
    }

    // remove the peer from the database
    execSync('wg set wg0 peer ' + peer.publicKey + ' remove')

    // delete the peer from the database
    await peer.remove()

    return peer.publicKey
}

module.exports = {
    getStatus: getStatus,
    addPeer: addPeer,
    blockPeer: blockPeer,
    unblockPeer: unblockPeer,
    removePeer: removePeer,
    initialize: initialize
}