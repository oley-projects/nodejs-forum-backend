const express = require('express');

const forumController = require('../controllers/forum');

const router = express.Router();

// GET /forum/categories
router.get('/categories', forumController.getCategories);
router.get('/topics', forumController.getTopics);
router.post('/topic', forumController.createTopic);

module.exports = router;
