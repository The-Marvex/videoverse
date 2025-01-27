const { v4: uuidv4 } = require('uuid');
const path = require('path');
const VideoModel = require('../models/VideoModel');
const { VIDEO_CONFIG, BASE_URL, PORT } = require('../config/config');
const { getVideoDuration, trimVideoByDuration, mergeVideosList } = require('../utils/video');
const { getToken, insertShareLink } = require('../models/videoLink');

const uploadVideo = async (req, res) => {
	if (!req.file) {
		return res.status(400).json({ error: 'File is mandatory' });
	}
	const { size } = req.file;
	if (size > VIDEO_CONFIG.MAX_SIZE_MB * 1024 * 1024) {
		return res.status(400).json({ error: 'File size too large' });
	}
	const duration = await getVideoDuration(req.file.path);
	if (duration > VIDEO_CONFIG.MAX_DURATION_SECS || duration < VIDEO_CONFIG.MIN_DURATION_SECS) {
		return res.status(400).json({ error: 'Video duration out of range' });
	}
	const video = {
		size: size / (1024 * 1024),
		duration: duration,
		filename: req.file.filename,
		file_path: req.file.path
	};
	try {
		const vid = await VideoModel.insertVideo(video);
		res.status(201).json({ id: vid[0].id, message: 'Video uploaded successfully', duration });
	} catch (error) {
		res.status(500).json({ error: `Database error, ${error.message}` });
	}
}

const getVideoById = async (req, res) => {
	const { id } = req.params;
	if (!id || isNan(Number(id)))
		return res.status(400).json({ error: 'id should be a number' })
	try {
		const video = await VideoModel.getById(id);
		if (!video) {
			return res.status(404).json({ error: 'Video not found' });
		}
		res.status(200).json(video);
	} catch (error) {
		res.status(500).json({ error: 'Database error' });
	}
}
const trimVideo = async (req, res) => {
	const { videoId, trimType, duration } = req.body;
	if (!videoId || !trimType || !duration) {
		return res.status(400).json({ error: 'videoId, trimType and duration are required' });
	}
	if (isNaN(Number(videoId)) || isNaN(Number(duration))) {
		return res.status(400).json({ error: 'videoId and duration should be a numbers' });

	}
	const video = await VideoModel.getVideoById(videoId);
	if (!video) return res.status(404).json({ error: 'Video not found' });

	if (duration > video.duration) {
		return res.status(400).json({ error: 'trim duration is more than video duration' });
	}

	const outputFilename = `trimmed-${uuidv4()}.mp4`;
	const inputPath = path.resolve(__dirname, '..', video.file_path);
	const outputPath = path.resolve(__dirname, '..', `uploads/${outputFilename}`);
	try {
		const startTime = trimType === 'start' ? 0 : video.duration - duration;
		const endTime = trimType === 'start' ? duration : video.duration;

		await trimVideoByDuration(inputPath, outputPath, startTime, endTime);

		return {
			fileName: outputFilename,
			duration: duration,
			watchLink: `/videos/watch/${outputFilename}`
		};
	} catch (error) {
		return res.status(500).json({ error: 'Unable to trim video' });
	}
}

const mergeVideos = async (req, res) => {
	try {
		const { ids } = req.body;
		if (!ids || !Array.isArray(ids) || ids.length < 2) {
			return res.status(400).json({ error: 'At least two video IDs are required' });
		}
		const videos = await VideoModel.getVideoByIds(ids);
		if (videos.length !== ids.length) {
			return res.status(404).json({ error: 'One or more videos not found' });
		}
		const videoPaths = videos.map(video =>
			path.resolve(__dirname, '..', video.file_path)
		);

		const outputFilename = `merged-${uuidv4()}.mp4`;
		const outputPath = path.resolve(__dirname, '..', `uploads/${outputFilename}`);

		await mergeVideosList(videoPaths, outputPath);

		return {
			mergedVideoId: outputFilename,
			duration: await getVideoDuration(outputPath),
			watchLink: `/videos/watch/${outputFilename}`
		};

	} catch (error) {
		res.status(500).json({ error: error.message });
	}

}
const getAllVideos = async (req, res) => {
	try {
		const videos = await VideoModel.getAllVideos();
		res.status(200).json(videos);
	} catch (error) {
		res.status(500).json({ error: 'Database error' });
	}
}

const generateSharedLink = async (req, res) => {
	try {
		const { id, expiresIn } = req.body;
		if (!id || !expiresIn || isNaN(Number(id)) || isNaN(Number(expiresIn)))
			return res.status(400).json({ message: 'id and expiresIn should be numbers' })
		const video = VideoModel.getVideoById(id);
		if (!video) {
			return res.status(404).json({ message: 'Video not found' });
		}

		const token = uuidv4();
		const expiresAt = new Date(Date.now() + expiresIn * 60000);
		await insertShareLink(id, token, expiresAt);
		const shareableUrl = `${BASE_URL}:${PORT}/videos/share/${token}`;

		return {
			message: 'Link generated',
			sharedLink: shareableUrl,
			expiresAt
		}
	} catch (error) {
		console.error('Error generating shared link:', error);
		res.status(500).json({ message: 'Internal server error' });
	}
};

const accessSharedLink = async (req, res) => {
	try {
		const { token } = req.params;
		const sharedLink = await getToken(token);
		if (!sharedLink) {
			return res.status(404).json({ message: 'Invalid or expired link' });
		}

		const video = await VideoModel.getVideoById(sharedLink.video_id);
		if (!video) {
			return res.status(404).json({ message: 'Video not found' });
		}
		res.sendFile(video.file_path, { root: '.' });
	} catch (error) {
		console.error('Error accessing shared link:', error);
		res.status(500).json({ message: 'Internal server error' });
	}
};

module.exports = {
	uploadVideo,
	trimVideo,
	getVideoById,
	mergeVideos,
	getAllVideos,
	generateSharedLink,
	accessSharedLink
};
