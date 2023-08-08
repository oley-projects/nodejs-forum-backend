const express = require('express');
const { body } = require('express-validator');

const topicController = require('../controllers/topic');
const isAuth = require('../middleware/is-auth');

const router = express.Router();

router.get('/posts', topicController.getPosts);
router.post(
  '/post',
  isAuth,
  [
    body('name').trim().isLength({ min: 3, max: 40 }),
    body('description').trim().isLength({ min: 5, max: 200 }),
  ],
  topicController.createPost
);
router.get('/post/:postId', topicController.getPost);

router.put(
  '/post/:postId',
  isAuth,
  [
    body('name').trim().isLength({ min: 3, max: 40 }),
    body('description').trim().isLength({ min: 5, max: 200 }),
  ],
  topicController.updatePost
);

router.delete('/post/:postId', isAuth, topicController.deletePost);

module.exports = router;
