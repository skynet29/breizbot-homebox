const agent  = require('../lib/agent')


agent.start()

agent.onShutdown(() => {
	agent.emitTopic('homebox.map.updateShape.radar1')
})

var angle = 0

function update() {
	agent.emitTopic('homebox.map.updateShape.radar1', {
		type: 'sector',
		latlng: {
			lat:48.4, 
			lng:-4.47		
		},

		radius: 1000,
		direction: angle,
		size: 60,
		options: {
			color: 'yellow'
		}
	})

}

setInterval(function() {
	update()
	angle = (angle + 10) % 360
}, 100)


