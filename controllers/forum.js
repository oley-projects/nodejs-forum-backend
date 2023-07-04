const { validationResult } = require('express-validator');

const Topic = require('../models/topic');

exports.getCategories = (req, res, next) => {
  res.status(200).json({
    categories: [
      { id: 1, name: 'main' },
      { id: 2, name: 'addition' },
    ],
  });
};

exports.getTopics = async (req, res, next) => {
  try {
    const topics = await Topic.find();
    res.status(200).json({ topics });
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }
  }
};

exports.createTopic = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error('Validation failed, invalid data.');
    error.statusCode = 422;
    throw error;
  }
  const name = req.body.name;
  const description = req.body.description;
  const topic = new Topic({
    name,
    description,
    createdUser: 'User',
    replies: '0',
    views: '0',
    lastPostUser: 'User',
    lastPostCreatedAt: new Date().toLocaleString(),
  });
  try {
    await topic.save();
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
};

exports.getTopic = async (req, res, next) => {
  const topicId = req.params.topicId;
  try {
    const topic = await Topic.findById(topicId);
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

exports.updatePost = async (req, res, next) => {
  const topicId = req.params.topicId;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error('Validation failed, invalid data.');
    error.statusCode = 422;
    throw error;
  }
  const { name, description } = req.body;
  try {
    const topic = await Topic.findById(topicId);
    if (!topic) {
      const error = new Error('Could not find topic.');
      error.statusCode = 404;
      throw error;
    }
    topic.name = name;
    topic.description = description;
    await topic.save();
    res.status(200).json({ message: 'Post updated!', post });
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }
    next(error);
  }
};
