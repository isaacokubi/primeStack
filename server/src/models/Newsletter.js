import mongoose from 'mongoose';

const newsletterSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true }
}, { timestamps: true });

export default mongoose.models.Newsletter || mongoose.model('Newsletter', newsletterSchema);
