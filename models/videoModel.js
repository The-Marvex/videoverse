const db = require('../connections/db')

const insertVideo = async (video) => {
	return await db('videos').insert(video).returning('*');
}

const getAllVideos = async () => {
	return db('videos').select('*');
}

const getVideoById = async (id) => {
	return db('videos').where({ id: id }).first();
}

const getVideoByIds = async (ids) => {
	return db('videos').whereIn('id', ids);
}


module.exports = {
	insertVideo,
	getAllVideos,
	getVideoById,
	getVideoByIds
}
