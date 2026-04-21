import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema({
  manhwaId: { type: mongoose.Schema.Types.ObjectId, ref: 'Manhwa', required: true, index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment', default: null },
  content: { type: String, required: true, maxlength: 2000 },
  likes: { type: Number, default: 0 },
  dislikes: { type: Number, default: 0 },
  isDeleted: { type: Boolean, default: false },
  isReported: { type: Boolean, default: false },
}, { timestamps: true });

export default mongoose.model('Comment', commentSchema);
