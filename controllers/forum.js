const { validationResult } = require('express-validator');

const Forum = require('../models/forum');
const User = require('../models/user');
const Topic = require('../models/topic');

exports.getForums = async (req, res, next) => {
  const currentPage = req.query.page || 1;
  const limit = req.query.limit;
  let totalItems = 0;
  let perPage = 10;
  try {
    totalItems = await Forum.find().countDocuments();
    if (limit > 0 && limit < 100) {
      perPage = limit;
    } else if (limit === '-1' && totalItems < 100) {
      perPage = totalItems;
    }
    const forums = await Forum.find()
      .skip((currentPage - 1) * perPage)
      .limit(perPage)
      .populate({ path: 'creator', select: 'name' });
    res.status(200).json({ forums, totalItems });
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }
  }
};

exports.createForum = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error('Validation failed, invalid data.');
    error.statusCode = 422;
    throw error;
  }
  (async () => {
    const { name, description } = req.body;
    const forum = new Forum({
      name,
      description,
      creator: req.userId,
      posts: [],
      views: '0',
      lastPostUser: 'User',
      lastPostCreatedAt: new Date().toLocaleString(),
    });
    try {
      const user = await User.findById(req.userId);
      creator = user;
      user.forums.push(forum);
      await user.save();

      await forum.save();

      res.status(201).json({
        message: 'Forum created!',
        forum,
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

exports.getForum = async (req, res, next) => {
  const forumId = req.params.forumId;
  try {
    const forum = await Forum.findOne({ id: forumId });
    if (!forum) {
      const error = new Error('Could not find forum.');
      error.statusCode = 404;
      throw error;
    }
    res.status(200).json({ forum });
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }
    next(error);
  }
};

exports.updateForum = (req, res, next) => {
  const forumId = req.params.forumId;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error('Validation failed, invalid data.');
    error.statusCode = 422;
    throw error;
  }
  (async () => {
    const { name, description } = req.body;
    try {
      const forum = await Forum.findOne({ id: forumId });
      if (!forum) {
        const error = new Error('Could not find forum.');
        error.statusCode = 404;
        throw error;
      }
      if (forum.creator.toString() !== req.userId) {
        const error = new Error('Not authorized.');
        error.statusCode = 403;
        throw error;
      }
      forum.name = name;
      forum.description = description;
      await forum.save();
      res.status(200).json({ message: 'Forum updated!', forum });
    } catch (error) {
      if (!error.statusCode) {
        error.statusCode = 500;
      }
      next(error);
    }
  })();
};

exports.deleteForum = async (req, res, next) => {
  const { forumId } = req.params;
  try {
    const forum = await Forum.findOne({ id: forumId });
    if (!forum) {
      const error = new Error('Could not find forum.');
      error.statusCode = 404;
      throw error;
    }
    if (forum.creator._id.toString() !== req.userId) {
      const error = new Error('Not authorized.');
      error.statusCode = 403;
      throw error;
    }
    if (forum.topics.length > 0) {
      await User.updateMany({}, { $pull: { posts: { $in: forum.topics } } });
      await Topic.deleteMany({ _id: { $in: forum.topics } });
      // post delete relation
    }
    await Forum.findOneAndDelete({ id: forumId });

    const user = await User.findById(req.userId);
    user.forums.pull(forum._id.toString());
    await user.save();
    res.status(200).json({ message: 'Forum was deleted.' });
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }
    next(error);
  }
};
