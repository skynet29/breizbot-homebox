const fs = require('fs')
const util = require('./lib/util')


var params = util.getParams()

console.log('params', params)

if (params.data != undefined) {
	params.data = util.safeEval(params.data)
}

if (params.topic == undefined) {
	console.log('Usage: node poke topic=topicName [data=data] [file=fileName]')
	process.exit(0)
}

if (params.file != undefined) {
	var content = fs.readFileSync(params.file)
	params.data = JSON.parse(content.toString())
}

console.log('data', params.data)


var agentName = 'poke.' + Date.now() % 100000


process.argv[2] = agentName

const agent = require('./lib/agent')


agent.onConnect(() => {
	console.log('send', params.data)
	agent.emitTopic(params.topic, params.data)
	process.exit(0)	
})

agent.start()