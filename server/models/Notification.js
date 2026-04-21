import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  type: { 
    type: String, 
    enum: ['new_chapter', 'system', 'collection_like'], 
    default: 'new_chapter' 
  },
  manhwaId: { type: mongoose.Schema.Types.ObjectId, ref: 'Manhwa' },
  message: { type: String, required: true },
  link: { type: String }, // e.g. /read/solo-leveling/200
  isRead: { type: Boolean, default: false },
}, { timestamps: true });

export default mongoose.model('Notification', notificationSchema);
