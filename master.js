const ws = require("nodejs-websocket")

const Broker = require('./lib/broker')

const broker = new Broker()

const config = require('./config/config.js')
const {masterPort} = config


const server = ws.createServer((client) => {
	broker.addClient(client)
})


server.listen(masterPort, function() {
	console.log(`WebSocket server start listening on port ${masterPort}`)
})

