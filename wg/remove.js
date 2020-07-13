const { execSync } = require('child_process')

function remove(peer) {

    return execSync(`wg set wg0 peer ${peer.publicKey} remove`)

}

module.exports = { remove }