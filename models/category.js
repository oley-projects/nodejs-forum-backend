const mongoose = require('mongoose');
const slugify = require('slugify');
const Counter = require('./counter');
const Schema = mongoose.Schema;

const categorySchema = new Schema(
  {
    id: { type: String },
    name: { type: String, required: true, unique: true },
    description: { type: String },
    slug: { type: String },
    creator: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    forums: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Forum',
      },
    ],
    views: { type: Number, required: true },
  },
  { timestamps: true, versionKey: false }
);

categorySchema.pre('save', async function () {
  const doc = this;
  doc.slug = await slugify(doc.name);
  if (!this.isNew) return;
  const categoryID = await Counter.increment('categoryID');
  this.id = categoryID;
});

categorySchema.set('toJSON', {
  transform: (document, returnedObject) => {
    const createdAt = returnedObject.createdAt;
    const updatedAt = returnedObject.updatedAt;
    returnedObject.createdAt = Date.parse(createdAt) / 1000;
    returnedObject.updatedAt = Date.parse(updatedAt) / 1000;
  },
});

module.exports = mongoose.model('Category', categorySchema);
