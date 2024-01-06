const { validationResult } = require('express-validator');

const Topic = require('../models/topic');
const User = require('../models/user');
const Post = require('../models/post');
const Forum = require('../models/forum');

exports.createTopic = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error('Validation failed, invalid data.');
    error.statusCode = 422;
    throw error;
  }
  (async () => {
    const { id, name, description } = req.body;
    let forum;
    try {
      forum = await Forum.findOne({ id });
      if (!forum) {
        const error = new Error('Could not find forum.');
        error.statusCode = 404;
        throw error;
      }
    } catch (error) {
      if (!error.statusCode) {
        error.statusCode = 500;
      }
      next(error);
    }
    const topic = new Topic({
      name,
      description,
      creator: req.userId,
      forum: forum._id,
      posts: [],
      replies: '0',
      views: '0',
      lastPostUser: 'User',
      lastPostCreatedAt: new Date().toLocaleString(),
    });
    try {
      await topic.save();
      const user = await User.findById(req.userId);
      user.topics.push(topic);
      await user.save();

      forum.topics.push(topic);
      await forum.save();

      res.status(201).json({
        message: 'Topic created!',
        topic,
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
  const currentPage = req.query.page;
  const limit = req.query.limit || 10;
  const topicId = req.params.topicId;
  let perPage = 10;
  try {
    if (limit > 100) {
      perPage = 100;
    } else if (limit < 1) {
      perPage = 10;
    } else {
      perPage = limit;
    }

    const topic = await Topic.findOne({ id: topicId }).populate([
      { path: 'creator', model: 'User', select: 'name' },
      {
        path: 'posts',
        options: {
          sort: {},
          skip: (currentPage - 1) * perPage,
          limit: perPage,
        },
        populate: [{ path: 'creator', model: 'User', select: 'name' }],
      },
    ]);
    if (!topic) {
      const error = new Error('Could not find topic.');
      error.statusCode = 404;
      throw error;
    }
    const totalItems = await Post.countDocuments({
      topic: topic._id,
    });
    res.status(200).json({ topic, totalItems });
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
    const forum = await Forum.findById(topic.forum.toString());
    forum.topics.pull(topic._id.toString());
    await forum.save();
    res.status(200).json({ message: 'Topic was deleted.' });
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }
    next(error);
  }
};
