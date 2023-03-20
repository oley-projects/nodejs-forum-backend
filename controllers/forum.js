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

exports.getTopics = (req, res, next) => {
  res.status(200).json({
    topics: [
      {
        id: 1,
        name: 'Topic 1',
        description: '',
        createdUser: 'User',
        createdAt: new Date().toLocaleString(),
        replies: '3',
        views: '12',
        lastPostUser: 'User 1',
        lastPostCreatedAt: new Date().toLocaleString(),
      },
      {
        id: 2,
        name: 'Topic 2',
        description: 'Topic Description',
        createdUser: 'User2',
        createdAt: new Date().toLocaleString(),
        replies: '2',
        views: '21',
        lastPostUser: 'User',
        lastPostCreatedAt: new Date().toLocaleString(),
      },
    ],
  });
};

exports.createTopic = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      message: 'Validation failed, invalid data.',
      errors: errors.array(),
    });
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
  topic
    .save()
    .then((result) => {
      console.log(result);
      res.status(201).json({
        message: 'Topic created!',
        topic: result,
      });
    })
    .catch();
};
