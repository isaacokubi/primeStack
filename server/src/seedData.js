import 'dotenv/config';
import mongoose from 'mongoose';
import Product from './models/Product.js';
import Content from './models/Content.js';
import Testimonial from './models/Testimonial.js';
import SiteSettings from './models/SiteSettings.js';

const products = [
  { name: 'ProjectFlow', slug: 'projectflow', tagline: 'Project management without the overhead.', description: 'A focused workspace for planning projects, coordinating teams and keeping delivery on track.', longDescription: 'ProjectFlow brings planning, collaboration, reporting and accountability into one calm workspace.', category: 'Productivity', platforms: ['Web', 'Cloud'], technologies: ['React', 'Node.js', 'MongoDB'], status: 'Live', featured: true, published: true, features: [{ title: 'Real-time collaboration', description: 'Keep teams aligned with shared workspaces and updates.' }, { title: 'Advanced reporting', description: 'Turn delivery data into clear operational insight.' }, { title: 'Role-based permissions', description: 'Give every team member the right level of access.' }], benefits: ['Faster project delivery', 'Clearer ownership', 'Better operational visibility'] },
  { name: 'DataPulse', slug: 'datapulse', tagline: 'Business intelligence in real time.', description: 'Dashboards and analytics that turn operational data into decisions.', category: 'Analytics', platforms: ['Web', 'API'], technologies: ['React', 'Node.js', 'MongoDB'], status: 'Beta', featured: true, published: true, features: [{ title: 'Live dashboards', description: 'Monitor important metrics as they change.' }, { title: 'Flexible analytics', description: 'Build views around the questions your business asks.' }] },
  { name: 'SecureDesk', slug: 'securedesk', tagline: 'Customer support teams move faster.', description: 'Ticketing, knowledge and customer communication in one secure platform.', category: 'Security', platforms: ['Web', 'Cloud'], technologies: ['React', 'Node.js'], status: 'Coming Soon', featured: true, published: true, features: [{ title: 'Smart ticketing', description: 'Route and prioritize customer issues.' }, { title: 'Knowledge base', description: 'Help customers find answers quickly.' }] },
  { name: 'AutomateX', slug: 'automatex', tagline: 'Automate repetitive business workflows.', description: 'Connect processes, approvals and notifications without unnecessary manual work.', category: 'Automation', platforms: ['Web', 'API'], technologies: ['Node.js', 'MongoDB'], status: 'Live', featured: true, published: true, features: [{ title: 'Workflow builder', description: 'Model repeatable processes visually.' }, { title: 'API integrations', description: 'Connect your existing systems.' }] }
];

const content = [
  { type: 'case-studies', title: 'Project delivery transformation', slug: 'project-delivery-transformation', category: 'Operations', industry: 'Professional Services', description: 'How a growing team replaced fragmented project tracking with a single delivery workspace.', challenge: 'The team relied on spreadsheets, chat messages and disconnected status reports.', solution: 'We introduced a centralized project workflow with role-based access, live reporting and delivery dashboards.', results: ['Clear ownership across projects', 'Faster weekly reporting', 'Improved delivery visibility'], metrics: [{ label: 'Reporting time', value: '-60%' }, { label: 'Delivery visibility', value: '+80%' }], technologies: ['React', 'Node.js', 'MongoDB'], published: true, publishedAt: new Date() },
  { type: 'case-studies', title: 'From operational data to decisions', slug: 'operational-data-to-decisions', category: 'Analytics', industry: 'Technology', description: 'A real-time analytics experience that made critical business metrics easier to understand.', challenge: 'Decision makers lacked a reliable, shared view of operational performance.', solution: 'We built a responsive analytics layer with live dashboards and reusable reporting views.', results: ['Faster decision cycles', 'One source of truth', 'Better management visibility'], metrics: [{ label: 'Decision cycle', value: '-40%' }, { label: 'Data coverage', value: '+70%' }], technologies: ['React', 'Node.js', 'MongoDB'], published: true, publishedAt: new Date() },
  { type: 'blog', title: 'Building software that businesses can depend on', slug: 'building-software-businesses-can-depend-on', category: 'Engineering', description: 'The principles we use to build dependable products: clear requirements, maintainable architecture, security and measurable outcomes.', content: 'Great software is not only about features. It should be understandable, secure, observable and designed around the real work people need to accomplish.', author: 'primeStack', published: true, publishedAt: new Date() },
  { type: 'blog', title: 'Why product thinking matters in custom software', slug: 'why-product-thinking-matters', category: 'Product', description: 'Custom software works best when teams treat the solution as a product rather than a one-off project.', content: 'Product thinking keeps teams focused on users, outcomes, feedback and continuous improvement instead of simply delivering a list of requirements.', author: 'primeStack', published: true, publishedAt: new Date() }
];

