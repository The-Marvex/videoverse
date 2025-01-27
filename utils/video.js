const ffprobe = require('ffprobe');
const ffprobeStatic = require('ffprobe-static');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
ffmpeg.setFfmpegPath(ffmpegPath);

const getVideoDuration = async (filePath) => {
	const file = path.resolve(__dirname, '..', filePath);
	return new Promise((resolve, reject) => {
		ffprobe(file, { path: ffprobeStatic.path }, (err, metadata) => {
			if (err) {
				reject(err);
			}
			resolve(metadata.streams[0].duration);
		});
	});
}


const trimVideoByDuration = (inputPath, outputPath, startTime, endTime) => {
	try {
		ffmpeg(inputPath)
			.setStartTime(startTime)
			.setDuration(endTime - startTime)
			.output(outputPath)
			.on('end', () => console.log('Trim completed'))
			.on('error', (err) => {
				throw err;
			})
			.run();

		return outputPath;
	} catch (err) {
		console.error('Trim video error:', err.message);
		throw err;
	}
}
const mergeVideosList = (videoPaths, outputPath) => {
	return new Promise((resolve, reject) => {
		const videoList = videoPaths.map(path => `file '${path}'`).join('\n');
		const listPath = path.join(process.cwd(), 'videolist.txt');

		fs.writeFileSync(listPath, videoList);

		ffmpeg()
			.input(listPath)
			.inputOptions('-f concat')
			.inputOptions('-safe 0')
			.output(outputPath)
			.on('end', () => {
				fs.unlinkSync(listPath);
				resolve(outputPath);
			})
			.on('error', (err) => {
				fs.unlinkSync(listPath);
				reject(err);
			})
			.run();
	});
};


module.exports = {
	getVideoDuration,
	trimVideoByDuration,
	mergeVideosList
}
