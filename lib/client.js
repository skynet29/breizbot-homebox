//const websocket = require("nodejs-websocket")
const EventEmitter = require('events').EventEmitter	
const WebSocket = require('ws')


class Client extends EventEmitter {

	constructor(url) {
		super()

		this.sock = null
		this.isConnected = false
		this.url = url
		this.tryReconnect = true

	}



	connect() {
		console.log('try to connect...')

		const sock = new WebSocket(this.url)

		sock.on('open', () => {
			console.log("Connected to server")
			this.isConnected = true
			this.emit('connect')
		}) 

		sock.on('error', function(err) {
			//console.log('ws error', err)
		})		

		sock.on('message', (text) => {
			var msg = JSON.parse(text)
			if (msg.type == 'error') {
				console.log('[Broker] error:', msg.text)
				this.tryReconnect = false
				sock.close()
			}	
			else {		
				this.emit('message', msg)		
			}
		})

		sock.on('close', (code, reason) => {
			//console.log('WS close', code, reason)
			if (this.isConnected) {
				console.log('Disconnected !')
				this.emit('disconnect')
			}
			this.isConnected = false
			if (this.tryReconnect) {
				setTimeout(() => {this.connect()}, 5000)
			}

		})


		this.sock = sock		
	}



	sendMsg(msg) {
		//console.log('[Client] sendMsg', msg)
		msg.time = Date.now()
		var text = JSON.stringify(msg)
		if (this.isConnected) {
			this.sock.send(text)
		}
	}


	
}

module.exports = Client



