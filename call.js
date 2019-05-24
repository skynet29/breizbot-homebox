const fs = require('fs')
const util = require('./lib/util')


var params = util.getParams()

console.log('params', params)

if (params.data != undefined) {
	params.data = util.safeEval(params.data)
}

if (params.service == undefined) {
	console.log('Usage: node call service=srvName [data=data]')
	process.exit(0)
}


console.log('data', params.data)


var agentName = 'call.' + Date.now() % 100000


process.argv[2] = agentName

const agent = require('./lib/agent')



agent.onConnect(() => {
	agent.callService(params.service, params.data)
	.then(function(resp) {
		console.log('resp', JSON.stringify(resp, null, 4))
		process.exit(0)
	})
	.catch(function(err) {
		console.warn('err', err)
		process.exit(0)
	})
})

agent.start()