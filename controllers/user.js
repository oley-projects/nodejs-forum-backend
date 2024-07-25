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

exports.getUser = async (req, res, next) => {
  const userId = req.params.userId;
  try {
    const user = await User.findOne({ id: userId });
    if (!user) {
      const error = new Error('Could not find user.');
      error.statusCode = 404;
      throw error;
    }
    res.status(200).json({
      id: user.id,
      userId: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
      rank: user.rank,
      createdAt: user.createdAt,
    });
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
      id: loadedUser.id,
      userId: loadedUser._id.toString(),
      email: loadedUser.email,
      name: loadedUser.name,
      role: loadedUser.role,
      rank: loadedUser.rank,
      createdAt: loadedUser.createdAt,
    });
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }
    next(error);
  }
};

exports.updateUser = (req, res, next) => {
  const userId = req.params.userId;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error('Validation failed, invalid data.');
    error.statusCode = 422;
    throw error;
  }
  (async () => {
    const { name, rank, location } = req.body;
    try {
      const user = await User.findOne({ id: userId });
      if (!user) {
        const error = new Error('Could not find user.');
        error.statusCode = 404;
        throw error;
      }
      if (user.id !== userId) {
        const error = new Error('Not authorized.');
        error.statusCode = 403;
        throw error;
      }
      user.name = name;
      user.rank = rank;
      user.location = location;
      await user.save();
      res.status(200).json({ message: 'User updated!', user });
    } catch (error) {
      if (!error.statusCode) {
        error.statusCode = 500;
      }
      next(error);
    }
  })();
};

exports.deleteUser = async (req, res, next) => {
  const { userId } = req.params;
  try {
    const user = await User.findOne({ id: userId });
    if (!user) {
      const error = new Error('Could not find user.');
      error.statusCode = 404;
      throw error;
    }
    if (user.id !== userId) {
      const error = new Error('Not authorized.');
      error.statusCode = 403;
      throw error;
    }
    /* if (user.posts.length > 0) {
    await Post.deleteMany({ _id: { $in: user.posts } });
  }
  if (user.topics.length > 0) {
    await Topic.deleteMany({ _id: { $in: user.topics } });
  }
  if (user.forums.length > 0) {
    await Forum.deleteMany({ _id: { $in: user.forums } });
  }
  if (user.categories.length > 0) {
    await Category.deleteMany({ _id: { $in: user.categories } });
  } */

    await User.findOneAndDelete({ id: userId });

    res.status(200).json({ message: 'User was deleted.' });
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }
    next(error);
  }
};
