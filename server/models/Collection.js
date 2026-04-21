import mongoose from 'mongoose';

const collectionSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 100 },
  description: { type: String, maxlength: 500, default: '' },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  manhwas: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Manhwa' }],
  isPublic: { type: Boolean, default: true },
  views: { type: Number, default: 0 },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
}, { timestamps: true });

// Ensure a user doesn't have duplicate collection titles
collectionSchema.index({ owner: 1, title: 1 }, { unique: true });

export default mongoose.model('Collection', collectionSchema);
