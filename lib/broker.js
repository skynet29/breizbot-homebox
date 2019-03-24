function sendMsg(client, msg) {
	client.sendText(JSON.stringify(msg))
}

class Broker {
	constructor() {
		this.clients = []
		this.history = {}

	}

	addClient(client) {

		console.log('[Broker] addClient', client.path)

		this.clients.push(client)

		client.registeredTopics = {}

		client.on('text', (text) => {

			const msg = JSON.parse(text)
			this.handleClientMsg(client, msg)

		})

		client.on('close', (code)  => {
			//console.log(`Client disconnected`)
			this.removeClient(client)
			
		})		

		client.on('error', (err) => {
			console.log('connection error')
		})	

    	sendMsg(client, {type: 'ready'})
		
	}

	findClient(clientName) {
		return this.clients.find((client)=> {
			return client.path.substr(1) == clientName
		})
	}

	removeClient(client) {
		console.log('[Broker] removeClient', client.path)

		const idx = this.clients.indexOf(client)
		if (idx >= 0) {
			this.clients.splice(idx, 1)
		}
	}

  handleUnregister(client, msg) {
    const {topic} = msg

    if (client.registeredTopics[topic] != undefined) {
      console.log(`client unsubscribes to topic '${topic}'`)
      delete client.registeredTopics[topic]
    }

  }

  handleRegister(client, msg) {
    const {topic} = msg
    console.log(`client subscribes to topic '${topic}'`)
    client.registeredTopics[topic] = 1

    if (this.history[topic] != undefined) {
      sendMsg(client, this.history[topic])
    }

  }

	handleClientMsg(client, msg) {

		console.log('[Broker] msg', client.path, msg)

		const {type} = msg

		if (typeof type != 'string') {
			console.log('Missing parameter type', msg)
			return
		}	

		switch(msg.type) {

			case 'unregister':
        		this.handleUnregister(client, msg)       
			break

			case 'register':
		        this.handleRegister(client, msg)			
		     break

			case 'notif':
        		this.broadcastToSubscribers(msg)
			break

			case 'cmd':
				this.forwardCmd(msg)
			break;

			default:
				console.log('Unknown msg type', type)
		}

	}	

	forwardCmd(msg) {
		const dest = this.findClient(msg.dest)
		if (dest != undefined) {
			sendMsg(dest, msg)
		}
		else {
			console.log('[Broker] forwardCmd dest not found', msg.dest)
		}
	}

	broadcastToSubscribers(msg) {
		const text = JSON.stringify(msg)
		this.clients.forEach((client) => {
			if (client.registeredTopics[msg.topic] == 1) {
				client.sendText(text)
			}
		})
    msg.hist = true
    this.history[msg.topic] = msg
	}



}

module.exports = Broker