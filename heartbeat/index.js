const { Peer, User, Server } = require('../db/index')

const wg = require('../wg/index')

async function heartbeat() {

    const wgPeers = await wg.read()

    const server = await Server.findOne({ serverSettings: true })

    // reset server statistics
    server.upload = '0'
    server.download = '0'
    server.timeUsed = '0'

    await Peer.find({ enabled: true })
        .then(dbPeers => dbPeers.forEach(dbPeer => {

            const wgPeer = wgPeers.find(peer => peer.publicKey === dbPeer.publicKey)

            // detect unexpected wg interface reset
            if (!wgPeer) throw new Error('Out of sync')

            // detect an unexpected reset by resetting lastValues to 0 when lastValues > wgValues
            if (
                parseInt(dbPeer.lastUpload, 10) > wgPeer.upload ||
                parseInt(dbPeer.lastDownload, 10) > wgPeer.download
            ) {

                dbPeer.lastUpload = '0'
                dbPeer.lastDownload = '0'

            }

            // accumulate the difference between wgValue and last wgValue
            dbPeer.upload = (
                parseInt(dbPeer.upload, 10) +
                wgPeer.upload -
                parseInt(dbPeer.lastUpload, 10)
            ).toString()

            dbPeer.lastUpload = wgPeer.upload

            dbPeer.download = (
                parseInt(dbPeer.download, 10) +
                wgPeer.download -
                parseInt(dbPeer.lastDownload, 10)
            ).toString()

            dbPeer.lastDownload = wgPeer.download

            // for timeUsed, check if latestHandshake === wgLatestHandshake
            if (dbPeer.latestHandshake < wgPeer.latestHandshake.toString()) {

                // if not, latestHandshake = wgLatestHandshake and accumulate 120 seconds
                dbPeer.timeUsed = (
                    parseInt(dbPeer.timeUsed, 10) +
                    120
                ).toString()

            }

            // only set latestHandshake reference to wgLatestHandshake when not 0 to avoid losing record after reset
            if (wgPeer.latestHandshake !== 0) dbPeer.latestHandshake = wgPeer.latestHandshake.toString()

            // log endpoint
            if (wgPeer.endpoint !== '(none)') dbPeer.endpoint = wgPeer.endpoint

            // check limits
            if (dbPeer.dataLimit) {

                if (parseInt(dbPeer.upload, 10) + parseInt(dbPeer.download, 10) > parseInt(dbPeer.dataLimit, 10)) {

                    dbPeer.enable = false
                    wg.remove(dbPeer)

                }

            }

            if (dbPeer.timeLimit) {

                if (parseInt(dbPeer.timeUsed, 10) > parseInt(dbPeer.timeLimit, 10)) {

                    dbPeer.enable = false
                    wg.remove(dbPeer)

                }

            }

            // accumulate server statistics
            server.upload = (
                parseInt(server.upload, 10) +
                parseInt(dbPeer.upload, 10)
            ).toString()

            server.download = (
                parseInt(server.download, 10) +
                parseInt(dbPeer.download, 10)
            ).toString()

            server.timeUsed = (
                parseInt(server.timeUsed, 10) +
                parseInt(dbPeer.timeUsed, 10)
            ).toString()

            dbPeer.save()

        }))
        // reinit the WG interface if out of sync
        .catch(() => wg.init())

    server.save()

    User.find()
        .then(users => users.forEach(user => {

            // reset user's values
            user.upload = '0'
            user.download = '0'
            user.timeUsed = '0'

            // loop through peers and accumulate
            Peer.find({ user: user.name })
                .then(peers => peers.forEach(peer => {

                    user.upload = (
                        parseInt(user.upload, 10) +
                        parseInt(peer.upload, 10)
                    ).toString()

                    user.download = (
                        parseInt(user.download, 10) +
                        parseInt(peer.download, 10)
                    ).toString()

                    user.timeUsed = (
                        parseInt(user.timeUsed, 10) +
                        parseInt(peer.timeUsed, 10)
                    ).toString()

                }))

            // check limits
            if (user.dataLimit) {

                if (parseInt(user.upload, 10) + parseInt(user.download, 10) > parseInt(user.dataLimit, 10)) {

                    Peer.find({ user: user.name })
                        .then(peers => peers.forEach(peer => {

                            peer.enable = false
                            wg.remove(peer)

                        }))

                }

            }

            if (user.timeLimit) {

                if (parseInt(user.timeUsed, 10) > parseInt(user.timeLimit, 10)) {

                    Peer.find({ user: user.name })
                        .then(peers => peers.forEach(peer => {

                            peer.enable = false
                            wg.remove(peer)

                        }))

                }

            }

            user.save()

        }))

}

module.exports = heartbeat