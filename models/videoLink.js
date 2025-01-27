const db = require('../connections/db')
const { v4: uuidv4 } = require('uuid');


const getToken = async (token) => {
	return await db('video_links')
		.where({ token })
		.andWhere('expires_at', '>', new Date()) // Check expiry
		.first();
}

const insertShareLink = async (id, token, expiresAt) => {
	return await db('video_links').insert({
		id: uuidv4(),
		video_id: id,
		token,
		expires_at: expiresAt,
	});
}

module.exports = {
	getToken,
	insertShareLink
}
