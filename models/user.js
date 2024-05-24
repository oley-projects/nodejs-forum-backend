const mongoose = require('mongoose');
const Counter = require('./counter');
const Schema = mongoose.Schema;

const userSchema = new Schema(
  {
    id: { type: String },
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
    birthday: {
      type: Date,
    },
    role: {
      type: String,
      default: 'user',
    },
    rank: {
      type: String,
      default: 'new user',
    },
    location: {
      type: String,
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

userSchema.pre('save', async function () {
  if (!this.isNew) return;
  const userID = await Counter.increment('userID');
  this.id = userID;
});

module.exports = mongoose.model('User', userSchema);
