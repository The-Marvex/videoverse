const express = require('express');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const VideoController = require('../controllers/videoController');
const { validateApiToken } = require("../middlewares/auth");
const path = require('path');


const router = express.Router();

const storage = multer.diskStorage({
	destination: function(_req, _file, cb) {
		cb(null, "uploads/");
	},
	filename: function(_req, _file, cb) {
		cb(null, `${uuidv4()}-${_file.originalname}`);
	},
});

const upload = multer({ storage: storage });

router.post(
	'/upload',
	[
		validateApiToken,
		(req, res, next) => {
			upload.single('video')(req, res, next);
		}
	],
	async (req, res) => {
		try {
			const data = await VideoController.uploadVideo(req, res);
			return res.status(200).json(data);
		} catch (error) {
			return res.status(500).json({ error: error.message });
		}
	}
);

router.get(
	'/',
	[validateApiToken],
	async (req, res) => {
		try {
			const videos = await VideoController.getAllVideos(req, res);
			return res.status(200).json(videos);
		} catch (error) {
			return res.status(500).json({ error: error.message });
		}
	}
);

router.post(
	'/trim',
	[validateApiToken],
	async (req, res) => {
		try {
			const videos = await VideoController.trimVideo(req, res);
			return res.json(videos);
		} catch (error) {
			return res.status(500).json({ error: error.message });
		}
	}
);

router.post(
	'/merge',
	[validateApiToken],
	async (req, res) => {
		try {
			const videos = await VideoController.mergeVideos(req, res);
			return res.json(videos);
		} catch (error) {
			return res.status(500).json({ error: error.message });
		}
	}
);

router.get(
	'/share/:token',
	async (req, res) => {
		try {
			const resp = await VideoController.accessSharedLink(req, res);
			return res.json(resp);
		} catch (error) {
			return res.status(500).json({ error: erry.message });
		}
	}
);

router.post(
	'/share',
	[validateApiToken],
	async (req, res) => {
		try {
			const resp = await VideoController.generateSharedLink(req, res);
			return res.json(resp);
		} catch (error) {
			return res.status(500).json({ error: error.message });
		}
	}
);


module.exports = router
