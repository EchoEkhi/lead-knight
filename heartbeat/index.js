const { Peer, User } = require('../db/index')

const wg = require('../wg/index')

async function heartbeat() {

    // todo: read peers into users

    const wgPeers = await wg.read()

    Peer.find()
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

            dbPeer.save()

        }))
        // reinit the WG interface if out of sync
        .catch(() => wg.init())

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