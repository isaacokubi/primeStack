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
  status: { type: String, enum: ['Live', 'Beta', 'Coming Soon', 'Archived', 'Completed', 'Planning'], default: 'Live' },
  websiteUrl: String,
  documentationUrl: String,
  releaseDate: Date,
  featured: { type: Boolean, default: false },
  published: { type: Boolean, default: true },
  seo: { title: String, description: String, keywords: [String], ogImage: String }
}, { timestamps: true });

/*
 * Protect product media during edits.
 * The CMS can send an empty logo/screenshots value when an image field was
 * not changed. Never let that accidental empty value erase media already
 * stored in MongoDB. An explicit clear operation can opt in with
 * clearScreenshots: true.
 */
productSchema.pre('findOneAndUpdate', function(next) {
  const update = this.getUpdate() || {};
  const target = update.$set || update;

  if (target.logo === '' || target.logo == null) {
    if (update.$set) delete update.$set.logo;
    else delete update.logo;
  }

  if (Array.isArray(target.screenshots)) {
    target.screenshots = target.screenshots.filter(Boolean);
    if (target.screenshots.length === 0 && target.clearScreenshots !== true) {
      if (update.$set) delete update.$set.screenshots;
      else delete update.screenshots;
    }
  }

  if (update.$set?.clearScreenshots !== undefined) delete update.$set.clearScreenshots;
  if (update.clearScreenshots !== undefined) delete update.clearScreenshots;

  next();
});

export default mongoose.models.Product || mongoose.model('Product', productSchema);
