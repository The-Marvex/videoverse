const express = require('express');
const cors = require('cors');
const videoRoutes = require('./routes/videoRoutes');
const config = require('./config/config');

const app = express();

app.use(cors({
  origin: '*', 
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'x-api-token']
}));

app.use(express.json());
app.use('/videos', videoRoutes);

app.listen(config.PORT, () => {
  console.log(`Server running on port ${config.PORT}`);
});