const { execSync } = require('child_process')

const { Peer } = require('../db/index')

// function to generate a valid peer IP in sequence in the database
async function getAllowedIP() {

    function IPtoInt(IP) {

        return IP.split('.')[2] * 200 + (IP.split('.')[3] - 10)

    }

    function intToIP(count) {

        return `${process.env.LOCAL_IP_RANGE + Math.floor(count / 200).toString()}.${(count % 200 + 10).toString()}`

    }

    const peers = await Peer.find()
    const IPs = []

    // loop through all peers and extract allowedIP into IPs
    peers.forEach(peer => IPs.push(IPtoInt(peer.allowedIP)))

    // sort the IPs array
    IPs.sort()

    // check if there are any gaps in IP assignment
    for (let i = 0; i < IPs.length; i++) {

        // if so, return the gap IP. At the end of the array, it will compare to undefined, which will return true, and trigger it to return the next available IP.
        if (IPs[i] + 1 !== IPs[i + 1]) {

            return intToIP(IPs[i] + 1)

        }

    }

    // in case it's empty (undefined === undefined is true), return the next available IP, which is 0
    return intToIP(0)

}

async function create() {

    return JSON.parse(await execSync(`bash ./add.sh ${await getAllowedIP()}`))

}

module.exports = { create }