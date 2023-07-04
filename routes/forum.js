const express = require('express');
const { body } = require('express-validator');

const forumController = require('../controllers/forum');

const router = express.Router();

// GET /forum/categories
router.get('/categories', forumController.getCategories);
router.get('/topics', forumController.getTopics);
router.post(
  '/topic',
  [
    body('name').trim().isLength({ min: 3, max: 40 }),
    body('description').trim().isLength({ min: 5, max: 200 }),
  ],
  forumController.createTopic
);
router.get('topic/:topicId', forumController.getTopic);

// PUT /topic/id
router.put(
  'topic/:topicId',
  [
    body('name').trim().isLength({ min: 3, max: 40 }),
    body('description').trim().isLength({ min: 5, max: 200 }),
  ],
  forumController.updatePost
);

module.exports = router;
