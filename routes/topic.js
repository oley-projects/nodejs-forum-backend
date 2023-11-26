const express = require('express');
const { body } = require('express-validator');

const topicController = require('../controllers/topic');
const isAuth = require('../middleware/is-auth');

const router = express.Router();

router.get('/topics', topicController.getTopics);
router.post(
  '/topic',
  isAuth,
  [
    body('name').trim().isLength({ min: 3, max: 40 }),
    body('description').trim().isLength({ min: 5, max: 200 }),
  ],
  topicController.createTopic
);
router.get('/topic/:topicId', topicController.getTopic);

router.put(
  '/topic/:topicId',
  isAuth,
  [
    body('name').trim().isLength({ min: 3, max: 40 }),
    body('description').trim().isLength({ min: 5, max: 200 }),
  ],
  topicController.updateTopic
);

router.delete('/topic/:topicId', isAuth, topicController.deleteTopic);

module.exports = router;
