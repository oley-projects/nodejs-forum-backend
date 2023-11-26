const mongoose = require('mongoose');
const slugify = require('slugify');
const Counter = require('./counter');
const Schema = mongoose.Schema;

const forumSchema = new Schema(
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
    topics: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Topic',
      },
    ],
    views: { type: String, required: true },
    lastPostUser: { type: String, required: true },
    lastPostCreatedAt: { type: String, required: true },
  },
  { timestamps: true, versionKey: false }
);

forumSchema.virtual('total').get(function () {
  return this.topics.length;
});

forumSchema.pre('save', async function () {
  const doc = this;
  doc.slug = await slugify(doc.name);
  if (!this.isNew) return;
  const forumID = await Counter.increment('forumID');
  this.id = forumID;
});

forumSchema.set('toJSON', {
  transform: (document, returnedObject) => {
    const createdAt = returnedObject.createdAt;
    const updatedAt = returnedObject.updatedAt;
    returnedObject.createdAt = new Date(createdAt).toLocaleString();
    returnedObject.updatedAt = new Date(updatedAt).toLocaleString();
  },
});

module.exports = mongoose.model('Forum', forumSchema);
