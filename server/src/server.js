import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import inquiryConversationRoutes from './routes/inquiryConversation.routes.js';
import Product from './models/Product.js';
import Content from './models/Content.js';
import Contact from './models/Contact.js';
import Testimonial from './models/Testimonial.js';
import User from './models/User.js';
import Newsletter from './models/Newsletter.js';
import SiteSettings from './models/SiteSettings.js';
import { requireAuth, requireRole } from './middleware/auth.js';

const app = express();
const port = Number(process.env.PORT || 5000);
const clientUrl = (process.env.CLIENT_URL || 'http://localhost:5173').split(',').map(x => x.trim()).filter(Boolean);
const JWT_SECRET = process.env.JWT_SECRET || (process.env.NODE_ENV === 'production' ? null : 'development-only-secret-change-me');
if (!JWT_SECRET) throw new Error('JWT_SECRET must be configured in production');

app.set('trust proxy', 1);
app.use(helmet());
app.use(cors({
  origin: (origin, callback) => !origin || clientUrl.includes(origin) ? callback(null, true) : callback(new Error('CORS origin denied')),
  credentials: true
}));
app.use(express.json({ limit: '3mb' }));
app.use(express.urlencoded({ extended: true, limit: '3mb' }));
app.use(cookieParser());
app.use(rateLimit({ windowMs: 15 * 60 * 1000, limit: 300, standardHeaders: true, legacyHeaders: false }));

