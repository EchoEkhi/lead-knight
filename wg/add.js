const { execSync } = require('child_process')

function add(peer) {

    return execSync(`wg set wg0 peer ${peer.publicKey} allowed-ips ${peer.allowedIP}/32`)

}

module.exports = { add }