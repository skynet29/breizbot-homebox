const agent  = require('../lib/agent')

var five = require("johnny-five");
var board = new five.Board({
	repl: false
});

board.on("ready", function() {
  var led = new five.Led(13);

	agent.register('ledOn', false, function(msg) {
		console.log('Receive msg', msg)
		led.on()
	})

	agent.register('ledOff', false, function(msg) {
		console.log('Receive msg', msg)
		led.off()
	})  
});




agent.start()
