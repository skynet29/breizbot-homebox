module.exports = {
	masterPort: 9090,
	masterHost: 'localhost',

	launcher: {
		logPath: './logs',

		agents: {
			master: {script: 'master.js'},
			bridge: {script: 'agents/bridge.js'},			
			drone: {script: 'agents/drone.js', start: 'manual'},
			radar: {script: 'agents/radar.js', start: 'manual'},
			parrot: {script: 'agents/parrot.js', start: 'manual'},
			tplink: {script: 'agents/tplink.js', start: 'manual'},
			arduino: {script: 'agents/arduino/index.js', start: 'manual'},
			media: {script: 'agents/media.js', start: 'manual'}
		}
	},

	drone: {
		storeInFile: false,
		warpFactor: 10,
		gyrSpeed: 8,
		captureRadius: 10,
		icon: {
		 	type: 'ais'
		}		
	},

	arduino: {
		devices: {
			led1: {
				type: 'rgbLed',
				alias: 'Led Couleur',
				options: {
					pins: {
						red: 5,
						green: 6,
						blue: 3
					}
				}
			},
			led2: {
				type: 'led',
				alias: 'Led Rouge',
				options: {
					pin: 13
				}
			},
			button1: {
				type: 'pushButton',
				alias: 'Push button',
				options: {
					pin: 2
				}
			}
		}
	}


}
