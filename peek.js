const util = require('./lib/util')


var params = util.getParams()

console.log('params', params)



if (params.topic == undefined) {
	console.log('Usage: node peek topic=topicName')
	process.exit(0)
}

var agentName = 'peek.' + Date.now() % 100000

process.argv[2] = agentName

const agent = require('./lib/agent')


agent.register(params.topic, function(msg) {
	console.log('msg', JSON.stringify(msg, null, 4))
})


agent.start()