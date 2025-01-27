const request = require('supertest');
const express = require('express');
const path = require('path');
const fs = require('fs');

const mockConfig = {
	API_TOKEN: 'VIDEOVERSE'
};

jest.mock('../config/config', () => mockConfig);
jest.mock('../models/VideoModel');

const config = require('../config/config');

jest.mock('../controllers/videoController', () => ({
	uploadVideo: jest.fn(),
	getAllVideos: jest.fn(),
	trimVideo: jest.fn(),
	mergeVideos: jest.fn(),
	generateSharedLink: jest.fn(),
	accessSharedLink: jest.fn()
}));

jest.mock('../middlewares/auth', () => ({
	validateApiToken: (req, res, next) => {
		const apiToken = req.headers['x-api-token'];
		if (apiToken !== mockConfig.API_TOKEN) {
			return res.status(401).json({ error: 'Invalid API Token' });
		}
		next();
	}
}));

const videoRoutes = require('../routes/videoRoutes');
const VideoController = require('../controllers/videoController');
const VideoModel = require('../models/VideoModel');

const app = express();
app.use(express.json());
app.use('/videos', videoRoutes);

describe('Video Routes', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe('POST /videos/upload', () => {
		const validUploadScenarios = [
			{
				name: 'should upload video successfully',
				mockResponse: { message: 'Video uploaded successfully', videoId: 'test-video-id' },
				expectedStatus: 200
			}
		];

		const errorUploadScenarios = [
			{
				name: 'should handle upload errors',
				mockError: new Error('Upload failed'),
				expectedStatus: 500,
				expectedBody: { error: 'Upload failed' }
			}
		];

		validUploadScenarios.forEach(scenario => {
			it(scenario.name, async () => {
				VideoController.uploadVideo.mockResolvedValue(scenario.mockResponse);

				const testFilePath = path.join(__dirname, 'test-video.mp4');
				fs.writeFileSync(testFilePath, 'test video content');

				const response = await request(app)
					.post('/videos/upload')
					.set('x-api-token', config.API_TOKEN)
					.attach('video', testFilePath)
					.expect(scenario.expectedStatus);

				fs.unlinkSync(testFilePath);

				expect(response.body).toEqual(scenario.mockResponse);
				expect(VideoController.uploadVideo).toHaveBeenCalled();
			});
		});

		errorUploadScenarios.forEach(scenario => {
			it(scenario.name, async () => {
				VideoController.uploadVideo.mockRejectedValue(scenario.mockError);

				const testFilePath = path.join(__dirname, 'test-video.mp4');
				fs.writeFileSync(testFilePath, 'test video content');

				const response = await request(app)
					.post('/videos/upload')
					.set('x-api-token', config.API_TOKEN)
					.attach('video', testFilePath)
					.expect(scenario.expectedStatus);

				fs.unlinkSync(testFilePath);

				expect(response.body).toEqual(scenario.expectedBody);
			});
		});

		it('should reject upload without API token', async () => {
			const testFilePath = path.join(__dirname, 'test-video.mp4');
			fs.writeFileSync(testFilePath, 'test video content');

			await request(app)
				.post('/videos/upload')
				.attach('video', testFilePath)
				.expect(401);

			fs.unlinkSync(testFilePath);
		});
	});

	describe('GET /videos', () => {
		it('should fetch all videos successfully', async () => {
			const mockVideos = [
				{ id: '1', title: 'Video 1' },
				{ id: '2', title: 'Video 2' }
			];

			VideoController.getAllVideos.mockResolvedValue(mockVideos);

			const response = await request(app)
				.get('/videos')
				.set('x-api-token', config.API_TOKEN)
				.expect(200);

			expect(response.body).toEqual(mockVideos);
			expect(VideoController.getAllVideos).toHaveBeenCalled();
		});

		it('should handle errors when fetching videos', async () => {
			VideoController.getAllVideos.mockRejectedValue(new Error('Fetch failed'));

			const response = await request(app)
				.get('/videos')
				.set('x-api-token', config.API_TOKEN)
				.expect(500);

			expect(response.body).toEqual({ error: 'Fetch failed' });
		});

		it('should reject getting videos without API token', async () => {
			await request(app)
				.get('/videos')
				.expect(401);
		});
	});

	describe('POST /videos/trim', () => {
		describe('POST /videos/trim', () => {
			it('should trim a video successfully', async () => {

				const mockTrimmedVideo = {
					fileName: "trimmed_video.mp4",
					duration: 10,
					watchLink: "http://example.com/video"
				};

				VideoController.trimVideo.mockResolvedValue(mockTrimmedVideo);

				const response = await request(app)
					.post('/videos/trim')
					.set('x-api-token', config.API_TOKEN)
					.send({
						videoId: 1,
						trimType: "start",
						duration: 10
					})
					.expect(200);

				expect(response.body).toHaveProperty('fileName');
				expect(response.body).toHaveProperty('duration');
				expect(response.body).toHaveProperty('watchLink');

				expect(response.body).toEqual(mockTrimmedVideo);

				expect(VideoController.trimVideo).toHaveBeenCalled();
			});
		});

		it('should reject trim without API token', async () => {
			await request(app)
				.post('/videos/trim')
				.send({
					videoId: 1,
					trimType: "start",
					duration: 10
				})
				.expect(401);
		});
	});

	describe('POST /videos/merge', () => {
		it('should merge videos successfully', async () => {
			const mockMergedVideo = {
				mergedVideoId: "merged-411eb4af-7bbd-4790-9a6e-c481a53e7c8a.mp4",
				duration: "152.133333",
				watchLink: "/videos/watch/merged-411eb4af-7bbd-4790-9a6e-c481a53e7c8a.mp4"
			};

			VideoController.mergeVideos.mockResolvedValue(mockMergedVideo);

			const response = await request(app)
				.post('/videos/merge')
				.set('x-api-token', config.API_TOKEN)
				.send({
					ids: [1, 2]
				});

			expect(response.status).toBe(200);

			expect(response.body).toHaveProperty('mergedVideoId');
			expect(response.body).toHaveProperty('duration');
			expect(response.body).toHaveProperty('watchLink');

			expect(response.body).toEqual(mockMergedVideo);

			expect(VideoController.mergeVideos).toHaveBeenCalledWith(
				expect.objectContaining({
					body: {
						ids: [1, 2]
					}
				}),
				expect.any(Object)
			);
		});

		it('should reject merge without API token', async () => {
			await request(app)
				.post('/videos/merge')
				.send({
					ids: [1, 2]
				})
				.expect(401);
		});
	});

	describe('POST /videos/share', () => {
		it('should generate a shared link successfully', async () => {
			const mockShareLink = {
				message: "Link generated",
				sharedLink: "http://localhost:9443/videos/share/eef31ecf-d463-4243-a4b2-fe16251138ad",
				expiresAt: "2025-01-26T19:47:59.380Z"
			};

			VideoController.generateSharedLink.mockResolvedValue(mockShareLink);

			const response = await request(app)
				.post('/videos/share')
				.set('x-api-token', config.API_TOKEN)
				.send({
					id: 1,
					expiresIn: 10
				});

			expect(response.status).toBe(200);

			expect(response.body).toHaveProperty('message');
			expect(response.body).toHaveProperty('sharedLink');
			expect(response.body).toHaveProperty('expiresAt');

			expect(response.body).toEqual(mockShareLink);

			expect(VideoController.generateSharedLink).toHaveBeenCalledWith(
				expect.objectContaining({
					body: {
						id: 1,
						expiresIn: 10
					}
				}),
				expect.any(Object)
			);
		});

		it('should reject share generation without API token', async () => {
			const requestPayload = {
				id: 1,
				expiresIn: 10
			};

			await request(app)
				.post('/videos/share')
				.send(requestPayload)
				.expect(401);

			expect(VideoController.generateSharedLink).not.toHaveBeenCalled();
		});
	});

	describe('GET /videos/share/:token', () => {
		it('should access a shared link successfully', async () => {
			const mockVideoDetails = {
				id: 'shared-video',
				title: 'Shared Video'
			};

			VideoController.accessSharedLink.mockResolvedValue(mockVideoDetails);

			const response = await request(app)
				.get('/videos/share/test-token')
				.expect(200);

			expect(response.body).toEqual(mockVideoDetails);
			expect(VideoController.accessSharedLink).toHaveBeenCalled();
		});
	});
});

