const express = require('express');
const { body } = require('express-validator');

const categoryController = require('../controllers/category');
const isAuth = require('../middleware/is-auth');

const router = express.Router();

router.get('/categories', categoryController.getCategories);
router.post(
  '/category',
  isAuth,
  [body('name').trim().isLength({ min: 3, max: 40 })],
  categoryController.createCategory
);
router.get('/category/:categoryId', categoryController.getCategory);

router.put(
  '/category/:categoryId',
  isAuth,
  [body('name').trim().isLength({ min: 3, max: 40 })],
  categoryController.updateCategory
);

router.delete(
  '/category/:categoryId',
  isAuth,
  categoryController.deleteCategory
);

module.exports = router;
