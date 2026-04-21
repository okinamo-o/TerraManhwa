import mongoose from 'mongoose';

const manhwaSchema = new mongoose.Schema({
  title: { type: String, required: true, index: true },
  slug: { type: String, required: true, unique: true, index: true },
  alternativeTitles: [String],
  cover: { type: String, default: '' },
  synopsis: { type: String, default: '' },
  author: { type: String, default: 'Unknown' },
  artist: { type: String, default: '' },
  genres: [{ type: String, index: true }],
  status: {
    type: String,
    enum: ['Ongoing', 'Completed', 'Hiatus', 'Dropped'],
    default: 'Ongoing',
  },
  releaseYear: { type: Number },
  rating: {
    score: { type: Number, default: 0, min: 0, max: 10 },
    votes: { type: Number, default: 0 },
  },
  views: { type: Number, default: 0 },
  bookmarkCount: { type: Number, default: 0 },
  chapters: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Chapter' }],
  latestChapter: { type: Number, default: 0 },
  sourceUrl: { type: String }, // manhwaclan URL for scraper reference
  scrapeError: { type: Boolean, default: false },
}, { timestamps: true });

/* Text index for search */
manhwaSchema.index({ title: 'text', alternativeTitles: 'text', author: 'text', synopsis: 'text' });

export default mongoose.model('Manhwa', manhwaSchema);
