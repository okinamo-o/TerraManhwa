import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const readingHistorySchema = new mongoose.Schema({
  manhwaId: { type: mongoose.Schema.Types.ObjectId, ref: 'Manhwa' },
  chapterId: { type: mongoose.Schema.Types.ObjectId, ref: 'Chapter' },
  lastPage: { type: Number, default: 0 },
  updatedAt: { type: Date, default: Date.now },
});

const userSchema = new mongoose.Schema({
  username: {
    type: String, required: true, unique: true,
    trim: true, minlength: 3, maxlength: 30,
  },
  email: {
    type: String, required: true, unique: true,
    trim: true, lowercase: true,
  },
  passwordHash: { type: String, required: true },
  avatar: { type: String, default: '' },
  bio: { type: String, default: '', maxlength: 500 },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  bookmarks: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Manhwa' }],
  readingHistory: [readingHistorySchema],
  isActive: { type: Boolean, default: true },
  refreshToken: { type: String },
}, { timestamps: true });

/* Hash password before save */
userSchema.pre('save', async function (next) {
  if (!this.isModified('passwordHash')) return next();
  this.passwordHash = await bcrypt.hash(this.passwordHash, 12);
  next();
});

/* Compare password */
userSchema.methods.comparePassword = async function (password) {
  return bcrypt.compare(password, this.passwordHash);
};

/* Remove sensitive fields from JSON */
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.passwordHash;
  delete obj.refreshToken;
  return obj;
};

export default mongoose.model('User', userSchema);
