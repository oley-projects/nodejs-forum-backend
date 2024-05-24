const express = require('express');
const { body } = require('express-validator');

const User = require('../models/user');
const userController = require('../controllers/user');
const isAuth = require('../middleware/is-auth');

const router = express.Router();

router.get('/users/:keywords', userController.getUsers);

router.get('/user/:userId', isAuth, userController.getUser);

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

router.put(
  '/user/:userId',
  isAuth,
  [
    body('name').trim().isLength({ min: 2, max: 25 }),
    body('rank').trim().isLength({ min: 3, max: 25 }),
    body('location')
      .optional({ checkFalsy: true })
      .trim()
      .isLength({ min: 3, max: 25 }),
  ],
  userController.updateUser
);

router.delete('user/:userId', isAuth, userController.deleteUser);

module.exports = router;
