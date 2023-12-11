const express = require('express');
const { body } = require('express-validator');

const forumController = require('../controllers/forum');
const isAuth = require('../middleware/is-auth');

const router = express.Router();

router.post(
  '/forum',
  isAuth,
  [
    body('name').trim().isLength({ min: 3, max: 40 }),
    body('description').trim().isLength({ min: 5, max: 200 }),
  ],
  forumController.createForum
);

router.get('/forum/:forumId', forumController.getForum);

router.put(
  '/forum/:forumId',
  isAuth,
  [
    body('name').trim().isLength({ min: 3, max: 40 }),
    body('description').trim().isLength({ min: 5, max: 200 }),
  ],
  forumController.updateForum
);

router.delete('/forum/:forumId', isAuth, forumController.deleteForum);

module.exports = router;
