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

const breizbotUrl = process.env.BREIZBOT_URL
if (pwd == undefined) {
	console.log('env BREIZBOT_URL is not defined')
	process.exit(1)
}

const Client = require('../lib/client')


const globalConfig = require('../config/config.js')
const {masterHost, masterPort} = globalConfig


const masterUrl = `ws://${masterHost}:${masterPort}/${agentName}`
const masterClient = new Client(masterUrl)

//const port = 80

const url = `wss://${userName}:${pwd}@${breizbotUrl}/homebox/bridge`
console.log('url', url)

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

let pingOk = true
let timer = null

function onTimeout() {
	if (!pingOk) {
		console.log('pong timeout')
		client.close()
		return
	}
	pingOk = false
	client.sendMsg({type: 'ping'})	
}

client.on('connect', () => {
	console.log('onConnect')
	pingOk = true
	timer = setInterval(onTimeout, 10000)	
})


client.on('disconnect', () => {
	console.log('onDisconnect')
	clearInterval(timer)
})

client.on('pong', () => {
	//console.log('onPong')
	pingOk = true
})
