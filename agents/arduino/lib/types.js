var five = require("johnny-five")

module.exports = {
	led: {
		create: function(options) {
			return new five.Led(options)
		},

		properties: {
			state: {
				label: 'State',
				value: 'off'
			}
		},

		actions: {
			'on': {
				label: 'On',
				method: function(device) {
					console.log('on')
					device.properties.state = 'on'
					device.adapter.stop().on()
				}
			},
			'off': {
				label: 'Off',
				method: function(device) {
					console.log('off')
					device.properties.state = 'off'
					device.adapter.stop().off()
				}
			},
			'blink': {
				label: 'Blink',
				method: function(device, args) {
					console.log('blink', args)
					const {duration} = args
					device.properties.state = `blink(${duration})`
					device.adapter.blink(duration)
				},
				args: {
					duration: {
						label: 'Duration',
						unit: 'ms',
						value: 100,
						input: 'input',
						attrs: {
							type: 'number',
							min: 0
						}
					}
				}
			}
		}
	}
}