const execSync = require('child_process').execSync

function getStatus() {
    return JSON.parse(execSync('bash ./json.sh'))
}



module.exports = {
    getStatus: getStatus
}