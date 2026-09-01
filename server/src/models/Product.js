import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, index: true, trim: true },
  tagline: String,
  description: String,
  longDescription: String,
  category: { type: String, default: 'Business', index: true },
  logo: String,
  screenshots: [String],
  features: [{ title: String, description: String, icon: String }],
  benefits: [String],
  useCases: [String],
  pricing: [{ name: String, price: String, description: String, features: [String] }],
  faq: [{ question: String, answer: String }],
  platforms: [String],
  technologies: [String],
  status: { type: String, enum: ['Live', 'Beta', 'Coming Soon', 'Archived'], default: 'Live' },
  websiteUrl: String,
  documentationUrl: String,
  releaseDate: Date,
  featured: { type: Boolean, default: false },
  published: { type: Boolean, default: true },
  seo: { title: String, description: String, keywords: [String], ogImage: String }
}, { timestamps: true });

export default mongoose.models.Product || mongoose.model('Product', productSchema);
