import mongoose from 'mongoose';

const siteVisitSchema = new mongoose.Schema({
  monthId: { type: String, required: true, unique: true }, // Format: "YYYY-MM"
  totalVisits: { type: Number, default: 0 },
}, { timestamps: true });

export default mongoose.model('SiteVisit', siteVisitSchema);
