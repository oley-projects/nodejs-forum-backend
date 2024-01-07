const express = require('express');
const { body } = require('express-validator');

const postController = require('../controllers/post');
const isAuth = require('../middleware/is-auth');

const router = express.Router();

router.get('/posts/', postController.getPosts);
router.get('/results/:query', postController.getPosts);

router.post(
  '/post',
  isAuth,
  [body('description').trim().isLength({ min: 5, max: 200 })],
  postController.createPost
);

router.get('/post/:postId', postController.getPost);

router.put(
  '/post/:postId',
  isAuth,
  [body('description').trim().isLength({ min: 5, max: 200 })],
  postController.updatePost
);

router.delete('/post/:postId', isAuth, postController.deletePost);

module.exports = router;
