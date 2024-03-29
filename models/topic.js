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
    replies: { type: String, required: true },
    views: { type: String, required: true },
    lastPostUser: { type: String, required: true },
    lastPostCreatedAt: { type: String, required: true },
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
    returnedObject.createdAt = new Date(createdAt).toLocaleString();
    returnedObject.updatedAt = new Date(updatedAt).toLocaleString();
  },
});

module.exports = mongoose.model('Topic', topicSchema);
