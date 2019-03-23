const agentName = process.argv[2]

if (typeof agentName != 'string') {
	console.log('Please, specify agent name')
	process.exit(1)
}

const userName = process.env.BREIZBOT_USER
if (userName == undefined) {
	console.log('env BREIZBOT_USER is not defined')
	process.exit(1)
}
const pwd = process.env.BREIZBOT_PWD
if (pwd == undefined) {
	console.log('env BREIZBOT_PWD is not defined')
	process.exit(1)
}

const Client = require('../lib/client')


const globalConfig = require('../config/config.js')
const {masterHost, masterPort} = globalConfig


const masterUrl = `ws://${masterHost}:${masterPort}/${agentName}`
const masterClient = new Client(masterUrl)


const host = 'com.breizbot.ovh'
const port = 8090

const url = `wss://${userName}:${pwd}@${host}:${port}/homebox/bridge`

const client = new Client(url)

masterClient.on('message', function(msg) {
	console.log('masterMessage', msg)
	client.sendMsg(msg)
})


client.on('message', function(msg) {
	console.log('message', msg)
	masterClient.sendMsg(msg)
})

client.connect()
masterClient.connect()
