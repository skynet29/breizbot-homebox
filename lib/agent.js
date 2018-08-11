const agentName = process.argv[2]

if (typeof agentName != 'string') {
	console.log('Please, specify agent name')
	process.exit(1)
}

const fs = require('fs')
const globalConfig = require('../config/config.json')

const options = {
	port: globalConfig.masterPort,
	host: globalConfig.masterHost,
	userName:  globalConfig.masterUser,
	agentName
}

const Client = require('./client')



var client  = new Client(options)

var onCloseFn = null

client.on('shutdown', function() {
	console.log('shutdown')
	if (typeof onCloseFn == 'function') {
		onCloseFn()
	}
	process.exit(0)
})

module.exports = {

	start: function() {
		client.connect()
	},

	onMsg: function(topic, callback) {
		client.on(topic, callback)
	},

	onConnect: function(callback) {
		client.events.on('connect', callback)
	},	

	onClose: function(callback) {
		onCloseFn = callback
	},

	emit: function(topic, data) {
		client.emit(topic, data)
	},

	register: function(topic, getLast, callback) {
		client.register(topic, getLast, callback)
	},

	registerService: function(srvName, func) {
		client.registerService(srvName, func)
	},

	callService: function(srvName, data) {
		return client.callService(srvName, data)
	},

	config: globalConfig[agentName] || {}
}



