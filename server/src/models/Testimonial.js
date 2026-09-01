import mongoose from 'mongoose';

const testimonialSchema = new mongoose.Schema({
  quote: { type: String, required: true, trim: true },
  customerName: { type: String, required: true, trim: true },
  position: String,
  company: String,
  photo: String,
  featured: { type: Boolean, default: false }
}, { timestamps: true });

export default mongoose.models.Testimonial || mongoose.model('Testimonial', testimonialSchema);
