var agent = require('../../../lib/agent')

agent.registerService('sum', function(req) {
	console.log('req', req)
	if (req == undefined || typeof req.a != 'number' || typeof req.b != 'number') {
		return Promise.reject('Bad arguments')
	}
	else {
		return req.a + req.b
	}
})

agent.start()