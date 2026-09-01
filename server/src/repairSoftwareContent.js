import 'dotenv/config';
import mongoose from 'mongoose';
import Product from './models/Product.js';
import Content from './models/Content.js';
import SiteSettings from './models/SiteSettings.js';

const uri = process.env.MONGODB_URI;
if (!uri) throw new Error('MONGODB_URI is required');

const services = [
  { name: 'Custom Software Development', description: 'Business software designed around your workflows, customers and operational goals.' },
  { name: 'Web & Mobile Applications', description: 'Fast, accessible and scalable applications built for real-world users and devices.' },
  { name: 'Business Automation', description: 'Automate repetitive processes, approvals, notifications and handoffs to reduce manual work.' },
  { name: 'Data & Analytics', description: 'Turn operational data into clear dashboards, reports and decisions your team can act on.' },
  { name: 'Cloud & Infrastructure', description: 'Reliable deployment, integrations, monitoring and infrastructure designed to scale safely.' },
  { name: 'Product Support & Optimization', description: 'Ongoing maintenance, performance improvements, security updates and product evolution.' }
];

const technologies = ['React', 'Node.js', 'MongoDB', 'Cloud', 'REST APIs', 'Automation'];
const values = ['Quality', 'Transparency', 'Security', 'Reliability', 'Customer Focus'];

const staleProductSlugs = [
  'greenview-residential-estate',
  'nairobi-business-centre',
  'kijani-roads-drainage-upgrade',
  'lakeview-logistics-warehouse'
];

const staleContentSlugs = [
  'strong-project-controls-construction-delivery',
  'building-safely-without-compromising-productivity',
  'greenview-residential-estate-delivery',
  'kijani-roads-drainage-upgrade-case-study',
  'construction-project-manager',
  'site-engineer'
];

const run = async () => {
  await mongoose.connect(uri);

  await Product.deleteMany({ slug: { $in: staleProductSlugs } });
  await Content.deleteMany({ slug: { $in: staleContentSlugs } });

  await SiteSettings.findOneAndUpdate(
    { key: 'site' },
    {
      $set: {
        businessType: 'technology',
        name: 'stackTeck',
        founderCompanyName: 'stackTeck',
        'home.founderCompanyName': 'stackTeck',
        services,
        technologies,
        values,
        sections: {
          hero: true,
          stats: true,
          products: true,
          services: true,
          caseStudies: true,
          testimonials: true,
          blog: true,
          cta: true,
          newsletter: true
        },
        'pages.services.eyebrow': 'CAPABILITIES',
        'pages.services.title': 'Services',
        'pages.services.text': 'From product strategy to scalable infrastructure, we build around the way your business actually works.'
      }
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  console.log('stackTeck software content repair complete.');
  console.log(`Removed ${staleProductSlugs.length} stale construction products and ${staleContentSlugs.length} stale construction content items.`);
  console.log(`Published ${services.length} software services.`);
  await mongoose.disconnect();
};

run().catch(async error => {
  console.error(error);
  try { await mongoose.disconnect(); } finally { process.exit(1); }
});
