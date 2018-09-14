var five = require("johnny-five")

function clone(o) {
	const ret = {}
	for(let k in o) {
		ret[k] = Object.assign({}, o[k])
	}
	return ret
}

const led = {
	create: function(options) {
		console.log('create led', options)
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

const rgbLed = clone(led)

rgbLed.create = function(options) {
	console.log('create RGB led', options)
	return new five.Led.RGB(options)
}
rgbLed.properties.color = {
	label: 'Color',
	value: 'White'
}

const colorMap = {
	'RGB(255,255,255)': 'White',
	'RGB(255,0,0)': 'Red',
	'RGB(0,255,0)': 'Green',
	'RGB(0,0,255)': 'Blue',
	'RGB(255,255,0)': 'Yellow',
	'RGB(0,255,255)': 'Cyan',
	'RGB(255,0,255)': 'Magenta',
}

rgbLed.actions.color = {
	label: 'Color',
	method: function(device, args) {
		console.log('brightness', args)
		const {red, green, blue} = args
		let color = `RGB(${red},${green},${blue})`
		color = colorMap[color] || color
		device.properties.color = color
		device.properties.state = 'on'
		device.adapter.color(args)
	},
	args: {
		red: {
			label: 'Red',
			value: 255,
			input: 'input',
			attrs: {
				type: 'number',
				min: 0,
				max: 255
			}
		},
		green: {
			label: 'Green',
			value: 255,
			input: 'input',
			attrs: {
				type: 'number',
				min: 0,
				max: 255
			}
		},
		blue: {
			label: 'Blue',
			value: 255,
			input: 'input',
			attrs: {
				type: 'number',
				min: 0,
				max: 255
			}
		}
	}	
}



const pushButton = {
	create: function(options) {
		console.log('create button', options)
		return new five.Button(options)
	},

	properties: {
		state: {
			label: 'State',
			value: 'release'
		}

	},

	events: {
		press: function(device) {
			console.log('event press')
			device.properties.state = 'press'
		},
		release: function(device) {
			console.log('event release')
			device.properties.state = 'release'
		}
	}
}


module.exports = {
	led,
	rgbLed,
	pushButton
}