const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');


const getVideoDuration = async (filePath) => {
	return new Promise((resolve, reject) => {
		ffmpeg.ffprobe(filePath, (err, metadata) => {
			if (err) reject(err);
			resolve(metadata.format.duration);
		});
	});
}

module.exports = {
	getVideoDuration
}
