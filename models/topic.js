const mongoose = require('mongoose');
const slugify = require('slugify');
const Counter = require('./counter');
const Schema = mongoose.Schema;

const topicSchema = new Schema(
  {
    id: { type: String },
    name: { type: String, required: true, unique: true },
    slug: { type: String },
    description: { type: String, required: true },
    creator: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    forum: { type: Schema.Types.ObjectId, ref: 'Forum', required: true },
    posts: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Post',
      },
    ],
    views: { type: Number, required: true },
    lastPost: { type: Schema.Types.ObjectId, ref: 'Post' },
  },
  { timestamps: true, versionKey: false }
);

topicSchema.pre('save', async function () {
  const doc = this;
  doc.slug = await slugify(doc.name);
  if (!this.isNew) return;

  const topicID = await Counter.increment('topicID');
  this.id = topicID;
});

topicSchema.set('toJSON', {
  transform: (document, returnedObject) => {
    const createdAt = returnedObject.createdAt;
    const updatedAt = returnedObject.updatedAt;
    returnedObject.createdAt = Date.parse(createdAt) / 1000;
    returnedObject.updatedAt = Date.parse(updatedAt) / 1000;
  },
});

module.exports = mongoose.model('Topic', topicSchema);
