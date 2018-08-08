//const websocket = require("nodejs-websocket")
const EventEmitter2 = require('eventemitter2').EventEmitter2	
const WebSocket = require('ws')

var statusCodeMap = {
	0: 'OK',
	100: 'Service not available',
	200: 'Invalid parameters'
}

function getErrorMessage(statusCode) {
	return statusCodeMap[statusCode] || ''
}


class Client {

	constructor(options) {
		this.sock = null
		this.isConnected = false
		this.topics = new EventEmitter2({wildcard: true})
		this.services = new EventEmitter2()
		this.events = new EventEmitter2()

		const {port, host, userName, agentName} = options

		this.id = `box.${userName}.${agentName}`

		this.url = `wss://${host}:${port}/${this.id}`		

		console.log('url', this.url)

		this.registeredTopics = {}
		this.registeredServices = {}

	}



	connect() {
		console.log('try to connect...')

		var sock = new WebSocket(this.url)

		sock.on('open', () => {
			console.log("Connected to Master")
			this.isConnected = true
			this.events.emit('connect')

			for(let topic in this.registeredTopics) {
				var getLast = this.registeredTopics[topic]
				this.sendMsg({type: 'register', topic: topic, getLast: getLast})
			}

			for(let srvName in this.registeredServices) {
				this.sendMsg({type: 'registerService', srvName: srvName})
			}

		}) 

		sock.on('error', function(err) {
			console.log('ws error', err)
		})		

		sock.on('message', (text) => {
			var msg = JSON.parse(text)


			if (typeof msg.topic == 'string') {
				let split = msg.topic.split('.') // compute the id (layerId.objectId) from topic
				if (split.length == 3) {
					split.shift()
					msg.id = split.join('.')
				}					


				this.topics.emit(msg.topic, msg)				
				

			}

			if (msg.type == 'callService') {
				this.handleCallService(msg)
			}				

			if (msg.type == 'callServiceResp') {
				this.services.emit(msg.srvName, msg)
			}				
		
		})

		sock.on('close', (code, reason) => {
			//console.log('WS close', code, reason)
			if (this.isConnected) {
				console.log('Disconnected !')
				this.events.emit('disconnect')
			}
			this.isConnected = false
			setTimeout(() => {this.connect()}, 5000)

		})


		this.sock = sock		
	}

	handleCallService(msg) {
		//console.log('handleCallService')
		const func = this.registeredServices[msg.srvName]
		if (typeof func == 'function') {
			var respMsg = {
				type: 'callServiceResp',
				srvName: msg.srvName,
				dest: msg.src,
				statusCode: 0
			}
			func(msg.data, respMsg)
			this.sendMsg(respMsg)			
		}
	}

	sendMsg(msg) {
		//console.log('[Client] sendMsg', msg)
		msg.time = Date.now()
		var text = JSON.stringify(msg)
		if (this.isConnected) {
			this.sock.send(text)
		}
	}

	emit(topic, data) {
		//console.log('publish', topic, data)
		var msg = {
			type: 'notif',
			topic: topic
		}

		if (data !== undefined) {
			msg.data = data
		}
		this.sendMsg(msg)
	}

	on(topic, callback) {

		this.topics.on(topic, callback)
	}

	register(topics, getLast, callback) {
		if (typeof topics == 'string') {
			topics = [topics]
		}

		topics.forEach((topic) => {
			this.registeredTopics[topic] = getLast
			this.on(topic, callback)
			if (this.isConnected) {
				this.sendMsg({type: 'register', topic: topic, getLast: getLast})
			}
		})
		
	}

	unregister(topics, callback) {
		if (typeof topics == 'string') {
			topics = [topics]
		}

		topics.forEach((topic) => {

			this.topics.off(topic, callback)
			var nbListeners = this.topics.listeners(topic).length

			if (this.isConnected && nbListeners == 0) { // no more listeners for this topic
				this.sendMsg({type: 'unregister', topic: topic})
			}		
		})
	}		

	registerService(srvName, func) {
		this.registeredServices[srvName] = func
		if (this.isConnected) {
			this.sendMsg({type: 'registerService', srvName: srvName})
		}		
	}


	callService(srvName, data) {
		console.log('[Client] callService', srvName, data)
		var that = this
		return new Promise((resolve, reject) => {
			this.services.once(srvName, function(msg) {
				var statusCode = msg.statusCode
				if (statusCode == 0) {
					resolve(msg.data)
				}
				else {
					reject({
						code: statusCode,
						message: getErrorMessage(msg.statusCode)
					})
				}
			})

			this.sendMsg({
				type: 'callService',
				srvName: srvName,
				data: data
			})
		})
	}



	sendTo(dest, topic, data) {
		var msg = {
			type: 'cmd',
			topic: topic,
			dest: dest
		}

		if (data !== undefined) {
			msg.data = data
		}
		this.sendMsg(msg)		
	}	
	
}

module.exports = Client



