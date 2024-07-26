const mongoose = require('mongoose');
const { validationResult } = require('express-validator');

const Post = require('../models/post');
const Topic = require('../models/topic');
const Forum = require('../models/forum');
const User = require('../models/user');

exports.getPosts = async (req, res, next) => {
  const keywords = req.params.keywords;
  const currentPage = req.query.page || 1;
  const limit = req.query.limit || 10;
  const sort = req.query.sort.split('_') || ['createAt', 'desc'];
  const [sortField, sortValue] = sort;
  const sortObj = {};
  sortObj[sortField] = sortValue;
  let totalItems = 0;
  let perPage = 10;
  const filter = {};
  if (keywords) {
    filter.description = { $regex: keywords };
  }
  try {
    totalItems = await Post.find(filter).countDocuments();
    if (limit > 0 && limit < 100) {
      perPage = limit;
    } else if (limit === '-1' && totalItems < 100) {
      perPage = totalItems;
    }
    const posts = await Post.find(filter)
      .skip((currentPage - 1) * perPage)
      .limit(perPage)
      .populate([
        { path: 'creator', select: 'name' },
        { path: 'topic', select: 'name id' },
      ])
      .sort(sortObj);
    res.status(200).json({ posts, totalItems });
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }
    next(error);
  }
};

exports.createPost = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error('Validation failed, invalid data.');
    error.statusCode = 422;
    throw error;
  }
  (async () => {
    const { id, name, description } = req.body;
    let topic, forum;

    try {
      topic = await Topic.findOne({ id });
      forum = await Forum.findById(topic.forum.toString());
    } catch (error) {
      if (!error.statusCode) {
        error.statusCode = 500;
      }
      next(error);
    }

    const post = new Post({
      name,
      description,
      creator: req.userId,
      topic: topic._id,
      replies: 0,
      views: 0,
    });
    try {
      await post.save();
      const user = await User.findById(req.userId);
      user.posts.push(post);
      await user.save();

      topic.posts.push(post);
      topic.lastPost = post._id;
      await topic.save();

      forum.lastPost = post._id;
      await forum.save();

      res.status(201).json({
        message: 'Post created!',
        post,
      });
    } catch (error) {
      if (!error.statusCode) {
        error.statusCode = 500;
      }
      next(error);
    }
  })();
};

exports.getPost = async (req, res, next) => {
  const postId = req.params.postId;
  try {
    const post = await (
      await Post.findOneAndUpdate({ id: postId }, { $inc: { views: 1 } })
    ).populated({ path: 'creator', model: 'User', select: 'name' });
    if (!post) {
      const error = new Error('Could not find post.');
      error.statusCode = 404;
      throw error;
    }
    res.status(200).json({ post });
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }
    next(error);
  }
};

exports.updatePost = (req, res, next) => {
  const postId = req.params.postId;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error('Validation failed, invalid data.');
    error.statusCode = 422;
    throw error;
  }
  (async () => {
    const { name, description } = req.body;
    try {
      const post = await Post.findOne({ id: postId });
      if (!post) {
        const error = new Error('Could not find post.');
        error.statusCode = 404;
        throw error;
      }
      if (post.creator.toString() !== req.userId) {
        const error = new Error('Not authorized.');
        error.statusCode = 403;
        throw error;
      }
      post.name = name;
      post.description = description;
      await post.save();
      res.status(200).json({ message: 'Post updated!', post });
    } catch (error) {
      if (!error.statusCode) {
        error.statusCode = 500;
      }
      next(error);
    }
  })();
};

exports.deletePost = async (req, res, next) => {
  const { postId } = req.params;
  try {
    const post = await Post.findOne({ id: postId });
    if (!post) {
      const error = new Error('Could not find post.');
      error.statusCode = 404;
      throw error;
    }
    if (post.creator._id.toString() !== req.userId) {
      const error = new Error('Not authorized.');
      error.statusCode = 403;
      throw error;
    }
    await Post.findOneAndDelete({ id: postId });
    const user = await User.findById(req.userId);
    user.posts.pull(post._id.toString());
    await user.save();

    const topic = await Topic.findById(post.topic.toString());
    await topic.posts.pull(post._id.toString());

    if (topic.lastPost.toString() === post._id.toString()) {
      if (topic.posts.length > 0) {
        topic.lastPost = topic.posts[topic.posts.length - 1];
      } else {
        topic.lastPost = '';
      }
    }
    await topic.save();

    const forum = await Forum.findById(topic.forum.toString());

    if (forum.lastPost.toString() === post._id.toString()) {
      const [lastPost] = await Forum.aggregate([
        { $match: { _id: new mongoose.Types.ObjectId(topic.forum) } },
        { $unwind: '$topics' },
        {
          $lookup: {
            from: 'topics',
            localField: 'topics',
            foreignField: '_id',
            as: 'topics',
          },
        },
        { $unwind: '$topics' },
        {
          $lookup: {
            from: 'posts',
            localField: 'topics.lastPost',
            foreignField: '_id',
            as: 'topics.lastPost',
          },
        },
        { $unwind: '$topics.lastPost' },
        {
          $sort: { 'topics.lastPost.createdAt': -1 },
        },
        {
          $group: {
            _id: null,
            lastPost: { $push: '$topics.lastPost' },
          },
        },
        {
          $project: {
            _id: 0,
            lastPost: { $arrayElemAt: ['$lastPost', 0] },
          },
        },
        {
          $replaceRoot: { newRoot: { $ifNull: ['$lastPost', ''] } },
        },
      ]);
      if (lastPost) {
        forum.lastPost = lastPost._id;
      } else {
        delete forum.lastPost;
      }
      forum.save();
    }

    res.status(200).json({ message: 'Post was deleted.' });
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }
    next(error);
  }
};
