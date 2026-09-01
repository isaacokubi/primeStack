import mongoose from 'mongoose';

const O = { timestamps: true };

const siteSettingsSchema = new mongoose.Schema({
  key: { type: String, unique: true, default: 'site' },
  businessType: { type: String, default: 'technology' },
  name: { type: String, default: 'stackTeck' },
  tagline: { type: String, default: 'Software that moves your business forward.' },
  description: { type: String, default: 'We design, build and operate dependable software products that solve complex business problems and create measurable value.' },
  email: { type: String, default: 'hello@primestack.dev' },
  phone: { type: String, default: '' },
  logoUrl: { type: String, default: '' },
  faviconUrl: { type: String, default: '' },
  founderImageUrl: { type: String, default: '' },
  founderName: { type: String, default: 'Isaac Ogubi' },
  founderCompanyName: { type: String, default: 'stackTeck' },
  primaryColor: { type: String, default: '#111827' },
  accentColor: { type: String, default: '#2563eb' },
  backgroundColor: { type: String, default: '#ffffff' },
  textColor: { type: String, default: '#111827' },
  nav: { type: [mongoose.Schema.Types.Mixed], default: [] },
  sections: { type: mongoose.Schema.Types.Mixed, default: {} },
  home: { type: mongoose.Schema.Types.Mixed, default: {} },
  pages: { type: mongoose.Schema.Types.Mixed, default: {} },
  services: { type: [mongoose.Schema.Types.Mixed], default: [] },
  technologies: { type: [String], default: [] },
  values: { type: [String], default: [] },
  stats: { type: [mongoose.Schema.Types.Mixed], default: [] },
  footer: { type: mongoose.Schema.Types.Mixed, default: {} },
  seo: { type: mongoose.Schema.Types.Mixed, default: {} }
}, O);

siteSettingsSchema.pre('findOneAndUpdate', function syncFounderFields(next) {
  const update = this.getUpdate() || {};
  const home = update.home && typeof update.home === 'object' ? { ...update.home } : {};
  const founderName = String(home.founderName ?? update.founderName ?? '').trim();
  const founderCompanyName = String(home.founderCompanyName ?? update.founderCompanyName ?? '').trim();

  if (founderName) {
    home.founderName = founderName;
    update.founderName = founderName;
  }
  if (founderCompanyName) {
    home.founderCompanyName = founderCompanyName;
    update.founderCompanyName = founderCompanyName;
  }
  if (Object.keys(home).length) update.home = home;
  this.setUpdate(update);
  next();
});

export default mongoose.models.SiteSettings || mongoose.model('SiteSettings', siteSettingsSchema);
