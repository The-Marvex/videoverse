const config = require('../config/config');

const validateApiToken = (req, res, next) => {
 const apiToken = req.headers['x-api-token'];

 if (!apiToken || apiToken !== config.API_TOKEN) {
   return res.status(401).json({ 
     error: 'Unauthorized',
     message: 'Invalid or missing API token' 
   });
 }

 next();
};

module.exports = {
	validateApiToken
};
