
const types = {
	'IOT.SMARTPLUGSWITCH': {
		actions: {
			'on': {
				label: 'On',
				method: function(device) {
					device.setPowerState(true)
				}
			},

			'off': {
				label: 'Off',
				method: function(device) {
					device.setPowerState(false)
				}
			}

		},
		events: {
			'power-on': function(device) {
				console.log('power-on')
				device.state = 1
			},

			'power-off': function(device) {
				console.log('power-off')
				device.state = 0
			}
		}
	}
}

const agent  = require('../lib/agent')

agent.register('homebox.tplink.cmd', function(msg) {
	console.log('msg', msg)
	if (msg.hist === true) {
		return
	}
	const {cmd, deviceId} = msg.data

	const device = devices[deviceId]

	const action = device.actions[cmd]

	action.method(device.adapter)

})


const { Client } = require('tplink-smarthome-api')
 

 const client = new Client()

 const devices = {}

// Look for devices, log to console, and turn them on
client.startDiscovery()
.on('device-new', (device) => {
  //device.setPowerState(false)
  device.getSysInfo().then((info) => {

  	console.log('info', info)

  	const type = info.type

  	const actions = types[type].actions


  	 devices[info.deviceId] = {
  	 	type: info.dev_name,
  	 	state: info.relay_state,
  	 	alias: info.alias,
  	 	adapter: device,
  	 	actions	  	 	
  	 }


  	 const events = types[type].events || {}

  	 for(let ev in events) {

  	 	device.on(ev, () => {
  	 		events[ev](devices[info.deviceId])
  	 		sendStatus()
  	 	})
  	 }


	sendStatus()

  })
 
})



function sendStatus() {
	let data = []
	for(let deviceId in devices) {

		const device = devices[deviceId]
		const {alias, type, state} = device
		const actions = []
		for(let a in device.actions) {
			const action = device.actions[a]
			actions.push({cmd: a, label: action.label})
		}


		data.push({alias, type, state, deviceId, actions})

	}

	//console.log('sendStatus', data)

	agent.emitTopic('homebox.tplink.status', data)		

}


agent.onConnect(sendStatus)
agent.start()

