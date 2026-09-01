import mongoose from 'mongoose';

const contentSchema = new mongoose.Schema({
  type: { type: String, enum: ['blog', 'case-studies', 'jobs'], required: true, index: true },
  title: { type: String, required: true, trim: true },
  slug: { type: String, required: true, index: true, trim: true },
  description: String,
  content: String,
  category: String,
  industry: String,
  department: String,
  location: String,
  employmentType: String,
  experienceLevel: String,
  challenge: String,
  solution: String,
  technologies: [String],
  results: [String],
  metrics: [{ label: String, value: String }],
  requirements: [String],
  responsibilities: [String],
  coverImage: String,
  author: String,
  published: { type: Boolean, default: true },
  publishedAt: Date,
  seo: { type: mongoose.Schema.Types.Mixed, default: {} }
}, { timestamps: true });

contentSchema.index({ type: 1, slug: 1 }, { unique: true });

export default mongoose.models.Content || mongoose.model('Content', contentSchema);
