var agent = require('../../../lib/agent')

agent.onConnect(function() {
	agent.callService('sum', {a: 10, b: 20}).then(function(resp) {
		console.log('resp', resp)
	})
	.catch(function(err) {
		console.warn('err', err)
	})
})

agent.start()