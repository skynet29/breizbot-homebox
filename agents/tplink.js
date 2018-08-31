const agent  = require('../lib/agent')

agent.register('tplink.action.*', false, function(msg) {
	console.log('Receive msg', msg)
	const deviceId = msg.topic.split('.')[2]
	console.log('deviceId', deviceId)

	const device = devices[deviceId].adapter
	//console.log('device', device)


	const action = msg.data && msg.data.action

	switch (action)	{
		case 'on':
			device.setPowerState(true)
		break
		case 'off':
			device.setPowerState(false)
		break
	}
	//console.log('ret', ret)
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
  	 devices[info.deviceId] = {
  	 	type: info.dev_name,
  	 	state: info.relay_state,
  	 	alias: info.alias,
  	 	adapter: device	  	 	
  	 }

	if (info.type === 'IOT.SMARTPLUGSWITCH') {
		device.on('power-on', () => {
			console.log('power-on')
			devices[info.deviceId].state = 1
			sendStatus()
		})
		device.on('power-off', () => {
			console.log('power-off')
			devices[info.deviceId].state = 0
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

		data.push({alias, type, state, deviceId})

	}

	console.log('sendStatus', data)

	agent.emit('tplink.status', data)		

}


agent.onConnect(sendStatus)
agent.onClose(() => {
	agent.emit('tplink.status')
})
agent.start()

