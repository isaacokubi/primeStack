import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({
  path: path.resolve(__dirname, '../.env')
});

import mongoose from 'mongoose';
import Product from './models/Product.js';

const uri = process.env.MONGODB_URI;
if (!uri) throw new Error('MONGODB_URI is required');

const contentSchema = new mongoose.Schema({
  type:{type:String,index:true}, title:{type:String,required:true}, slug:{type:String,index:true},
  description:String, content:String, category:String, industry:String, department:String,
  location:String, employmentType:String, experienceLevel:String, challenge:String, solution:String,
  technologies:[String], results:[String], metrics:[{label:String,value:String}], requirements:[String],
  responsibilities:[String], coverImage:String, author:String, published:{type:Boolean,default:true},
  publishedAt:Date, seo:Object
},{timestamps:true});
const Content = mongoose.models.Content || mongoose.model('Content', contentSchema);

// Construction content is intentionally stored separately from the software seed.
// Running this script does not delete or replace existing primeStack products/content.
const projects = [
  {name:'Greenview Residential Estate',slug:'greenview-residential-estate',tagline:'Modern homes delivered with quality and care.',description:'A multi-unit residential development delivered from site preparation through finishing and handover.',longDescription:'Greenview combines practical planning, durable materials and disciplined site management to deliver comfortable homes on schedule.',category:'Residential Construction',status:'Live',featured:true,published:true,platforms:['On-site'],technologies:['BIM','Project scheduling','Quality control'],benefits:['Quality workmanship','Controlled delivery','Clear project reporting'],features:[{title:'End-to-end delivery',description:'Coordinated construction from groundwork through finishing.'},{title:'Quality control',description:'Structured inspections and documented quality checks throughout the build.'}]},
  {name:'Nairobi Business Centre',slug:'nairobi-business-centre',tagline:'A professional commercial space built for modern business.',description:'Commercial construction project covering structural works, services coordination, finishes and external works.',longDescription:'The Nairobi Business Centre demonstrates coordinated commercial construction with strong project controls, safety management and quality assurance.',category:'Commercial Construction',status:'Completed',featured:true,published:true,platforms:['On-site'],technologies:['BIM coordination','Project controls','Safety management'],benefits:['Efficient coordination','Safety focused delivery','Reliable finishes'],features:[{title:'Commercial delivery',description:'Integrated structural, architectural and services coordination.'},{title:'Site safety',description:'Planned site controls and safety procedures for every project phase.'}]},
  {name:'Kijani Roads & Drainage Upgrade',slug:'kijani-roads-drainage-upgrade',tagline:'Infrastructure that keeps communities connected.',description:'Civil works programme covering road improvements, drainage and supporting infrastructure.',longDescription:'The Kijani upgrade improved local access and storm-water management through coordinated civil works and practical engineering solutions.',category:'Civil Works',status:'Completed',featured:true,published:true,platforms:['On-site'],technologies:['Civil engineering','Surveying','Digital project reporting'],benefits:['Improved access','Better drainage','Community impact']},
  {name:'Lakeview Logistics Warehouse',slug:'lakeview-logistics-warehouse',tagline:'Built for efficient storage and distribution.',description:'A warehouse development designed around operational flow, durability and long-term maintainability.',category:'Industrial Construction',status:'Planning',published:true,platforms:['On-site'],technologies:['BIM','Cost planning','Construction scheduling'],benefits:['Operational efficiency','Durable construction','Future-ready design']}
];

const articles = [
  {type:'blog',title:'How Strong Project Controls Improve Construction Delivery',slug:'strong-project-controls-construction-delivery',description:'Why scheduling, cost control, reporting and accountability matter on every construction project.',content:'Successful construction depends on more than good workmanship. Clear scope, realistic schedules, cost visibility, documented decisions and regular site reporting help teams identify issues early and keep delivery predictable.',category:'Project Management',author:'Construction Team',published:true,publishedAt:new Date()},
  {type:'blog',title:'Building Safely Without Compromising Productivity',slug:'building-safely-without-compromising-productivity',description:'Practical principles for creating safer construction sites while keeping work moving.',content:'Safety works best when it is integrated into planning and daily operations. Clear responsibilities, site inductions, inspections and proactive risk management protect people while improving project discipline.',category:'Health & Safety',author:'Construction Team',published:true,publishedAt:new Date()}
];

const caseStudies = [
  {type:'case-studies',title:'Greenview Residential Estate Delivery',slug:'greenview-residential-estate-delivery',description:'Delivering a multi-unit residential development with disciplined programme and quality controls.',industry:'Residential Construction',challenge:'The client needed a dependable delivery partner capable of coordinating multiple construction trades while maintaining quality and programme visibility.',solution:'We introduced structured site planning, weekly progress reporting, quality inspections and coordinated subcontractor management.',technologies:['BIM','Project scheduling','Quality control'],results:['Coordinated multi-trade delivery','Improved progress visibility','Consistent quality inspections'],metrics:[{label:'Progress reporting','value':'Weekly'},{label:'Quality inspections','value':'Every phase'},{label:'Delivery','value':'Programme controlled'}],published:true,publishedAt:new Date()},
  {type:'case-studies',title:'Kijani Roads & Drainage Upgrade',slug:'kijani-roads-drainage-upgrade-case-study',description:'Improving access and storm-water management through coordinated civil works.',industry:'Civil Engineering',challenge:'Existing roads and drainage infrastructure created access and storm-water challenges for the surrounding community.',solution:'The project combined surveying, drainage improvements, road works and structured quality checks to improve reliability and long-term performance.',technologies:['Civil engineering','Surveying','Digital reporting'],results:['Improved local access','More effective drainage','Clearer project reporting'],metrics:[{label:'Scope','value':'Roads + drainage'},{label:'Reporting','value':'Digital'},{label:'Impact','value':'Community infrastructure'}],published:true,publishedAt:new Date()}
];

const jobs = [
  {type:'jobs',title:'Construction Project Manager',slug:'construction-project-manager',description:'Lead construction programmes, coordinate teams and maintain delivery across safety, quality, cost and schedule.',department:'Project Management',location:'Nairobi, Kenya',employmentType:'Full-time',experienceLevel:'Senior',requirements:['Construction project management experience','Strong planning and reporting skills','Knowledge of health and safety requirements'],responsibilities:['Coordinate contractors and site teams','Track programme and project risks','Maintain quality and progress reporting'],published:true,publishedAt:new Date()},
  {type:'jobs',title:'Site Engineer',slug:'site-engineer',description:'Support site execution, technical coordination, measurements and quality assurance across active projects.',department:'Engineering',location:'Kenya / Project sites',employmentType:'Full-time',experienceLevel:'Mid-level',requirements:['Civil or structural engineering background','Site supervision experience','Strong documentation skills'],responsibilities:['Coordinate technical site activities','Support inspections and measurements','Maintain site records'],published:true,publishedAt:new Date()}
];

const seed = async () => {
  await mongoose.connect(uri);
  for (const item of projects) await Product.findOneAndUpdate({slug:item.slug}, {$set:item}, {upsert:true,new:true,setDefaultsOnInsert:true});
  for (const item of [...articles,...caseStudies,...jobs]) await Content.findOneAndUpdate({type:item.type,slug:item.slug}, {$set:item}, {upsert:true,new:true,setDefaultsOnInsert:true});
  console.log('Construction content seed complete: 4 projects, 2 news posts, 2 completed projects, 2 jobs.');
  await mongoose.disconnect();
};

seed().catch(async error=>{console.error(error);try{await mongoose.disconnect()}finally{process.exit(1)}});
