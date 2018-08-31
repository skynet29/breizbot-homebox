const util = require('./lib/util')


var params = util.getParams()

console.log('params', params)



if (params.topic == undefined) {
	console.log('Usage: node peek topic=topicName [hist=true]')
	process.exit(0)
}

var agentName = 'peek.' + Date.now() % 100000

process.argv[2] = agentName

const agent = require('./lib/agent')


var hist = (params.hist === 'true')

agent.register(params.topic, hist, function(msg) {
	console.log('msg', JSON.stringify(msg, null, 4))
})


agent.start()