const { validationResult } = require('express-validator');

const Category = require('../models/category');
const User = require('../models/user');
const Forum = require('../models/forum');

exports.getCategories = async (req, res, next) => {
  const currentPage = req.query.page || 1;
  const limit = req.query.limit;
  let totalItems = 0;
  let perPage = 10;
  try {
    totalItems = await Category.find().countDocuments();
    if (limit > 0 && limit < 100) {
      perPage = limit;
    } else if (limit === '-1' && totalItems < 100) {
      perPage = totalItems;
    }
    const categories = await Category.find()
      .skip((currentPage - 1) * perPage)
      .limit(perPage)
      .populate([
        {
          path: 'forums',
          options: {
            sort: {},
            skip: (currentPage - 1) * perPage,
            limit: perPage,
          },
          populate: [{ path: 'creator', model: 'User', select: 'name' }],
        },
        { path: 'creator', model: 'User', select: 'name' },
      ]);
    res.status(200).json({ categories, totalItems });
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }
  }
};

exports.createCategory = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error('Validation failed, invalid data.');
    error.statusCode = 422;
    throw error;
  }
  (async () => {
    const { name, description } = req.body;
    const category = new Category({
      name,
      description,
      creator: req.userId,
      forums: [],
      replies: '0',
      views: '0',
      lastPostUser: 'User',
      lastPostCreatedAt: new Date().toLocaleString(),
    });
    try {
      const user = await User.findById(req.userId);
      user.categories.push(category);
      await user.save();

      await category.save();

      res.status(201).json({
        message: 'Category created!',
        category,
      });
    } catch (error) {
      if (!error.statusCode) {
        error.statusCode = 500;
      }
      next(error);
    }
  })();
};

exports.getCategory = async (req, res, next) => {
  const currentPage = req.query.page;
  const limit = req.query.limit || 10;
  const categoryId = req.params.categoryId;
  let perPage = 10;
  try {
    if (limit > 100) {
      perPage = 100;
    } else if (limit < 0) {
      perPage = 10;
    } else {
      perPage = limit;
    }

    const category = await Category.findOne({ id: categoryId }).populate([
      { path: 'creator', model: 'User', select: 'name' },
      {
        path: 'forums',
        options: {
          sort: {},
          skip: (currentPage - 1) * perPage,
          limit: perPage,
        },
        populate: [{ path: 'creator', model: 'User', select: 'name' }],
      },
    ]);
    if (!category) {
      const error = new Error('Could not find category.');
      error.statusCode = 404;
      throw error;
    }
    res.status(200).json({ category });
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }
    next(error);
  }
};

exports.updateCategory = (req, res, next) => {
  const categoryId = req.params.categoryId;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error('Validation failed, invalid data.');
    error.statusCode = 422;
    throw error;
  }
  (async () => {
    const { name, description } = req.body;
    try {
      const category = await Category.findOne({ id: categoryId });
      if (!category) {
        const error = new Error('Could not find category.');
        error.statusCode = 404;
        throw error;
      }
      if (category.creator.toString() !== req.userId) {
        const error = new Error('Not authorized.');
        error.statusCode = 403;
        throw error;
      }
      category.name = name;
      category.description = description;
      await category.save();
      res.status(200).json({ message: 'Category updated!', category });
    } catch (error) {
      if (!error.statusCode) {
        error.statusCode = 500;
      }
      next(error);
    }
  })();
};

exports.deleteCategory = async (req, res, next) => {
  const { categoryId } = req.params;
  try {
    const category = await Category.findOne({ id: categoryId });
    if (!category) {
      const error = new Error('Could not find category.');
      error.statusCode = 404;
      throw error;
    }
    if (category.creator._id.toString() !== req.userId) {
      const error = new Error('Not authorized.');
      error.statusCode = 403;
      throw error;
    }
    if (category.forums.length > 0) {
      await User.updateMany(
        {},
        { $pull: { forums: { $in: category.forums } } }
      );
      await Forum.deleteMany({ _id: { $in: category.forums } });
    }
    await Category.findOneAndDelete({ id: categoryId });

    const user = await User.findById(req.userId);
    user.categories.pull(category._id.toString());
    await user.save();
    res.status(200).json({ message: 'Category was deleted.' });
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }
    next(error);
  }
};
