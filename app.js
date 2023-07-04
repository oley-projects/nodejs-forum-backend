const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const dotenvConf = require('dotenv').config();
const MONGODB_URI = dotenvConf.parsed.MONGODB_URI;

const forumRoutes = require('./routes/forum');

const app = express();

app.use(bodyParser.json());

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader(
    'Access-Control-Allow-Methods',
    'OPTIONS, GET, POST, PUT, PATCH, DELETE'
  );
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});

app.use('/forum', forumRoutes);

app.use((error, req, res, next) => {
  const { statusCode = 500, message } = error;
  res.status(statusCode).json({ message });
});

mongoose
  .connect(MONGODB_URI)
  .then(
    () => {
      app.listen(8080);
    },
    (error) => {
      console.error(`Connection error: ${error.stack}`);
      process.exit(1);
    }
  )
  .catch((error) => console.log(error));
