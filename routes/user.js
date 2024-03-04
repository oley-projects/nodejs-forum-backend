const express = require('express');
const { body } = require('express-validator');

const User = require('../models/user');
const userController = require('../controllers/user');

const router = express.Router();

router.get('/users/:keywords', userController.getUsers);

router.put(
  '/user/signup',
  [
    body('email')
      .isEmail()
      .withMessage('Please enter a valid Email.')
      .custom(async (value, { req }) => {
        const userDoc = await User.findOne({ email: value });
        if (userDoc) {
          return Promise.reject('Email address already exists!');
        }
      })
      .normalizeEmail(),
    body('password').trim().isLength({ min: 5, max: 25 }),
    body('name').trim().isLength({ min: 2, max: 25 }),
  ],
  userController.signup
);

router.post(
  '/user/login',
  [
    body('email')
      .isEmail()
      .withMessage('Please enter a valid Email.')
      .custom(async (value, { req }) => {})
      .normalizeEmail(),
    body('password').trim().isLength({ min: 5, max: 25 }),
  ],
  userController.login
);

module.exports = router;
