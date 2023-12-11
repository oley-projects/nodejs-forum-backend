const { validationResult } = require('express-validator');

const Forum = require('../models/forum');
const User = require('../models/user');
const Topic = require('../models/topic');
const Category = require('../models/category');

exports.createForum = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error('Validation failed, invalid data.');
    error.statusCode = 422;
    throw error;
  }
  (async () => {
    const { id, name, description } = req.body;
    let category;

    try {
      category = await Category.findOne({ id });
      if (!category) {
        const error = new Error('Could not find category.');
        error.statusCode = 404;
        throw error;
      }
    } catch (error) {
      if (!error.statusCode) {
        error.statusCode = 500;
      }
      next(error);
    }

    const forum = new Forum({
      name,
      description,
      creator: req.userId,
      category: category._id,
      topics: [],
      views: '0',
      lastPostUser: 'User',
      lastPostCreatedAt: new Date().toLocaleString(),
    });
    try {
      await forum.save();
      const user = await User.findById(req.userId);
      user.forums.push(forum);
      await user.save();

      category.forums.push(forum);
      await category.save();

      res.status(201).json({
        message: 'Forum created!',
        forum,
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
  const currentPage = req.query.page;
  const limit = req.query.limit || 10;
  const forumId = req.params.forumId;
  let perPage = 10;
  try {
    if (limit > 100) {
      perPage = 100;
    } else if (limit < 0) {
      perPage = 10;
    } else {
      perPage = limit;
    }

    const forum = await Forum.findOne({ id: forumId }).populate([
      { path: 'creator', model: 'User', select: 'name' },
      {
        path: 'topics',
        options: {
          sort: {},
          skip: (currentPage - 1) * perPage,
          limit: perPage,
        },
        populate: [{ path: 'creator', model: 'User', select: 'name' }],
      },
    ]);
    if (!forum) {
      const error = new Error('Could not find forum.');
      error.statusCode = 404;
      throw error;
    }
    const totalItems = await Topic.countDocuments({
      forum: forum._id,
    });
    res.status(200).json({ forum, totalItems });
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
    const category = await Category.findById(forum.category.toString());
    category.forums.pull(forum._id.toString());
    await category.save();
    res.status(200).json({ message: 'Forum was deleted.' });
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }
    next(error);
  }
};
