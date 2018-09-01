process.argv[2] = 'launcher'

var forever = require('forever-monitor')
var fs = require('fs')
var path = require('path')
const agent = require('./lib/agent')
const hostName = require('os').hostname()

const name = `launcher.${hostName}`

require('console-title')('Agents Launcher')



// var client  = new Client(options)


var sigInt = false


// if (!('launcher' in globalConfig)) {
// 	console.error('no laucnher config !')
// 	process.exit(2)
// }

var config = agent.config

var logPath = config.logPath || "./log/"
if (!fs.existsSync(logPath)) {
	console.log("create directory ", logPath)
	fs.mkdirSync(logPath)
}






if (!('agents' in config)) {
	console.error('No agent to launch !')
	process.exit(3)
}



function getCurrentHostAgents(agents) {
	var ret = {}
	for(var agentName in agents) {
		var host = agents[agentName].host
		if (host == undefined || host === hostName) {
			ret[agentName] = agents[agentName]
		}
	}
	return ret
}

var agents = getCurrentHostAgents(config.agents)


var agentsState = {}

function startAgent(agentName) {

	if (typeof agents[agentName] != 'object') {
		console.log(`agent ${agentName} is not defined in the configuration file`)
		return
	}

	var script = agents[agentName].script

	if (typeof script != 'string') {
		console.log("no script defined for agent ", agentName)
		return
	}
	
	var child = new forever.Monitor(script, {
		outFile: path.join(logPath, agentName + '.log'),
		errFile: path.join(logPath, agentName + '.log'),
		silent: true,
		args: [agentName],
		max: 1,
		killTree: true
	})
	child.on('exit', function() {
		console.log(`Agent '${agentName}' has exited`)
		var newState
		switch(agentsState[agentName].state) {
			case 'stoping':
				newState = 'stop'
				break;
			case 'killing':
				newState = 'killed'
				break;
			default:
				newState = 'crashed'
		}
		
		//var newState = (agentsState[agentName].state == "stoping") ? "stop" : "crashed"
		agentsState[agentName] = {state:newState, pid: 0}
		sendStatus()
		if (sigInt === true) {
			var nbRunningAgents = getRunningAgents().length
			console.log('remaining agent to stop', nbRunningAgents)
			if (nbRunningAgents == 0) {
				process.exit(0)
			}
		}
	})

	child.on('start', function(process, data) {
		console.log(`start agent '${agentName}' with pid ${data.pid}`)
		agentsState[agentName] = {state:'run', pid: data.pid}
		sendStatus()
	})
	child.start()
	agentsState[agentName] = {state:'starting', pid: 0}
	sendStatus()
}

function getRunningAgents() {
	var ret = []
	for(agentName in agentsState) {
		var info = agentsState[agentName]
		if (info.pid != 0) {
			ret.push(agentName)
		}
	}	
	return ret
}

function stopAllRunningAgents() {
	console.log('stopAllRunningAgents')
	for(agentName in agentsState) {
		var info = agentsState[agentName]
		if (info.pid != 0) {
			stopAgent({agent: agentName, force: true})
		}
	}
}

function stopAgent(data) {
	console.log('stopAgent', data)
	var agentName
	var force = false

	if (typeof data == 'string') {
		agentName = data
	}
	else if (typeof data == 'object' && typeof data.agent == "string") {
		agentName = data.agent
		force = data.force
	}

	if (agentName == undefined) {
		console.log(`stopAgent: bad parameters`)
		return		
	}

	if (typeof agentsState[agentName] != 'object') {
		console.log(`agent ${agentName} is not defined in the configuration file`)
		return
	}

	const pid = agentsState[agentName].pid
	if (pid == 0) {
		console.log(`agent ${agentName} is not running`)
		return		
	}
	//process.kill(pid)
	
	if (force === true) {
		agentsState[agentName].state = "killing"
		process.kill(pid)
	}
	else {
		agentsState[agentName].state = "stoping"
		agent.sendTo(`box.${agentName}`, 'shutdown')
	}
	
}


function startConfiguredAgents() {
	for(var agentName in agents) {
		var start = agents[agentName].start || "auto"

		agentsState[agentName] = {state:'ready', pid:0}
		if (start != 'manual') {
			startAgent(agentName)	
		}
	}	
}

startConfiguredAgents()




agent.register('launcherStartAgent', false, function(msg) {
	console.log(`startAgent '${ msg.data}'`)
	startAgent(msg.data)
})

agent.register('launcherStopAgent', false, function(msg) {
	console.log(`stopAgent`, msg.data)
	stopAgent(msg.data)
})

agent.onConnect(function() {
	sendStatus()
})


agent.start()


function sendStatus() {
	agent.emit(`launcherStatus.${hostName}`, agentsState)
}

process.on('SIGINT', function() {
	//stopAllRunningAgents()
	//sigInt = true
	agent.emit(`launcherStatus.${hostName}`)
	process.exit(0)
})