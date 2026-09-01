import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, minlength: 2 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
  password: { type: String, required: true, minlength: 8, select: false },
  role: { type: String, enum: ['Admin', 'Editor', 'Customer'], default: 'Customer' },
  status: { type: String, enum: ['Active', 'Suspended'], default: 'Active' },
  lastLoginAt: Date
}, { timestamps: true });

export default mongoose.models.User || mongoose.model('User', userSchema);