const testimonials = [
  { quote: 'primeStack helped us turn a complex workflow into a system our team could actually use every day.', customerName: 'Operations Lead', position: 'Director', company: 'Growth Services', featured: true },
  { quote: 'The team combined strong engineering with a clear understanding of the business problem.', customerName: 'Technology Manager', position: 'Technology Manager', company: 'Digital Business', featured: true },
  { quote: 'We gained visibility, consistency and a much better foundation for scaling.', customerName: 'Business Owner', position: 'Founder', company: 'Growing Company', featured: true }
];

const siteDefaults = {
  services: [
    { name: 'Custom Software Development', description: 'Business software designed around your workflows.' },
    { name: 'Project Delivery', description: 'Planning, coordination and execution from idea to completion.' },
    { name: 'Product Strategy', description: 'Turn business goals into clear, practical product roadmaps.' },
    { name: 'Cloud & Infrastructure', description: 'Reliable infrastructure designed for performance and scale.' }
  ],
  technologies: ['React', 'Node.js', 'MongoDB', 'Cloud'],
  values: ['Quality', 'Transparency', 'Safety', 'Customer Focus'],
  stats: [{ value: '10+', label: 'Products' }, { value: '50K+', label: 'Users served' }, { value: '99.9%', label: 'Uptime' }, { value: '8+', label: 'Years experience' }]
};

async function run() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI must be configured');
  await mongoose.connect(uri);

  // Sync only the seeded product content. Media is owned by the CMS and
  // must never be overwritten by a deployment/restart seed operation.
  for (const product of products) {
    const { logo: seededLogo, screenshots: seededScreenshots, ...contentFields } = product;
    const setOnInsert = {};
    if (seededLogo) setOnInsert.logo = seededLogo;
    if (Array.isArray(seededScreenshots) && seededScreenshots.length) setOnInsert.screenshots = seededScreenshots;
    await Product.findOneAndUpdate(
      { slug: product.slug },
      { $set: contentFields, ...(Object.keys(setOnInsert).length ? { $setOnInsert: setOnInsert } : {}) },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
  }

  for (const item of content) {
    await Content.findOneAndUpdate({ type: item.type, slug: item.slug }, { $set: item }, { upsert: true, new: true, setDefaultsOnInsert: true });
  }

  for (const item of testimonials) {
    await Testimonial.findOneAndUpdate({ quote: item.quote, customerName: item.customerName }, { $set: item }, { upsert: true, new: true, setDefaultsOnInsert: true });
  }

  const current = await SiteSettings.findOne({ key: 'site' }).lean();
  if (!current) {
    await SiteSettings.create({ key: 'site', ...siteDefaults, founderName: 'Isaac Ogubi', founderCompanyName: 'primeStack' });
  } else {
    const update = {};
    if (!Array.isArray(current.services) || current.services.length === 0) update.services = siteDefaults.services;
    if (!Array.isArray(current.technologies) || current.technologies.length === 0) update.technologies = siteDefaults.technologies;
    if (!Array.isArray(current.values) || current.values.length === 0) update.values = siteDefaults.values;
    if (!Array.isArray(current.stats) || current.stats.length === 0) update.stats = siteDefaults.stats;
    if (!current.founderName) update.founderName = 'Isaac Ogubi';
    if (!current.founderCompanyName) update.founderCompanyName = 'primeStack';
    if (Object.keys(update).length) await SiteSettings.updateOne({ key: 'site' }, { $set: update });
  }

  const counts = {
    products: await Product.countDocuments({ published: true }),
    caseStudies: await Content.countDocuments({ type: 'case-studies', published: true }),
    blog: await Content.countDocuments({ type: 'blog', published: true }),
    testimonials: await Testimonial.countDocuments({ featured: true })
  };
  console.log('primeStack seed sync complete:', counts);
  await mongoose.disconnect();
}

run().catch(async error => {
  console.error('primeStack seed sync failed:', error);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
