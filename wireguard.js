const execSync = require('child_process').execSync
const config = require('./config')
const Peer = require('./mongoose').Peer

function getStatus() {
    return JSON.parse(execSync('bash ./json.sh'))
}

// add a peer in WireGuard CLI and update the database
async function addPeer(user) {
    // generate a valid peer IP in sequence

    console.log(await Peer.find({}).exec())

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
function blockPeer(publicKey) {

    return execSync('bash ./block.sh ' + publicKey).toString()
}

// restores the peer in the WireGuard CLI and updates the database
function unblockPeer(publicKey) {

}

module.exports = {
    getStatus: getStatus,
    addPeer: addPeer,
    blockPeer: blockPeer
}