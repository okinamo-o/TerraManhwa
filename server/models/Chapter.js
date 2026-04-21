import mongoose from 'mongoose';

const pageSchema = new mongoose.Schema({
  url: { type: String, required: true },
  order: { type: Number, required: true },
});

const chapterSchema = new mongoose.Schema({
  manhwaId: { type: mongoose.Schema.Types.ObjectId, ref: 'Manhwa', required: true, index: true },
  chapterNumber: { type: Number, required: true },
  title: { type: String, default: '' },
  pages: [pageSchema],
  views: { type: Number, default: 0 },
  sourceUrl: { type: String }, // manhwaclan URL
}, { timestamps: true });

chapterSchema.index({ manhwaId: 1, chapterNumber: 1 }, { unique: true });

export default mongoose.model('Chapter', chapterSchema);
