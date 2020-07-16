const execSync = require('child_process').execSync
const config = require('./config')
const { createConnection } = require('net')
const { concatAST } = require('graphql')
const Peer = require('./mongoose').Peer
const User = require('./mongoose').User

// initialize the WireGuard CLI according to the database
async function initialize() {
    // clear WireGuard CLI configurations, your wg0.conf should only contain the interface and no peers (unless you have default ones for access control)
    execSync('systemctl restart wg-quick@wg0')

    // load peers in the database into CLI (if it is enabled)
    return Peer.find({ enabled: true })
        .then(peers => {
            for (i in peers) {
                execSync('wg set wg0 peer ' + peers[i].publicKey + ' allowed-ips ' + peers[i].allowedIP + '/32')
            }
        })

}

// add a peer in WireGuard CLI and updates the database
async function addPeer(args) {
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

        // check if there are any gaps in IP assignment
        for (i in IPs) {
            // if so, return the gap IP. At the end of the array, it will compare to undefined, which will return true, and trigger it to return the next available IP.
            if (IPs[i] + 1 !== IPs[parseInt(i) + 1]) {
                return intToIP(IPs[i] + 1)
            }
        }
        // In case it's empty (undefined === undefined is true) return the next available IP, which is 0
        return intToIP(0)
    }

    // add a peer in CLI and save to database
    let peer = new Peer(JSON.parse(execSync('bash ./add.sh ' + await getAllowedIP()).toString()))

    peer.enabled = true
    peer.user = args.user
    peer.description = args.description

    peer = await peer.save()

    // returns the publicKey of the peer so the user can identify it
    return peer.publicKey

}

// removes the peer in WireGuard CLI and updates the database
async function blockPeer(args) {
    // look up the peer in database
    peer = await Peer.find(args).exec()

    // check if the peers exist
    if (!peer.length) {
        return []
    }

    for (i in peer) {
        // add the peer to CLI
        // !! use peer.publicKey instead of publicKey to avoid command injection
        execSync('wg set wg0 peer ' + peer[i].publicKey + ' remove')
        peer[i].enabled = false
        await peer[i].save()
    }

    return peer.map(x => x.publicKey)
}

// restores the peer in the WireGuard CLI and updates the database
async function unblockPeer(args) {
    // look up the peer in database
    peer = await Peer.find(args).exec()

    // check if the peers exist
    if (!peer.length) {
        return []
    }

    for (i in peer) {
        // add the peer to CLI
        // !! use peer.publicKey instead of publicKey to avoid command injection
        execSync('wg set wg0 peer ' + peer[i].publicKey + ' allowed-ips ' + peer[i].allowedIP + '/32')
        peer[i].enabled = true
        await peer[i].save()
    }

    return peer.map(x => x.publicKey)
}

// removes the peer in WireGuard CLI and the database 
async function removePeer(args) {
    // look up the peer in database
    peer = await Peer.find(args).exec()

    // check if the peers exist
    if (!peer.length) {
        return []
    }

    // remove each of the peer from the database
    for (i in peer) {
        execSync('wg set wg0 peer ' + peer[i].publicKey + ' remove')
        await peer[i].remove()
    }

    return peer.map(x => x.publicKey)
}

// add a user to the database
async function addUser(args) {
    // check if the database already have a overlapping username
    if (await User.findOne({ name: args.name })) {
        return 'User already exists'
    }

    let user = new User(args)
    user.save()
    return user.name
}

