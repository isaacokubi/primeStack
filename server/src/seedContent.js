import 'dotenv/config';
import mongoose from 'mongoose';
import Product from './models/Product.js';
import { BlogPost, CaseStudy, Job, Testimonial } from './models/Content.js';

const uri = process.env.MONGODB_URI;
if (!uri) throw new Error('MONGODB_URI is required');

const products = [
  { name:'AutomateX', slug:'automatex', tagline:'Automate repetitive business workflows.', description:'Automate approvals, notifications, handoffs and recurring business processes from one reliable workspace.', longDescription:'AutomateX helps teams replace repetitive manual work with dependable workflows, clear ownership and measurable automation.', category:'Automation', status:'Live', featured:true, published:true, platforms:['Web','Cloud'], technologies:['React','Node.js','MongoDB'], benefits:['Reduce manual work','Standardize processes','Track every workflow'] },
  { name:'DataPulse', slug:'datapulse', tagline:'Business intelligence in real time.', description:'Turn operational data into dashboards, trends and decisions your team can act on.', longDescription:'DataPulse connects business information into focused dashboards so leaders can monitor performance without spreadsheet overhead.', category:'Analytics', status:'Beta', featured:true, published:true, platforms:['Web','Cloud'], technologies:['React','Node.js','MongoDB'], benefits:['Faster reporting','Real-time visibility','Better decisions'] },
  { name:'SecureDesk', slug:'securedesk', tagline:'Customer support teams move faster.', description:'A secure workspace for managing customer conversations, tickets and service operations.', category:'Security', status:'Coming Soon', published:true, platforms:['Web'], technologies:['React','Node.js'], benefits:['Centralized support','Faster resolution','Secure access'] },
  { name:'ProjectFlow', slug:'projectflow', tagline:'Project management without the overhead.', description:'Plan work, coordinate teams and keep delivery visible from kickoff to completion.', category:'Productivity', status:'Live', featured:true, published:true, platforms:['Web','Cloud'], technologies:['React','Node.js','MongoDB'], benefits:['Clear ownership','Delivery visibility','Team collaboration'] }
];

const blogs = [
  { title:'Building Software That Creates Measurable Business Value', slug:'building-software-measurable-business-value', description:'A practical look at turning complex business problems into dependable digital products.', content:'Great software starts with a real business problem. We combine product discovery, engineering discipline and continuous measurement to create systems that deliver lasting value.', category:'Product Engineering', author:'primeStack Engineering', published:true, publishedAt:new Date() },
  { title:'Designing for Scale From the First Release', slug:'designing-for-scale-from-the-first-release', description:'The architecture and product decisions that help growing software stay dependable.', content:'Scale is more than infrastructure. Strong domain boundaries, observable services, secure authentication and thoughtful user experience give products room to grow without unnecessary complexity.', category:'Technology', author:'primeStack Engineering', published:true, publishedAt:new Date() }
];

const cases = [
  { title:'Modernizing Operations With Workflow Automation', slug:'modernizing-operations-with-workflow-automation', customer:'Regional Services Group', industry:'Professional Services', challenge:'Manual approvals and fragmented spreadsheets slowed daily operations.', solution:'primeStack designed a centralized workflow platform with automated approvals, notifications and operational dashboards.', technologies:['React','Node.js','MongoDB'], results:'Faster processing, clearer ownership and improved operational visibility.', metrics:[{label:'Processing time',value:'-45%'},{label:'Manual steps',value:'-60%'},{label:'Visibility',value:'+80%'}], published:true },
  { title:'Turning Operational Data Into Decisions', slug:'turning-operational-data-into-decisions', customer:'Growth Commerce Co.', industry:'Commerce', challenge:'Leadership relied on delayed reports assembled from multiple systems.', solution:'We built a unified analytics experience with live KPIs, role-based dashboards and actionable reporting.', technologies:['React','Node.js','MongoDB'], results:'Teams gained a single source of truth for operational performance.', metrics:[{label:'Reporting cycle',value:'Days → Minutes'},{label:'Data sources',value:'6 unified'},{label:'Adoption',value:'90%'}], published:true }
];

const jobs = [
  { title:'Senior Full-Stack Engineer', slug:'senior-full-stack-engineer', department:'Engineering', location:'Nairobi, Kenya / Remote', employmentType:'Full-time', experienceLevel:'Senior', description:'Build dependable product experiences across React, Node.js and MongoDB while shaping engineering standards.', requirements:['Strong JavaScript and TypeScript fundamentals','Production React and Node.js experience','Experience designing REST APIs and data models'], responsibilities:['Build and review product features','Improve reliability and performance','Collaborate with product and design'], published:true, closed:false },
  { title:'Product Designer', slug:'product-designer', department:'Product', location:'Nairobi, Kenya / Remote', employmentType:'Full-time', experienceLevel:'Mid-level', description:'Design clear, useful experiences for complex business workflows and customer-facing products.', requirements:['Strong product design portfolio','Experience with Figma and design systems','Ability to simplify complex workflows'], responsibilities:['Create user flows and prototypes','Maintain design consistency','Work closely with engineering and product'], published:true, closed:false }
];

const testimonials = [
  { quote:'primeStack turned a complicated operational process into a product our team could actually use every day.', customerName:'Amina Hassan', position:'Operations Director', company:'Regional Services Group', featured:true },
  { quote:'The team combines strong engineering with a clear understanding of the business outcome we needed.', customerName:'Daniel Mwangi', position:'Managing Director', company:'Growth Commerce Co.', featured:true }
];

const seed = async () => {
  await mongoose.connect(uri);
  for (const item of products) await Product.findOneAndUpdate({slug:item.slug}, {$set:item}, {upsert:true, new:true, setDefaultsOnInsert:true});
  for (const item of blogs) await BlogPost.findOneAndUpdate({slug:item.slug}, {$set:item}, {upsert:true, new:true, setDefaultsOnInsert:true});
  for (const item of cases) await CaseStudy.findOneAndUpdate({slug:item.slug}, {$set:item}, {upsert:true, new:true, setDefaultsOnInsert:true});
  for (const item of jobs) await Job.findOneAndUpdate({slug:item.slug}, {$set:item}, {upsert:true, new:true, setDefaultsOnInsert:true});
  for (const item of testimonials) await Testimonial.findOneAndUpdate({quote:item.quote}, {$set:item}, {upsert:true, new:true, setDefaultsOnInsert:true});
  console.log('primeStack content seed complete: 4 products, 2 blog posts, 2 case studies, 2 jobs, 2 testimonials.');
  await mongoose.disconnect();
};

seed().catch(async error => { console.error(error); try { await mongoose.disconnect(); } finally { process.exit(1); } });
