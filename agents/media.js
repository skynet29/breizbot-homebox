const drivelist = require('drivelist')
const path = require('path')
const fs = require('fs-extra')

const agent  = require('../lib/agent')

function isMediaFile(name) {
	return name.endsWith('.mp4') || name.endsWith('.mp3')
}

agent.registerService('homebox.media.drive', function(req) {
	console.log('req', req)

	return drivelist.list().then((drives) => {
		console.log('drives', drives)
		return drives
			.filter((d) => d.isUSB)
			.map((d) => d.mountpoints[0].label)

	})	
})

agent.registerService('homebox.media.list', function(req) {
	console.log('req', req)
	const {driveName, destPath} = req

	return drivelist.list()
	.then((drives) => {
		console.log('drives', drives)
		return drives.find((d) => d.isUSB && d.mountpoints[0].label == driveName)

	})
	.then((drive) => {
		console.log('drive', drive)
		const mountPath = drive.mountpoints[0].path
		const fullPath = path.join(mountPath, destPath)
		console.log('fullPath', fullPath)
		return fs.readdir(fullPath).then((files) => {
			return {files, fullPath}
		})
	})	
	.then((info) => {
		console.log('info', info)
		const promises = info.files.map((file) => {
			return fs.lstat(path.join(info.fullPath, file)).then((statInfo) => {	
				return {
					name: file, 
					folder: statInfo.isDirectory(),
					size: statInfo.size
				}
			})
		})
		
		return Promise.all(promises)		
	})
	.then(function(values) {
		//console.log('values', values)
		return values.filter((info) => 
				info.folder === true || isMediaFile(info.name)
			)

	})	

})


agent.start()