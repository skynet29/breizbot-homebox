const agentName = process.argv[2]

if (typeof agentName != 'string') {
	console.log('Please, specify agent name')
	process.exit(1)
}

const EventEmitter = require('eventemitter2').EventEmitter2	


const globalConfig = require('../config/config.js')
const {masterHost, masterPort} = globalConfig


const url = `ws://${masterHost}:${masterPort}/${agentName}`

const Client = require('./client')

const topics = new EventEmitter({wildcard: true})
const services = new EventEmitter()

const registeredTopics = {}
const registeredServices = {}

const client = new Client(url)

let onShutdownCb = null

client.on('message', (msg) => {
	console.log('[Agent] msg', msg)
	if (msg.type == 'ready') {
		// topics.eventNames().forEach((topic) => {
		// 	client.sendMsg({type: 'register', topic})	
		// })		
		Object.keys(registeredTopics).forEach((topic) => {
			client.sendMsg({type: 'register', topic})	
		})	

		Object.keys(registeredServices).forEach((srvName) => {
			client.sendMsg({type: 'registerService', srvName})	
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

	if (msg.type == 'callService') {
		const func = registeredServices[msg.srvName]
		if (typeof func == 'function') {
			let respMsg = {
				type: 'callServiceResp',
				srvName: msg.srvName,
				dest: msg.src
			}
			const data = func(msg.data)
			if (data instanceof Promise) {
				data.then((resp) => {
					respMsg.data = resp
					client.sendMsg(respMsg)						
				})
				.catch((err) => {
					respMsg.err = err
					client.sendMsg(respMsg)						
				})
			}
			else {
				respMsg.data = data
				client.sendMsg(respMsg)			
			}
		}		
	}

	if (msg.type == 'callServiceResp') {
		services.emit(msg.srvName, msg)
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
	registeredTopics[topic] = 1
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

function registerService(srvName, callback) {
	registeredServices[srvName] = callback
	client.sendMsg({type: 'registerService', srvName})
}

function callService(srvName, data) {
	console.log('[Client] callService', srvName, data)
	return new Promise((resolve, reject) => {
		services.once(srvName, function(msg) {
			if (msg.err != undefined) {
				reject(msg.err)
			}
			else {
				resolve(msg.data)
			}
		})

		client.sendMsg({
			type: 'callService',
			srvName,
			data
		})
	})
}

module.exports = {
	start,
	onConnect,
	onShutdown,
	register,
	unregister,
	emitTopic,
	sendCmd,
	registerService,
	callService,
	config: globalConfig[agentName] || {}

}



