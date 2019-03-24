const agent  = require('../../lib/agent')

const devicesDesc = agent.config.devices || {}

//console.log('devicesDesc', devicesDesc)

const typesDesc = require('./lib/types.js')

var five = require("johnny-five")
var board = new five.Board({
	repl: false
});

board.on("ready", function() {
	initDevices()
	sendStatus()
});

const devices = {}

function initDevices() {
	console.log('initDevices')
	for(let deviceId in devicesDesc) {

		console.log('deviceId', deviceId)

		const deviceDesc = devicesDesc[deviceId]
		//console.log('deviceDesc', deviceDesc)
		const {type, options, alias} = deviceDesc

		const typeDesc = typesDesc[type]
		if (typesDesc == undefined) {
			console.log('unknown device type', type)
			process.exit(0)
		}

		//console.log('typeDesc', typeDesc)

		const properties = {}
		for(let propName in typeDesc.properties) {
			properties[propName] = typeDesc.properties[propName].value
		}

		//console.log('properties', properties)

		const adapter = typeDesc.create(options)

		const device = devices[deviceId] = {
			adapter, 
			properties,
			alias,
			type
		}

		const events = typeDesc.events || {}
		for(let ev in events) {
			adapter.on(ev, function() {
				events[ev](device)
				sendStatus()
			})
		}


	}
}

function sendStatus() {
	const data = []
	for(let deviceId in devices) {

		const {type, properties, alias} = devices[deviceId]
		data.push({type, properties, alias, deviceId})
	}

	agent.emitTopic('homebox.arduino.status', data)

}

agent.onConnect(function() {
	agent.emitTopic('homebox.arduino.types', typesDesc)
})

agent.register('homebox.arduino.cmd', function(msg) {
	console.log('Receive msg', msg.data)
	const {cmd, deviceId} = msg.data
	console.log('deviceId', deviceId, 'cmd', cmd)

	const device = devices[deviceId]
	if (device == undefined) {
		console.log('unknown device', deviceId)
		return
	}

	const {actions} = typesDesc[device.type]
	const action = actions[cmd]

	if (action && typeof action.method == 'function') {
		action.method(device, msg.data.args)
		sendStatus()
	}


})


agent.start()
