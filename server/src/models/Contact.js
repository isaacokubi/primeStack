import mongoose from 'mongoose';

const contactSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, lowercase: true, trim: true, index: true },
  company: String,
  phone: String,
  projectType: String,
  budget: String,
  message: { type: String, required: true, trim: true },
  status: { type: String, enum: ['New', 'Contacted', 'In Progress', 'Converted', 'Closed'], default: 'New' }
}, { timestamps: true });

export default mongoose.models.Contact || mongoose.model('Contact', contactSchema);
