const express = require('express');
const { body } = require('express-validator');

const forumController = require('../controllers/forum');
const isAuth = require('../middleware/is-auth');

const router = express.Router();

router.get('/categories', forumController.getCategories);
router.get('/topics', forumController.getTopics);
router.post(
  '/topic',
  isAuth,
  [
    body('name').trim().isLength({ min: 3, max: 40 }),
    body('description').trim().isLength({ min: 5, max: 200 }),
  ],
  forumController.createTopic
);
router.get('/topic/:topicId', forumController.getTopic);

router.put(
  '/topic/:topicId',
  [
    body('name').trim().isLength({ min: 3, max: 40 }),
    body('description').trim().isLength({ min: 5, max: 200 }),
  ],
  forumController.updateTopic
);

router.delete('/topic/:topicId', forumController.deleteTopic);

module.exports = router;
