const { execSync } = require('child_process')

const { Peer } = require('../db/index')

// function to generate a valid peer IP in sequence in the database
async function getAllowedIP() {

    function incrementIp(input) {

        const tokens = input.split('.')

        if (tokens.length !== 4) throw new Error('Invalid IP address')

        for (let i = tokens.length - 1; i >= 0; i--) {

            const item = parseInt(tokens[i], 10)

            if (item < 200) {

                tokens[i] = item + 1
                for (let j = i + 1; j < 4; j++) {

                    tokens[j] = '0'

                }
                break

            }

        }

        return `${tokens[0]}.${tokens[1]}.${tokens[2]}.${tokens[3]}`

    }


    const peers = await Peer.find()

    // loop through all peers and extract allowedIP into IPs

    if (!peers.length) return process.env.INITIAL_IP

    const ipsArray = []

    for (const i in peers) {

        const allowedIPStr = peers[i].allowedIP

        ipsArray.push(allowedIPStr)

    }

    ipsArray.sort((a, b) => {

        const num1 = Number(a.split('.').map((num) => `000${num}`.slice(-3))
            .join(''))
        const num2 = Number(b.split('.').map((num) => `000${num}`.slice(-3))
            .join(''))


        return num1 - num2

    })

    return incrementIp(ipsArray[ipsArray.length - 1])

}

async function create() {

    return JSON.parse(await execSync(`bash ./add.sh ${await getAllowedIP()}`))

}

module.exports = { create }