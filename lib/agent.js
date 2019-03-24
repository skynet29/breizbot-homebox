const agentName = process.argv[2]

if (typeof agentName != 'string') {
	console.log('Please, specify agent name')
	process.exit(1)
}

const EventEmitter = require('events').EventEmitter	


const globalConfig = require('../config/config.js')
const {masterHost, masterPort} = globalConfig


const url = `ws://${masterHost}:${masterPort}/${agentName}`

const Client = require('./client')

const topics = new EventEmitter()

const client = new Client(url)

let onShutdownCb = null

client.on('message', (msg) => {
	console.log('[Agent] msg', msg)
	if (msg.type == 'ready') {
		topics.eventNames().forEach((topic) => {
			client.sendMsg({type: 'register', topic})	
		})			
	}
	if (msg.type == 'notif') {
		topics.emit(msg.topic, msg)
	}
	if (msg.type == 'cmd' && msg.cmd == 'shutdown') {
		if (typeof onShutdownCb == 'function') {
			onShutdownCb()
		}
		console.log('Bye bye !')
		process.exit(0)
	}
})

function start() {
	client.connect()
}

function onShutdown(callback) {
	onShutdownCb = callback
}

function onConnect(callback) {
	client.on('connect', callback)
}

function register(topic, callback) {
	console.log('[Agent] register', topic)
	topics.on(topic, callback)
	client.sendMsg({type: 'register', topic})	
}

function unregister(topic, callback) {
	topics.off(topic, callback)
	const nbListeners = topics.listeners(topic).length

	if (nbListeners == 0) { // no more listeners for this topic
		client.sendMsg({type: 'unregister', topic})
	}		
}	

function emitTopic(topic, data) {
	console.log('[Agent] emitTopic', topic, data)
	client.sendMsg({type: 'notif', topic, data})
}

function sendCmd(dest, cmd, data) {
	console.log('[Agent] sendCmd', dest, cmd, data)
	client.sendMsg({type: 'cmd', dest, cmd, data})
}

module.exports = {
	start,
	onConnect,
	onShutdown,
	register,
	unregister,
	emitTopic,
	sendCmd,
	config: globalConfig[agentName] || {}

}



