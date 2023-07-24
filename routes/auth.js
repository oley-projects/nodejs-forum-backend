const express = require('express');
const { body } = require('express-validator');

const User = require('../models/user');
const authController = require('../controllers/auth');

const router = express.Router();

router.put(
  '/signup',
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
  authController.signup
);

module.exports = router;
