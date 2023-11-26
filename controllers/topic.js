const { validationResult } = require('express-validator');

const Topic = require('../models/topic');
const User = require('../models/user');
const Post = require('../models/post');

exports.getTopics = async (req, res, next) => {
  const currentPage = req.query.page || 1;
  const limit = req.query.limit;
  let totalItems = 0;
  let perPage = 10;
  try {
    totalItems = await Topic.find().countDocuments();
    if (limit > 0 && limit < 100) {
      perPage = limit;
    } else if (limit === '-1' && totalItems < 100) {
      perPage = totalItems;
    }
    const topics = await Topic.find()
      .skip((currentPage - 1) * perPage)
      .limit(perPage)
      .populate({ path: 'creator', select: 'name' });
    res.status(200).json({ topics, totalItems });
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }
  }
};

exports.createTopic = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error('Validation failed, invalid data.');
    error.statusCode = 422;
    throw error;
  }
  (async () => {
    const { name, description } = req.body;
    const topic = new Topic({
      name,
      description,
      creator: req.userId,
      posts: [],
      replies: '0',
      views: '0',
      lastPostUser: 'User',
      lastPostCreatedAt: new Date().toLocaleString(),
    });
    try {
      const user = await User.findById(req.userId);
      creator = user;
      user.topics.push(topic);
      await user.save();

      await topic.save();

      res.status(201).json({
        message: 'Topic created!',
        topic,
        creator,
      });
    } catch (error) {
      if (!error.statusCode) {
        error.statusCode = 500;
      }
      next(error);
    }
  })();
};

exports.getTopic = async (req, res, next) => {
  const topicId = req.params.topicId;
  try {
    const topic = await Topic.findOne({ id: topicId });
    if (!topic) {
      const error = new Error('Could not find topic.');
      error.statusCode = 404;
      throw error;
    }
    res.status(200).json({ topic });
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }
    next(error);
  }
};

exports.updateTopic = (req, res, next) => {
  const topicId = req.params.topicId;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error('Validation failed, invalid data.');
    error.statusCode = 422;
    throw error;
  }
  (async () => {
    const { name, description } = req.body;
    try {
      const topic = await Topic.findOne({ id: topicId });
      if (!topic) {
        const error = new Error('Could not find topic.');
        error.statusCode = 404;
        throw error;
      }
      if (topic.creator.toString() !== req.userId) {
        const error = new Error('Not authorized.');
        error.statusCode = 403;
        throw error;
      }
      topic.name = name;
      topic.description = description;
      await topic.save();
      res.status(200).json({ message: 'Topic updated!', topic });
    } catch (error) {
      if (!error.statusCode) {
        error.statusCode = 500;
      }
      next(error);
    }
  })();
};

exports.deleteTopic = async (req, res, next) => {
  const { topicId } = req.params;
  try {
    const topic = await Topic.findOne({ id: topicId });
    if (!topic) {
      const error = new Error('Could not find topic.');
      error.statusCode = 404;
      throw error;
    }
    if (topic.creator._id.toString() !== req.userId) {
      const error = new Error('Not authorized.');
      error.statusCode = 403;
      throw error;
    }
    if (topic.posts.length > 0) {
      await User.updateMany({}, { $pull: { posts: { $in: topic.posts } } });
      await Post.deleteMany({ _id: { $in: topic.posts } });
    }
    await Topic.findOneAndDelete({ id: topicId });

    const user = await User.findById(req.userId);
    user.topics.pull(topic._id.toString());
    await user.save();
    res.status(200).json({ message: 'Topic was deleted.' });
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }
    next(error);
  }
};