const slugify = value => String(value || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
const ok = (res, data, message = 'OK', meta = null, status = 200) => res.status(status).json({ success: true, message, data, ...(meta ? { meta } : {}) });
const fail = (res, message, status = 400) => res.status(status).json({ success: false, message });
const publicUser = user => ({ id: user._id, name: user.name, email: user.email, role: user.role, status: user.status });
const tokenFor = user => jwt.sign({ id: user._id.toString(), role: user.role }, JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
const setSession = (res, user) => res.cookie('ps_token', tokenFor(user), {
  httpOnly: true,
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  secure: process.env.COOKIE_SECURE === 'true' || process.env.NODE_ENV === 'production',
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: '/'
});
const auth = requireAuth;
const roles = requireRole;
const emailValid = email => /^\S+@\S+\.\S+$/.test(String(email || ''));

app.use('/api/inquiries', auth, inquiryConversationRoutes);

app.get('/', (_req, res) => ok(res, { name: 'primeStack API', version: '2.0.0' }));
app.get('/health', (_req, res) => ok(res, { status: 'OK', database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' }));

app.post('/api/auth/register', async (req, res) => {
  try {
    const name = String(req.body?.name || '').trim();
    const email = String(req.body?.email || '').toLowerCase().trim();
    const password = String(req.body?.password || '');
    if (name.length < 2) return fail(res, 'Full name is required');
    if (!emailValid(email)) return fail(res, 'A valid email address is required');
    if (password.length < 8) return fail(res, 'Password must be at least 8 characters');
    if (await User.exists({ email })) return fail(res, 'An account with this email already exists', 409);
    const user = await User.create({ name, email, password: await bcrypt.hash(password, 12), role: 'Customer' });
    setSession(res, user);
    return ok(res, { user: publicUser(user) }, 'Account created', null, 201);
  } catch (error) {
    return fail(res, error.code === 11000 ? 'An account with this email already exists' : error.message, 500);
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const email = String(req.body?.email || '').toLowerCase().trim();
    const password = String(req.body?.password || '');
    const user = await User.findOne({ email }).select('+password');
    if (!user || user.status !== 'Active' || !(await bcrypt.compare(password, user.password))) return fail(res, 'Invalid email or password', 401);
    user.lastLoginAt = new Date();
    await user.save();
    setSession(res, user);
    return ok(res, { user: publicUser(user) }, 'Signed in');
  } catch (error) {
    return fail(res, error.message, 500);
  }
});

app.post('/api/auth/logout', (_req, res) => {
  res.clearCookie('ps_token', {
    httpOnly: true,
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    secure: process.env.COOKIE_SECURE === 'true' || process.env.NODE_ENV === 'production',
    path: '/'
  });
  return ok(res, null, 'Signed out');
});

app.get('/api/auth/me', auth, async (req, res) => {
  const user = await User.findById(req.user.id);
  return user ? ok(res, { user: publicUser(user) }) : fail(res, 'User not found', 404);
});

app.put('/api/auth/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return fail(res, 'User not found', 404);
    if (req.body.name !== undefined) {
      const name = String(req.body.name).trim();
      if (name.length < 2) return fail(res, 'Name must contain at least 2 characters');
      user.name = name;
    }
    if (req.body.password) {
      const password = String(req.body.password);
      if (password.length < 8) return fail(res, 'New password must be at least 8 characters');
      user.password = await bcrypt.hash(password, 12);
    }
    await user.save();
    return ok(res, { user: publicUser(user) }, 'Profile updated');
  } catch (error) {
    return fail(res, error.message, 500);
  }
});

app.get('/api/customer/dashboard', auth, roles('Customer'), async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return fail(res, 'User not found', 404);
    const [products, requests] = await Promise.all([
      Product.find({ published: true }).sort({ featured: -1, createdAt: -1 }).limit(6).lean(),
      Contact.find({ email: user.email }).sort({ createdAt: -1 }).limit(8).lean()
    ]);
    return ok(res, {
      user: publicUser(user),
      stats: { products: products.length, requests: await Contact.countDocuments({ email: user.email }) },
      products,
      requests
    });
  } catch (error) {
    return fail(res, error.message, 500);
  }
});

const siteDefaults = () => ({
  key: 'site',
  businessType: 'technology',
  name: 'primeStack',
  tagline: 'Software that moves your business forward.',
  description: 'We design, build and operate dependable software products that solve complex business problems and create measurable value.',
  email: process.env.SITE_EMAIL || 'hello@primestack.dev',
  phone: '', logoUrl: '', faviconUrl: '', founderImageUrl: '',
  primaryColor: '#111827', accentColor: '#2563eb', backgroundColor: '#ffffff', textColor: '#111827',
  nav: [
    { label: 'Products', path: '/products', visible: true }, { label: 'Services', path: '/services', visible: true },
    { label: 'Case Studies', path: '/case-studies', visible: true }, { label: 'Technology', path: '/technology', visible: true },
    { label: 'Blog', path: '/blog', visible: true }, { label: 'Careers', path: '/careers', visible: true }, { label: 'About', path: '/about', visible: true }
  ],
  sections: { hero: true, stats: true, products: true, services: true, caseStudies: true, testimonials: true, blog: true, cta: true, newsletter: true },
  home: {
    eyebrow: 'SOFTWARE PRODUCT COMPANY', title: 'Software that moves your business forward.',
    description: 'We design, build and operate dependable software products that solve complex business problems and create measurable value.',
    primaryCtaLabel: 'Explore products', secondaryCtaLabel: 'Work with us', productsEyebrow: 'OUR PRODUCTS', productsTitle: 'Software built to matter.',
    ctaEyebrow: 'BUILD WITH US', ctaTitle: 'Have a software idea?', ctaText: "Let's turn your complex business challenge into a product people love to use."
  },
  pages: {
    services: { eyebrow: 'CAPABILITIES', title: 'Services', text: 'From product strategy to scalable infrastructure, we build around the way your business actually works.' },
    about: { eyebrow: 'THE COMPANY', title: 'We build what comes next.', text: 'primeStack turns complex business problems into elegant, dependable digital products.' },
    technology: { eyebrow: 'ENGINEERING', title: 'Technology expertise', text: 'Modern tools selected for reliability, performance, security and maintainability.' },
    contact: { eyebrow: "LET'S TALK", title: 'Build something valuable.', text: 'Tell us what you are building, what problem you need to solve and where you want to go next.' },
    products: { eyebrow: 'PRODUCT PORTFOLIO', title: 'Products', text: 'Purpose-built solutions designed to simplify work, unlock insight and accelerate growth.' },
    caseStudies: { eyebrow: 'PROVEN OUTCOMES', title: 'Case studies', text: 'Real projects, real challenges, measurable results.' },
    blog: { eyebrow: 'INSIGHTS', title: 'Blog', text: 'Ideas, lessons and practical insights from our team.' },
    careers: { eyebrow: 'JOIN THE TEAM', title: 'Careers', text: 'Build meaningful products with a team that cares about quality.' }
  },
  services: [
    { name: 'Custom Software Development', description: 'Business software designed around your workflows.' },
    { name: 'Project Delivery', description: 'Planning, coordination and execution from idea to completion.' }
  ],
  technologies: ['React', 'Node.js', 'MongoDB', 'Cloud'],
  values: ['Quality', 'Transparency', 'Safety', 'Customer Focus'],
  stats: [{ value: '10+', label: 'Products' }, { value: '50K+', label: 'Users served' }, { value: '99.9%', label: 'Uptime' }, { value: '8+', label: 'Years experience' }],
  footer: { description: 'We build dependable solutions that create measurable business value.', copyright: 'All rights reserved.' },
  seo: {}
});

app.get('/api/site-settings', async (_req, res) => {
  try {
    const defaults = siteDefaults();
    let settings = await SiteSettings.findOne({ key: 'site' }).lean();
    if (!settings) settings = await SiteSettings.create(defaults);
    return ok(res, {
      ...defaults,
      ...settings,
      sections: { ...defaults.sections, ...(settings.sections || {}) },
      home: { ...defaults.home, ...(settings.home || {}) },
      pages: { ...defaults.pages, ...(settings.pages || {}) },
      footer: { ...defaults.footer, ...(settings.footer || {}) }
    });
  } catch (error) {
    return fail(res, error.message, 500);
  }
});

app.put('/api/site-settings', auth, roles('Admin', 'Editor'), async (req, res) => {
  try {
    const body = { ...req.body, key: 'site' };
    delete body._id; delete body.createdAt; delete body.updatedAt;
    if (typeof body.founderImageUrl === 'string' && body.founderImageUrl.length > 1600000) return fail(res, 'Founder photo is too large after compression. Please choose a smaller image.');
    const settings = await SiteSettings.findOneAndUpdate({ key: 'site' }, body, { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }).lean();
    return ok(res, settings, 'Website settings published');
  } catch (error) {
    return fail(res, error.message, 500);
  }
});

app.get('/api/products', async (req, res) => {
  try {
    const filter = { published: true };
    if (req.query.category) filter.category = req.query.category;
    if (req.query.status) filter.status = req.query.status;
    if (req.query.featured === 'true') filter.featured = true;
    if (req.query.search) filter.$or = [
      { name: { $regex: req.query.search, $options: 'i' } },
      { tagline: { $regex: req.query.search, $options: 'i' } },
      { description: { $regex: req.query.search, $options: 'i' } }
    ];
    const limit = Math.min(Number(req.query.limit) || 12, 50);
    const page = Math.max(Number(req.query.page) || 1, 1);
    const [data, total] = await Promise.all([
      Product.find(filter).sort({ featured: -1, createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      Product.countDocuments(filter)
    ]);
    return ok(res, data, 'Products', { page, limit, total, pages: Math.ceil(total / limit) });
  } catch (error) {
    return fail(res, error.message, 500);
  }
});

app.get('/api/products/:slug', async (req, res) => {
  const product = await Product.findOne({ slug: req.params.slug, published: true }).lean();
  return product ? ok(res, product) : fail(res, 'Product not found', 404);
});

app.post('/api/products', auth, roles('Admin', 'Editor'), async (req, res) => {
  try {
    const product = await Product.create({ ...req.body, slug: slugify(req.body.slug || req.body.name) });
    return ok(res, product, 'Product created', null, 201);
  } catch (error) {
    return fail(res, error.code === 11000 ? 'A product with this slug already exists' : error.message);
  }
});

app.put('/api/products/:id', auth, roles('Admin', 'Editor'), async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    return product ? ok(res, product, 'Product updated') : fail(res, 'Product not found', 404);
  } catch (error) {
    return fail(res, error.message);
  }
});

app.delete('/api/products/:id', auth, roles('Admin'), async (req, res) => {
  const product = await Product.findByIdAndDelete(req.params.id);
  return product ? ok(res, null, 'Product deleted') : fail(res, 'Product not found', 404);
});

for (const type of ['blog', 'case-studies', 'jobs']) {
  app.get(`/api/${type}`, async (_req, res) => {
    try {
      const content = await Content.find({ type, published: true }).sort({ publishedAt: -1, createdAt: -1 }).lean();
      return ok(res, content);
    } catch (error) { return fail(res, error.message, 500); }
  });
  app.get(`/api/${type}/:slug`, async (req, res) => {
    const content = await Content.findOne({ type, slug: req.params.slug, published: true }).lean();
    return content ? ok(res, content) : fail(res, 'Content not found', 404);
  });
  app.post(`/api/${type}`, auth, roles('Admin', 'Editor'), async (req, res) => {
    try {
      const content = await Content.create({ ...req.body, type, slug: slugify(req.body.slug || req.body.title), publishedAt: req.body.publishedAt || new Date() });
      return ok(res, content, 'Created', null, 201);
    } catch (error) { return fail(res, error.message); }
  });
  app.put(`/api/${type}/:id`, auth, roles('Admin', 'Editor'), async (req, res) => {
    const content = await Content.findOneAndUpdate({ _id: req.params.id, type }, req.body, { new: true, runValidators: true });
    return content ? ok(res, content, 'Updated') : fail(res, 'Content not found', 404);
  });
  app.delete(`/api/${type}/:id`, auth, roles('Admin'), async (req, res) => {
    const content = await Content.findOneAndDelete({ _id: req.params.id, type });
    return content ? ok(res, null, 'Deleted') : fail(res, 'Content not found', 404);
  });
}

app.post('/api/contact', async (req, res) => {
  try {
    if (!req.body?.name || !emailValid(req.body?.email) || !req.body?.message) return fail(res, 'Name, valid email and message are required');
    return ok(res, await Contact.create({ ...req.body, email: String(req.body.email).toLowerCase().trim() }), 'Inquiry received', null, 201);
  } catch (error) { return fail(res, error.message); }
});
app.get('/api/contact', auth, roles('Admin'), async (_req, res) => ok(res, await Contact.find().sort({ createdAt: -1 }).lean()));
app.put('/api/contact/:id', auth, roles('Admin'), async (req, res) => {
  const contact = await Contact.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true, runValidators: true });
  return contact ? ok(res, contact, 'Updated') : fail(res, 'Inquiry not found', 404);
});
app.delete('/api/contact/:id', auth, roles('Admin'), async (req, res) => {
  const contact = await Contact.findByIdAndDelete(req.params.id);
  return contact ? ok(res, null, 'Deleted') : fail(res, 'Inquiry not found', 404);
});

