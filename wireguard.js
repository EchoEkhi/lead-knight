const execSync = require('child_process').execSync
    /*
    function getStatus() {
        let output

        exec('bash ./json.sh', (err, stdout, stderr) => {
            output = JSON.parse(stdout)
            console.log(output)
        })

        return output
    }
    */

function getStatus() {
    return JSON.parse(execSync('bash ./json.sh'))
}


module.exports = {
    getStatus: getStatus
}