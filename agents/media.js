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
		//console.log('drives', drives)
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
		//console.log('drives', drives)
		return drives.find((d) => d.isUSB && d.mountpoints[0].label == driveName)

	})
	.then((drive) => {
		//console.log('drive', drive)
		const mountPath = drive.mountpoints[0].path
		const fullPath = path.join(mountPath, destPath)
		console.log('fullPath', fullPath)
		return fs.readdir(fullPath).then((files) => {
			return {files, fullPath}
		})
	})	
	.then((info) => {
		//console.log('info', info)
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

agent.registerService('homebox.media.load', function(req) {
	console.log('req', req)
	const {driveName, fileName, range} = req

    const positions = range.replace(/bytes=/, "").split("-");
    const start = parseInt(positions[0]);
    console.log('start', start)
    // if last byte position is not present then it is the last byte of the video file.
    //const end = positions[1] ? parseInt(positions[1]) : total - 1;
    //var chunksize = (end-start)+1;	

	return drivelist.list()
	.then((drives) => {
		console.log('drives', drives)
		return drives.find((d) => d.isUSB && d.mountpoints[0].label == driveName)

	})
	.then((drive) => {
		console.log('drive', drive)
		const mountPath = drive.mountpoints[0].path
		const fullPath = path.join(mountPath, fileName)
		
		return fs.lstat(fullPath).then((statInfo) => {
			return {size: statInfo.size, fullPath}
		})
	})	
	.then((info) => {
		console.log('info', info)
		const {size, fullPath} = info
		return fs.open(fullPath, 'r').then((fd) => {
			return {fd, size}
		})
	})
	.then((info) => {
		console.log('info', info)
		const {fd, size} = info
		//const end = positions[1] ? parseInt(positions[1]) : statInfo.size - 1;

		const chunkSize = 1024*1024
		console.log('start', start)
		return fs.read(fd, Buffer.alloc(chunkSize), 0, chunkSize, start).then((results) => {
			return {fd, size, results}
		})
	})
	.then((info) => {
		console.log('info', info)
		let {results, fd, size} = info
		fs.close(fd)
		console.log('results', results)
		return {
			size,
			start,
			bytesRead: results.bytesRead,
			buffer: results.buffer.toString('base64')
		}
	})


})

agent.start()