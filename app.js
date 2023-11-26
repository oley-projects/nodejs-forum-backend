const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mongoose = require('mongoose');
const dotenvConf = require('dotenv').config();
const MONGODB_URI = dotenvConf.parsed.MONGODB_URI;

const categoryRoutes = require('./routes/category');
const forumRoutes = require('./routes/forum');
const topicRoutes = require('./routes/topic');
const postRoutes = require('./routes/post');
const authRoutes = require('./routes/auth');

const app = express();

app.use(bodyParser.json());

app.use(cors());

app.use('/', categoryRoutes);
app.use('/', forumRoutes);
app.use('/', topicRoutes);
app.use('/', postRoutes);
app.use('/auth', authRoutes);

app.use((error, req, res, next) => {
  const { statusCode = 500, message, data } = error;
  res.status(statusCode).json({ message, data });
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
