const { execSync } = require('child_process')

async function read() {

    return JSON.parse(await execSync('bash ./json.sh')).peers

}

module.exports = { read }