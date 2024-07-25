const mongoose = require('mongoose');
const Counter = require('./counter');
const Schema = mongoose.Schema;

const postSchema = new Schema(
  {
    id: { type: String },
    name: { type: String },
    description: { type: String, required: true },
    creator: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    topic: { type: Schema.Types.ObjectId, ref: 'Topic', required: true },
    replies: { type: String, required: true },
    views: { type: String, required: true },
  },
  { timestamps: true, versionKey: false }
);

postSchema.pre('save', async function () {
  const postID = await Counter.increment('postID');
  this.id = postID;
});

postSchema.set('toJSON', {
  transform: (document, returnedObject) => {
    const createdAt = returnedObject.createdAt;
    const updatedAt = returnedObject.updatedAt;
    returnedObject.createdAt = Date.parse(createdAt) / 1000;
    returnedObject.updatedAt = Date.parse(updatedAt) / 1000;
  },
});

module.exports = mongoose.model('Post', postSchema);
