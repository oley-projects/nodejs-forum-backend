const { validationResult } = require('express-validator');

const Category = require('../models/category');
const User = require('../models/user');
const Forum = require('../models/forum');
const Topic = require('../models/topic');
const Post = require('../models/post');

exports.getCategories = async (req, res, next) => {
  const currentPage = req.query.page || 1;
  const limit = req.query.limit;
  let perPage = 10;
  try {
    if (limit > 100) {
      perPage = 100;
    } else if (limit < 0) {
      perPage = 10;
    } else {
      perPage = limit;
    }
    const skip = (currentPage - 1) * perPage;
    const categoriesCursor = await Category.aggregate([
      {
        $lookup: {
          from: 'forums',
          let: { forums: '$forums' },
          pipeline: [
            {
              $match: {
                $expr: { $in: ['$_id', '$$forums'] },
              },
            },
            {
              $lookup: {
                from: 'topics',
                let: { topics: '$topics' },
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        $in: ['$_id', '$$topics'],
                      },
                    },
                  },
                ],
                as: 'topics',
              },
            },
            {
              $lookup: {
                from: 'users',
                localField: 'creator',
                foreignField: '_id',
                pipeline: [
                  {
                    $project: {
                      _id: 1,
                      email: 1,
                      name: 1,
                    },
                  },
                ],
                as: 'creator',
              },
            },
            {
              $lookup: {
                from: 'posts',
                localField: 'lastPost',
                foreignField: '_id',
                pipeline: [
                  {
                    $lookup: {
                      from: 'users',
                      localField: 'creator',
                      foreignField: '_id',
                      pipeline: [
                        {
                          $project: {
                            _id: 1,
                            id: 1,
                            name: 1,
                          },
                        },
                      ],
                      as: 'creator',
                    },
                  },
                  {
                    $lookup: {
                      from: 'topics',
                      localField: 'topic',
                      foreignField: '_id',
                      pipeline: [
                        {
                          $project: {
                            _id: 1,
                            id: 1,
                            name: 1,
                          },
                        },
                      ],
                      as: 'topic',
                    },
                  },
                  {
                    $set: {
                      creator: { $first: '$creator' },
                      topic: { $first: '$topic' },
                      createdAt: {
                        $floor: { $divide: [{ $toLong: '$createdAt' }, 1000] },
                      },
                      updatedAt: {
                        $floor: { $divide: [{ $toLong: '$updatedAt' }, 1000] },
                      },
                    },
                  },
                ],
                as: 'lastPost',
              },
            },
            {
              $unwind: { path: '$lastPost', preserveNullAndEmptyArrays: true },
            },
            {
              $addFields: {
                totalPosts: {
                  $sum: {
                    $map: {
                      input: '$topics',
                      in: { $size: '$$this.posts' },
                    },
                  },
                },
                totalTopics: { $size: '$topics' },
              },
            },
            {
              $set: {
                creator: {
                  $first: '$creator',
                },
              },
            },
            {
              $project: {
                topics: 0,
              },
            },
          ],
          as: 'forums',
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'creator',
          foreignField: '_id',
          pipeline: [{ $project: { _id: 1, email: 1, name: 1 } }],
          as: 'creator',
        },
      },
      {
        $set: {
          creator: { $first: '$creator' },
        },
      },
      {
        $facet: {
          categories: [
            { $skip: parseInt(skip) },
            { $limit: parseInt(perPage) },
          ],
          totalItems: [{ $count: 'count' }],
        },
      },
      {
        $project: {
          categories: 1,
          totalItems: { $first: '$totalItems.count' },
        },
      },
      {
        $lookup: {
          from: 'posts',
          let: {},
          pipeline: [
            {
              $sort: { createdAt: -1 },
            },
            {
              $limit: 10,
            },
            {
              $lookup: {
                from: 'users',
                localField: 'creator',
                foreignField: '_id',
                pipeline: [
                  {
                    $project: {
                      _id: 1,
                      email: 1,
                      name: 1,
                    },
                  },
                ],
                as: 'creator',
              },
            },
            {
              $lookup: {
                from: 'topics',
                localField: 'topic',
                foreignField: '_id',
                pipeline: [
                  {
                    $project: {
                      _id: 1,
                      name: 1,
                      description: 1,
                      slug: 1,
                      id: 1,
                    },
                  },
                ],
                as: 'topic',
              },
            },
            {
              $set: {
                creator: { $first: '$creator' },
                topic: { $first: '$topic' },
                createdAt: {
                  $floor: { $divide: [{ $toLong: '$createdAt' }, 1000] },
                },
                updatedAt: {
                  $floor: { $divide: [{ $toLong: '$updatedAt' }, 1000] },
                },
              },
            },
          ],
          as: 'lastPosts',
        },
      },
    ]);
    const { categories, totalItems, lastPosts } = categoriesCursor[0];
    res.status(200).json({
      categories,
      totalItems,
      lastPosts,
    });
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }
    next(error);
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
    /*const category = await Category.aggregate([
      { $match: { id: categoryId } },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'creator',
        },
      },
    ]);*/
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
    const [category] = await Category.aggregate([
      { $match: { id: categoryId } },
      {
        $lookup: {
          from: 'forums',
          let: { forums: '$forums' },
          pipeline: [
            {
              $match: {
                $expr: { $in: ['$_id', '$$forums'] },
              },
            },
            { $project: { topics: 1 } },
            {
              $lookup: {
                from: 'topics',
                let: { topics: '$topics' },
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        $in: ['$_id', '$$topics'],
                      },
                    },
                  },
                  { $project: { posts: 1 } },
                ],
                as: 'topics',
              },
            },
          ],
          as: 'forums',
        },
      },
      {
        $unwind: {
          path: '$forums',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $unwind: {
          path: '$forums.topics',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $unwind: {
          path: '$forums.topics.posts',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $group: {
          _id: '$_id',
          creator: { $first: '$creator' },
          forums: { $push: '$forums' },
          topics: { $push: '$forums.topics' },
          posts: { $push: '$forums.topics.posts' },
        },
      },
      {
        $set: {
          forums: {
            $setUnion: ['$forums._id', []],
          },
          topics: {
            $setUnion: ['$topics._id', []],
          },
        },
      },
    ]);
    const { _id: id, forums, topics, posts } = category;
    if (!id) {
      const error = new Error('Could not find category.');
      error.statusCode = 404;
      throw error;
    }
    if (category.creator.toString() !== req.userId) {
      const error = new Error('Not authorized.');
      error.statusCode = 403;
      throw error;
    }
    if (forums.length > 0) {
      await Forum.deleteMany({ _id: { $in: forums } });
      if (topics.length > 0) {
        await Topic.deleteMany({ _id: { $in: topics } });
        if (posts.length > 0) {
          await Post.deleteMany({ _id: { $in: posts } });
        }
      }
    }
    await User.updateMany(
      {},
      {
        $pull: {
          categories: id,
          forums: { $in: forums },
          topics: { $in: topics },
          posts: { $in: posts },
        },
      }
    );
    await Category.findByIdAndDelete(id);
    res.status(200).json({ message: 'Category was deleted.' });
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }
    next(error);
  }
};
