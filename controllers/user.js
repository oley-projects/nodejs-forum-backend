const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const dotenvConf = require('dotenv').config();
const TOKEN_KEY = dotenvConf.parsed.TOKEN_KEY;

const User = require('../models/user');

exports.getUsers = async (req, res, next) => {
  const keywords = req.params.keywords;
  const currentPage = req.query.page || 1;
  const limit = req.query.limit || 10;
  const sort = req.query.sort.split('_') || ['createAt', 'desc'];
  const [sortField, sortValue] = sort;
  const sortObj = {};
  sortObj[sortField] = sortValue;
  let totalItems = 0;
  let perPage = 10;
  const filter = {};
  if (keywords) {
    filter.name = { $regex: keywords };
  }
  try {
    totalItems = await User.find(filter).countDocuments();
    if (limit > 0 && limit < 100) {
      perPage = limit;
    } else if (limit === '-1' && totalItems < 100) {
      perPage = totalItems;
    }
    const users = await User.find(filter)
      .skip((currentPage - 1) * perPage)
      .limit(perPage)
      .sort(sortObj)
      .select('-password');
    res.status(200).json({ users, totalItems });
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }
    next(error);
  }
};

exports.signup = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error('Validation failed, invalid data.');
    error.statusCode = 422;
    error.data = errors.array();
    throw error;
  }
  const { email, name, password } = req.body;
  bcrypt
    .hash(password, 12)
    .then((hashedPw) => {
      const user = new User({
        email,
        password: hashedPw,
        name,
      });
      return user.save();
    })
    .then((result) =>
      res.status(201).json({ message: 'User created.', userId: result._id })
    )
    .catch((error) => {
      if (!error.statusCode) {
        error.statusCode = 500;
      }
      next(error);
    });
};

exports.login = async (req, res, next) => {
  const { email, password } = req.body;
  let loadedUser;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      const error = new Error('A user does not exists.');
      error.statusCode = 401;
      throw error;
    }
    loadedUser = user;
    const isEqual = await bcrypt.compare(password, user.password);
    if (!isEqual) {
      const error = new Error('Wrong password');
      error.statusCode = 401;
      throw error;
    }
    const token = jwt.sign(
      {
        userId: loadedUser._id.toString(),
        email: loadedUser.email,
        userName: loadedUser.name,
      },
      TOKEN_KEY,
      { expiresIn: '12h' }
    );
    res.status(200).json({
      token,
      userId: loadedUser._id.toString(),
      email: loadedUser.email,
    });
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }
    next(error);
  }
};