// read data from WireGuard CLI into the database (upload, download, time used, etc.)
async function checkStatus() {
    // check individual peers
    // get all active peers from CLI
    // peers = JSON.parse(execSync('bash ./json.sh').toString()).peers

    peers = [{
            publicKey: 'TMJiEy7apxmFmW85X4OdDPWVlLmVlHLE9ncuwFFD6Q0=',
            endpoint: '(none)',
            latestHandshake: 1,
            upload: 2,
            download: 434,
            allowedIP: '10.9.0.10/32'
        },
        {
            publicKey: 'k6797pLTAoGaFDjZUNgm7chE/T43sdgIDmQJ4/O6BHg=',
            endpoint: '(none)',
            latestHandshake: 0,
            upload: 0,
            download: 0,
            allowedIP: '10.9.0.11/32'
        },
        {
            publicKey: 'eL3dKZHg6I/qWOK7TRjKpTFZzs0ApvoB+w6aNffIKEg=',
            endpoint: '(none)',
            latestHandshake: 0,
            upload: 0,
            download: 477777,
            allowedIP: '10.9.0.12/32'
        }
    ]

    // loop through each peer
    for (i in peers) {
        // locate peer in the database
        peer = await Peer.findOne({ publicKey: peers[i].publicKey })

        // check upload and download

        // check if WG CLI has inreased
        if (parseInt(peers[i].upload) > parseInt(peer.lastUpload) || parseInt(peers[i].download) > parseInt(peer.lastDownload)) {
            // the peer has used data
            // log the amount into upload and download counter

            peer.upload = parseInt(peer.upload) + peers[i].upload - parseInt(peer.lastUpload)
            peer.download = parseInt(peer.download) + peers[i].download - parseInt(peer.lastDownload)

            // check if the peer has exceeded the quota
            if (parseInt(peer.upload) + parseInt(peer.download) > parseInt(peer.dataLimit)) {
                // the peer has exceeded the quota, block further connections
                blockPeer({ publicKey: peer.publicKey })

                // notify the main site of the action
                sendMessage({
                    type: 'disable',
                    peer: peer.publicKey,
                    reason: 'data'
                })
            }
        }
        // if the WG CLI has decreased, then assume it has been reset, add untracked data to database (WG CLI cannot decrease, because it can only be added by the user using the connection)
        if (parseInt(peers[i].upload) < parseInt(peer.lastUpload) || parseInt(peers[i].download) < parseInt(peer.lastDownload)) {
            peer.upload = parseInt(peer.upload) + peers[i].upload
            peer.download = parseInt(peer.download) + peers[i].download
        }

        // save lastUpload and lastDownload marker into database
        peer.lastUpload = peers[i].upload
        peer.lastDownload = peers[i].download

        // check time used

        // check if the peer has conducted a handshake (the latestHandshake will increment to current date every 2 minutes whenever a connection is maintained, so it will deviate the record in the database)
        if (peers[i].latestHandshake != peer.latestHandshake && peers[i].latestHandshake != '0') {
            // the peer has conducted a handshake

            peer.timeUsed = parseInt(peer.timeUsed) + 120000 // 2 minutes in ms

            // save marker into database
            peer.latestHandshake = peers[i].latestHandshake

            // check if the peer has exceeded the quota
            if (parseInt(peer.timeUsed) > parseInt(peer.timeLimit)) {
                // the peer has exceeded the quota, block further connection
                blockPeer({ publicKey: peer.publicKey })

                // notify the main site of the action
                sendMessage({
                    type: 'disable',
                    peer: peer.publicKey,
                    reason: 'time'
                })
            }
        }

        // save peer information into database
        peer.save()
    }

    // check individual users
    User.find()
        .then(async users => {
            // loop through each user
            for (i in users) {
                // get all peers belonged to the user
                userPeers = await Peer.find({ user: users[i].name }).exec()

                // get the users total usage data from peers database and write to user database
                users[i].upload = userPeers.map(x => parseInt(x.upload)).reduce((a, b) => a + b)
                users[i].download = userPeers.map(x => parseInt(x.download)).reduce((a, b) => a + b)
                users[i].timeUsed = userPeers.map(x => parseInt(x.timeUsed)).reduce((a, b) => a + b)

                users[i].save()

                // check if the user has exceeded the data limit quota
                if (parseInt(users[i].upload) + parseInt(users[i].download) > parseInt(users[i].dataLimit)) {
                    // disable all of the user's peers
                    blockPeer({ user: users[i].name })

                    // notify the main site of the action
                    sendMessage({
                        type: 'disable',
                        user: users[i].name,
                        reason: 'data'
                    })
                }

                // check if the user has exceeded the time limit quota
                if (parseInt(users[i].timeUsed) > parseInt(users[i].timeLimit)) {
                    // disable all of the user's peers
                    blockPeer({ user: users[i].name })

                    // notify the main site of the action
                    sendMessage({
                        type: 'disable',
                        user: users[i].name,
                        reason: 'time'
                    })
                }
            }
        })
}

function sendMessage(message) {
    const http = require('http')

    const req = http.request({
        hostname: process.env.MAIN_SITE_DOMAIN,
        port: process.env.MAIN_SITE_PORT,
        path: process.env.MAIN_SITE_ROUTE,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': data.length
        }
    })

    req.write(message)
    req.end()
}

module.exports = {
    checkStatus: checkStatus,
    addPeer: addPeer,
    blockPeer: blockPeer,
    unblockPeer: unblockPeer,
    removePeer: removePeer,
    addUser: addUser,
    initialize: initialize
}