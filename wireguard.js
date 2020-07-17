const execSync = require('child_process').execSync
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
async function addPeer(data) {
    // function to generate a valid peer IP in sequence in the database
    async function getAllowedIP() {
        function IPtoInt(IP) {
            return (IP.split('.')[2] * 200) + (IP.split('.')[3] - 10)
        }

        function intToIP(count) {
            return process.env.LOCAL_IP_RANGE + Math.floor(count / 200).toString() + '.' + ((count % 200) + 10).toString()
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

    // check if the user has reached their peer limit
    // check if the new peer has a user attribute
    if (data.user) {
        let user = await User.findOne({ name: data.user }).exec()

        // check if the user has reached their peer limit
        if (await Peer.countDocuments({ user: user.name }) >= user.peerLimit) {
            return
        }
    }

    // add a peer in CLI and save to database
    let peer = new Peer(JSON.parse(execSync('bash ./add.sh ' + await getAllowedIP()).toString()))

    // default enabled to true if it's not provided
    peer.enabled = data.enabled === undefined ? true : data.enabled

    // assign other optional attributes
    peer.user = data.user
    peer.description = data.description
    peer.dataLimit = data.dataLimit
    peer.timeLimit = data.timeLimit

    // write to database
    peer = await peer.save()

    // check if peer is disabled by default
    if (!peer.enabled) {
        // if so, disable the peer
        blockPeers({ publicKey: peer.publicKey })
    }

    // return the peer object
    return peer

}

// updates a peer's attributes
async function updatePeers(filter, data) {
    // look up the peer in the database
    let peers = await Peer.find(filter).exec()

    // check if the peers exist
    if (!peers.length) {
        return []
    }

    peers.forEach(peer => {
        // if undefined, do not write; if null, delete data by setting undefined; else, write new data
        if (data.user !== undefined) {
            peer.user = data.user === null ? undefined : data.user
        }
        if (data.description !== undefined) {
            peer.description = data.description === null ? undefined : data.description
        }
        if (data.dataLimit !== undefined) {
            peer.dataLimit = data.dataLimit === null ? undefined : data.dataLimit
        }
        if (data.timeLimit !== undefined) {
            peer.timeLimit = data.timeLimit === null ? undefined : data.timeLimit
        }
        if (data.enabled !== undefined) {
            if (data.enabled) {
                unblockPeers({ publicKey: peer.publicKey })
            } else {
                blockPeers({ publicKey: peer.publicKey })
            }
        }

        // write changes to database
        peer.save()
    })

    return peers
}

// clears a peer's usage attributes
async function clearPeers(filter) {
    // look up the peer in the database
    let peers = await Peer.find(filter).exec()

    // check if the peers exist
    if (!peers.length) {
        return []
    }

    peers.forEach(peer => {
        // reset the peer's usage attributes
        peer.upload = '0'
        peer.download = '0'
        peer.timeUsed = '0'

        // reenable the peer
        unblockPeers({ publicKey: peer.publicKey })

        // write changes to database
        peer.save()
    })

    return peers
}

// removes peers in WireGuard CLI and the database 
async function removePeers(filter) {
    // look up peers in database
    let peers = await Peer.find(filter).exec()

    // check if the peers exist
    if (!peers.length) {
        return []
    }

    // remove each of the peer from the database
    peers.forEach(peer => {
        execSync('wg set wg0 peer ' + peer.publicKey + ' remove')
        peer.remove()
    })

    return peers
}

// add a user to the database
async function addUser(name, data) {
    // check if the database already have a overlapping username
    if (await User.findOne({ name: name })) {
        return
    }

    // create new user object
    let user = new User({
        name: name,
        ...data
    })

    // save new user to database
    user.save()

    return user
}

// update users' attributes
async function updateUsers(filter, data) {
    // look up users in database
    let users = await User.find(filter).exec()

    // check if users exist
    if (!users.length) {
        return
    }

    users.forEach(user => {
        // if undefined, do not write; if null, delete data by setting undefined; else, write new data
        if (data.dataLimit !== undefined) {
            user.dataLimit = data.dataLimit === null ? undefined : data.dataLimit
        }
        if (data.timeLimit !== undefined) {
            user.timeLimit = data.timeLimit === null ? undefined : data.timeLimit
        }
        if (data.peerLimit !== undefined) {
            user.peerLimit = data.peerLimit === null ? undefined : data.peerLimit
        }

        // write changes to database
        user.save()
    })

    return users
}

// clear user's attributes
async function clearUsers(filter) {
    // look up users in database
    let users = await User.find(filter).exec()

    // check if users exist
    if (!users.length) {
        return
    }

    users.forEach(user => {
        // reset the user's peers attributes and unblock them
        clearPeers({ user: user.name })

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
async function removeUsers(filter) {
    // look up users in database
    let users = await User.find(filter).exec()

    // check if users exist
    if (!users.length) {
        return
    }

    users.forEach(user => {
        // remove all peers belonging to the user
        removePeers({ user: user.name })

        // remove the user from the database
        user.remove()
    })

    return users
}

// read data from WireGuard CLI into the database (upload, download, time used, etc.)
async function checkStatus() {
    // check individual peers
    // get all active peers from CLI
    let peers = JSON.parse(execSync('bash ./json.sh').toString()).peers

    /*
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
    */

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
                blockPeers({ publicKey: peer.publicKey })

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
                blockPeers({ publicKey: peer.publicKey })

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
                // try catch in case the user does not have any peers (array.reduce function would fail)
                try {
                    users[i].upload = userPeers.map(x => parseInt(x.upload)).reduce((a, b) => a + b)
                    users[i].download = userPeers.map(x => parseInt(x.download)).reduce((a, b) => a + b)
                    users[i].timeUsed = userPeers.map(x => parseInt(x.timeUsed)).reduce((a, b) => a + b)
                } catch (e) {

                }

                // check if the user has exceeded the data limit quota
                if (parseInt(users[i].upload) + parseInt(users[i].download) > parseInt(users[i].dataLimit)) {
                    // disable all of the user's peers
                    blockPeers({ user: users[i].name })

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
                    blockPeers({ user: users[i].name })

                    // notify the main site of the action
                    sendMessage({
                        type: 'disable',
                        user: users[i].name,
                        reason: 'time'
                    })
                }

                users[i].save()
            }
        })
}

// send a message back to the main site to inform it of changes (quota exceeded, etc)
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

// removes peers in WireGuard CLI and updates the database
async function blockPeers(args) {
    // look up the peer in database
    let peers = await Peer.find(args).exec()

    // check if the peers exist
    if (!peers.length) {
        return []
    }

    for (i in peers) {
        // add the peer to CLI
        // !! use peer.publicKey instead of publicKey to avoid command injection
        execSync('wg set wg0 peer ' + peers[i].publicKey + ' remove')
        peers[i].enabled = false
        await peers[i].save()
    }

    return peers.map(x => x.publicKey)
}

// restores peers in the WireGuard CLI and updates the database
async function unblockPeers(args) {
    // look up the peer in database
    let peers = await Peer.find(args).exec()

    // check if the peers exist
    if (!peers.length) {
        return []
    }

    for (i in peers) {
        // add the peer to CLI
        // !! use peer.publicKey instead of publicKey to avoid command injection
        execSync('wg set wg0 peer ' + peers[i].publicKey + ' allowed-ips ' + peers[i].allowedIP + '/32')
        peers[i].enabled = true
        await peers[i].save()
    }

    return peers.map(x => x.publicKey)
}

module.exports = {
    checkStatus: checkStatus,
    addPeer: addPeer,
    updatePeers: updatePeers,
    clearPeers: clearPeers,
    removePeers: removePeers,
    addUser: addUser,
    updateUsers: updateUsers,
    clearUsers: clearUsers,
    removeUsers: removeUsers,
    initialize: initialize
}