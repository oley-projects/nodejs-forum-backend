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
      required: true,
    },
    rank: {
      type: String,
      required: true,
    },
    topics: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Topic',
      },
    ],
  },
  { timestamps: true, versionKey: false }
);

module.exports = mongoose.model('User', userSchema);
