import mongoose from 'mongoose';

const scrapeLogSchema = new mongoose.Schema({
  type: { type: String, enum: ['catalog', 'manhwa', 'chapter', 'update'], required: true },
  slug: { type: String },
  status: { type: String, enum: ['success', 'error', 'skipped'], default: 'success' },
  message: { type: String, default: '' },
  itemsProcessed: { type: Number, default: 0 },
  duration: { type: Number, default: 0 }, // ms
}, { timestamps: true });

export default mongoose.model('ScrapeLog', scrapeLogSchema);
