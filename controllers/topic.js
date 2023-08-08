const { validationResult } = require('express-validator');

const Post = require('../models/post');
const Topic = require('../models/topic');
const User = require('../models/user');

exports.getPosts = async (req, res, next) => {
  const currentPage = req.query.page || 1;
  const limit = req.query.limit;
  let totalItems = 0;
  let perPage = 10;
  try {
    totalItems = await Post.find().countDocuments();
    if (limit > 0 && limit < 100) {
      perPage = limit;
    } else if (limit === '-1' && totalItems < 100) {
      perPage = totalItems;
    }
    const posts = await Post.find()
      .skip((currentPage - 1) * perPage)
      .limit(perPage);
    res.status(200).json({ posts, totalItems });
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }
  }
};

exports.createPost = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error('Validation failed, invalid data.');
    error.statusCode = 422;
    throw error;
  }
  const { name, description } = req.body;
  const { topicId } = req.params;
  let creator;
  const post = new Post({
    name,
    description,
    creator: { _id: req.userId, name: req.userName },
    topic: topicId,
    replies: '0',
    views: '0',
  });
  try {
    const user = await User.findById(req.userId);
    creator = user;
    user.posts.push(post);
    await user.save();

    const topic = await Topic.findOne({ id: topicId });
    topic.posts.push(post);
    await topic.save();

    await post.save();

    res.status(201).json({
      message: 'Post created!',
      post,
      creator: { _id: creator._id, name: creator.name },
    });
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }
    next(error);
  }
};

exports.getPost = async (req, res, next) => {
  const postId = req.params.postId;
  try {
    const post = await Post.findOne({ id: postId });
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

exports.updatePost = async (req, res, next) => {
  const postId = req.params.postId;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error('Validation failed, invalid data.');
    error.statusCode = 422;
    throw error;
  }
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
};

exports.deletePost = async (req, res, next) => {
  const { postId, topicId } = req.params;
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
    const topic = await Topic.findOneAndDelete({ id: topicId });
    topic.posts.pull(topic._id.toString());
    res.status(200).json({ message: 'Post was deleted.' });
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }
    next(error);
  }
};
