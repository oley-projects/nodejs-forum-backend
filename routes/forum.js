const express = require('express');

const forumController = require('../controllers/forum');

const router = express.Router();

// GET /forum/categories
router.get('/categories', forumController.getCategories);

module.exports = router;