app.get('/api/testimonials', async (_req, res) => ok(res, await Testimonial.find().sort({ featured: -1, createdAt: -1 }).lean()));
app.post('/api/testimonials', auth, roles('Admin', 'Editor'), async (req, res) => ok(res, await Testimonial.create(req.body), 'Created', null, 201));
app.put('/api/testimonials/:id', auth, roles('Admin', 'Editor'), async (req, res) => {
  const testimonial = await Testimonial.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  return testimonial ? ok(res, testimonial, 'Updated') : fail(res, 'Not found', 404);
});
app.delete('/api/testimonials/:id', auth, roles('Admin'), async (req, res) => {
  const testimonial = await Testimonial.findByIdAndDelete(req.params.id);
  return testimonial ? ok(res, null, 'Deleted') : fail(res, 'Not found', 404);
});

app.post('/api/newsletter', async (req, res) => {
  try {
    const email = String(req.body?.email || '').toLowerCase().trim();
    if (!emailValid(email)) return fail(res, 'Valid email required');
    await Newsletter.updateOne({ email }, { $setOnInsert: { email } }, { upsert: true });
    return ok(res, null, 'Subscribed', null, 201);
  } catch (error) { return fail(res, error.message); }
});

app.get('/api/dashboard/stats', auth, roles('Admin', 'Editor'), async (_req, res) => {
  const [products, blog, caseStudies, jobs, newContacts, customers] = await Promise.all([
    Product.countDocuments(), Content.countDocuments({ type: 'blog' }), Content.countDocuments({ type: 'case-studies' }),
    Content.countDocuments({ type: 'jobs' }), Contact.countDocuments({ status: 'New' }), User.countDocuments({ role: 'Customer' })
  ]);
  return ok(res, { products, blog, caseStudies, jobs, newContacts, customers });
});

