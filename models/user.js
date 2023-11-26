const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      default: 'user',
    },
    rank: {
      type: String,
      default: 'new user',
    },
    categories: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Category',
      },
    ],
    forums: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Forum',
      },
    ],
    topics: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Topic',
      },
    ],
    posts: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Post',
      },
    ],
  },
  { timestamps: true, versionKey: false }
);

module.exports = mongoose.model('User', userSchema);
