const { execSync } = require('child_process')

const { Peer } = require('../db/index')

const { add } = require('./add')

// initialize the WireGuard CLI according to the database
function init() {

    // clear WireGuard CLI configurations, your wg0.conf should only contain the interface and no peers (unless you have default ones for access control)
    execSync('systemctl restart wg-quick@wg0')

    // load peers in the database into CLI (if it is enabled)
    return Peer.find({ enabled: true })
        .then(peers => {

            peers.forEach(peer => add(peer))

        })

}

module.exports = { init }