app.get('/api/admin/users', auth, roles('Admin'), async (req, res) => {
  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.min(Number(req.query.limit) || 25, 100);
  const search = String(req.query.search || '').trim();
  const filter = search ? { $or: [{ name: { $regex: search, $options: 'i' } }, { email: { $regex: search, $options: 'i' } }] } : {};
  const [data, total] = await Promise.all([
    User.find(filter).select('-password').sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    User.countDocuments(filter)
  ]);
  return ok(res, data, 'Users', { page, limit, total, pages: Math.ceil(total / limit) });
});

app.put('/api/admin/users/:id/status', auth, roles('Admin'), async (req, res) => {
  const status = ['Active', 'Suspended'].includes(req.body.status) ? req.body.status : null;
  if (!status) return fail(res, 'Invalid status');
  const user = await User.findByIdAndUpdate(req.params.id, { status }, { new: true }).select('-password');
  return user ? ok(res, user, 'User status updated') : fail(res, 'User not found', 404);
});

const seed = async () => {
  if (!mongoose.connection.readyState) return;
  const email = (process.env.ADMIN_EMAIL || 'admin@primestack.dev').toLowerCase();
  if (!await User.exists({ email })) {
    const password = process.env.ADMIN_PASSWORD || 'ChangeMe123!';
    if (process.env.NODE_ENV === 'production' && !process.env.ADMIN_PASSWORD) throw new Error('ADMIN_PASSWORD must be configured in production');
    await User.create({ name: process.env.ADMIN_NAME || 'PrimeStack Admin', email, password: await bcrypt.hash(password, 12), role: 'Admin' });
  }
  if (!await Product.countDocuments()) {
    await Product.insertMany([
      { name: 'ProjectFlow', slug: 'projectflow', tagline: 'Project management without the overhead.', description: 'A focused workspace for planning projects, coordinating teams and keeping delivery on track.', longDescription: 'ProjectFlow brings planning, collaboration, reporting and accountability into one calm workspace.', category: 'Productivity', platforms: ['Web', 'Cloud'], technologies: ['React', 'Node.js', 'MongoDB'], status: 'Live', featured: true, features: [{ title: 'Real-time collaboration', description: 'Keep teams aligned with shared workspaces and updates.' }, { title: 'Advanced reporting', description: 'Turn delivery data into clear operational insight.' }, { title: 'Role-based permissions', description: 'Give every team member the right level of access.' }], benefits: ['Faster project delivery', 'Clearer ownership', 'Better operational visibility'] },
      { name: 'DataPulse', slug: 'datapulse', tagline: 'Business intelligence in real time.', description: 'Dashboards and analytics that turn operational data into decisions.', category: 'Analytics', platforms: ['Web', 'API'], technologies: ['React', 'Node.js', 'MongoDB'], status: 'Beta', featured: true, features: [{ title: 'Live dashboards', description: 'Monitor important metrics as they change.' }, { title: 'Flexible analytics', description: 'Build views around the questions your business asks.' }] },
      { name: 'SecureDesk', slug: 'securedesk', tagline: 'Customer support teams move faster.', description: 'Ticketing, knowledge and customer communication in one secure platform.', category: 'Security', platforms: ['Web', 'Cloud'], technologies: ['React', 'Node.js'], status: 'Coming Soon', featured: true, features: [{ title: 'Smart ticketing', description: 'Route and prioritize customer issues.' }, { title: 'Knowledge base', description: 'Help customers find answers quickly.' }] },
      { name: 'AutomateX', slug: 'automatex', tagline: 'Automate repetitive business workflows.', description: 'Connect processes, approvals and notifications without unnecessary manual work.', category: 'Automation', platforms: ['Web', 'API'], technologies: ['Node.js', 'MongoDB'], status: 'Live', featured: true, features: [{ title: 'Workflow builder', description: 'Model repeatable processes visually.' }, { title: 'API integrations', description: 'Connect your existing systems.' }] }
    ]);
  }
  if (!await SiteSettings.exists({ key: 'site' })) await SiteSettings.create(siteDefaults());
};

app.use((req, res) => fail(res, 'Route not found', 404));
app.use((error, _req, res, _next) => { console.error(error); return fail(res, error.message || 'Internal server error', error.status || 500); });

(async () => {
  try {
    if (process.env.MONGODB_URI) await mongoose.connect(process.env.MONGODB_URI);
    await seed();

app.get('/api/health', (_req, res) => {
  const connected = mongoose.connection.readyState === 1;

  return res.status(connected ? 200 : 503).json({
    success: connected,
    status: connected ? 'ok' : 'degraded',
    database: connected ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
  });
});


    app.listen(port, '0.0.0.0', () => console.log(`primeStack API listening on ${port}`));
  } catch (error) {
    console.error('Startup failed:', error);
    process.exit(1);
  }
})();

export default app;
