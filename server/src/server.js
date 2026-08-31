import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const app=express();
const port=Number(process.env.PORT||5000);
const clientUrl=(process.env.CLIENT_URL||'http://localhost:5173').split(',').map(x=>x.trim()).filter(Boolean);
app.set('trust proxy',1);
app.use(helmet());
app.use(cors({origin:(origin,cb)=>!origin||clientUrl.includes(origin)?cb(null,true):cb(new Error('CORS origin denied')),credentials:true}));
app.use(express.json({limit:'3mb'}));app.use(express.urlencoded({extended:true,limit:'3mb'}));app.use(cookieParser());
app.use(rateLimit({windowMs:15*60*1000,limit:300,standardHeaders:true,legacyHeaders:false}));

const schemaOpts={timestamps:true};
const Product=mongoose.model('Product',new mongoose.Schema({name:{type:String,required:true,trim:true},slug:{type:String,unique:true,index:true},tagline:String,description:String,longDescription:String,category:{type:String,default:'Business'},logo:String,screenshots:[String],features:[{title:String,description:String}],benefits:[String],useCases:[String],pricing:[{name:String,price:String,description:String,features:[String]}],faq:[{question:String,answer:String}],platforms:[String],technologies:[String],status:{type:String,enum:['Live','Beta','Coming Soon','Archived'],default:'Live'},websiteUrl:String,documentationUrl:String,releaseDate:Date,featured:{type:Boolean,default:false},published:{type:Boolean,default:true},seo:{title:String,description:String,keywords:[String],ogImage:String}},schemaOpts));
const Content=mongoose.model('Content',new mongoose.Schema({type:{type:String,index:true},title:{type:String,required:true},slug:{type:String,index:true},description:String,content:String,category:String,industry:String,department:String,location:String,employmentType:String,experienceLevel:String,challenge:String,solution:String,technologies:[String],results:[String],metrics:[{label:String,value:String}],requirements:[String],responsibilities:[String],coverImage:String,author:String,published:{type:Boolean,default:true},publishedAt:Date,seo:Object},schemaOpts));
const Contact=mongoose.model('Contact',new mongoose.Schema({name:{type:String,required:true},email:{type:String,required:true},company:String,phone:String,projectType:String,budget:String,message:{type:String,required:true},status:{type:String,enum:['New','Contacted','In Progress','Converted','Closed'],default:'New'}},schemaOpts));
const Testimonial=mongoose.model('Testimonial',new mongoose.Schema({quote:{type:String,required:true},customerName:{type:String,required:true},position:String,company:String,photo:String,featured:{type:Boolean,default:false}},schemaOpts));
const User=mongoose.model('User',new mongoose.Schema({name:{type:String,required:true},email:{type:String,unique:true,lowercase:true,index:true},password:{type:String,required:true},role:{type:String,enum:['Admin','Editor'],default:'Editor'}},schemaOpts));
const Newsletter=mongoose.model('Newsletter',new mongoose.Schema({email:{type:String,unique:true,lowercase:true}},{timestamps:true}));

const slugify=s=>String(s||'').toLowerCase().trim().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'');
const ok=(res,data,message='OK',status=200)=>res.status(status).json({success:true,message,data});
const fail=(res,message,status=400)=>res.status(status).json({success:false,message});
const tokenFor=u=>jwt.sign({id:u._id.toString(),role:u.role},process.env.JWT_SECRET||'change-this-in-production',{expiresIn:'7d'});
const auth=(req,res,next)=>{try{const t=req.cookies.ps_token||String(req.headers.authorization||'').replace(/^Bearer\s+/i,'');if(!t)return fail(res,'Authentication required',401);req.user=jwt.verify(t,process.env.JWT_SECRET||'change-this-in-production');next()}catch{return fail(res,'Invalid or expired session',401)}};
const roles=(...allowed)=>(req,res,next)=>allowed.includes(req.user.role)?next():fail(res,'Insufficient permissions',403);
const publicFilter=(req)=>({published:true,...(req.query.category?{category:req.query.category}:{}),...(req.query.status?{status:req.query.status}:{})});

app.get('/',(_req,res)=>ok(res,{name:'primeStack API',version:'1.0.0'}));
app.get('/health',(_req,res)=>ok(res,{status:'OK',database:mongoose.connection.readyState===1?'connected':'disconnected'}));

app.post('/api/auth/login',async(req,res)=>{try{const {email,password}=req.body||{};const u=await User.findOne({email:String(email||'').toLowerCase()});if(!u||!await bcrypt.compare(String(password||''),u.password))return fail(res,'Invalid email or password',401);res.cookie('ps_token',tokenFor(u),{httpOnly:true,sameSite:process.env.NODE_ENV==='production'?'none':'lax',secure:process.env.COOKIE_SECURE==='true',maxAge:7*86400000});return ok(res,{user:{id:u._id,name:u.name,email:u.email,role:u.role}},'Signed in')}catch(e){return fail(res,e.message,500)}});
app.post('/api/auth/logout',(_req,res)=>{res.clearCookie('ps_token');ok(res,null,'Signed out')});
app.get('/api/auth/me',auth,async(req,res)=>{const u=await User.findById(req.user.id).select('-password');if(!u)return fail(res,'User not found',404);ok(res,{user:u})});

app.get('/api/products',async(req,res)=>{try{const q={...publicFilter(req)};if(req.query.featured==='true')q.featured=true;if(req.query.search)q.$or=[{name:{$regex:req.query.search,$options:'i'}},{tagline:{$regex:req.query.search,$options:'i'}},{description:{$regex:req.query.search,$options:'i'}}];const limit=Math.min(Number(req.query.limit)||12,50),page=Math.max(Number(req.query.page)||1,1);const [data,total]=await Promise.all([Product.find(q).sort({featured:-1,createdAt:-1}).skip((page-1)*limit).limit(limit).lean(),Product.countDocuments(q)]);ok(res,data,'Products',{page,limit,total,pages:Math.ceil(total/limit)})}catch(e){fail(res,e.message,500)}});
app.get('/api/products/:slug',async(req,res)=>{const p=await Product.findOne({slug:req.params.slug,published:true}).lean();return p?ok(res,p):fail(res,'Product not found',404)});
app.post('/api/products',auth,roles('Admin','Editor'),async(req,res)=>{try{const d={...req.body,slug:slugify(req.body.slug||req.body.name)};const p=await Product.create(d);ok(res,p,'Product created',201)}catch(e){fail(res,e.code===11000?'A product with this slug already exists':e.message)}});
app.put('/api/products/:id',auth,roles('Admin','Editor'),async(req,res)=>{try{const d={...req.body};if(d.name&&!d.slug)d.slug=slugify(d.name);const p=await Product.findByIdAndUpdate(req.params.id,d,{new:true,runValidators:true});return p?ok(res,p,'Product updated'):fail(res,'Product not found',404)}catch(e){fail(res,e.message)}});
app.delete('/api/products/:id',auth,roles('Admin'),async(req,res)=>{const p=await Product.findByIdAndDelete(req.params.id);return p?ok(res,null,'Product deleted'):fail(res,'Product not found',404)});

const contentTypes=['blog','case-studies','jobs'];
const contentRoutes=(type)=>{
 app.get(`/api/${type}`,async(req,res)=>{try{const q={type,published:true};if(req.query.search)q.$or=[{title:{$regex:req.query.search,$options:'i'}},{description:{$regex:req.query.search,$options:'i'}}];const data=await Content.find(q).sort({publishedAt:-1,createdAt:-1}).lean();ok(res,data)}catch(e){fail(res,e.message,500)}});
 app.get(`/api/${type}/:slug`,async(req,res)=>{const x=await Content.findOne({type,slug:req.params.slug,published:true}).lean();return x?ok(res,x):fail(res,'Content not found',404)});
 app.post(`/api/${type}`,auth,roles('Admin','Editor'),async(req,res)=>{try{const x=await Content.create({...req.body,type,slug:slugify(req.body.slug||req.body.title),publishedAt:req.body.publishedAt||new Date()});ok(res,x,'Created',201)}catch(e){fail(res,e.message)}});
 app.put(`/api/${type}/:id`,auth,roles('Admin','Editor'),async(req,res)=>{try{const x=await Content.findOneAndUpdate({_id:req.params.id,type},{...req.body,...(req.body.title&&!req.body.slug?{slug:slugify(req.body.title)}:{})},{new:true,runValidators:true});return x?ok(res,x,'Updated'):fail(res,'Content not found',404)}catch(e){fail(res,e.message)}});
 app.delete(`/api/${type}/:id`,auth,roles('Admin'),async(req,res)=>{const x=await Content.findOneAndDelete({_id:req.params.id,type});return x?ok(res,null,'Deleted'):fail(res,'Content not found',404)});
};contentTypes.forEach(contentRoutes);

app.post('/api/contact',async(req,res)=>{try{const {name,email,message}=req.body||{};if(!name||!email||!message)return fail(res,'Name, email and message are required');const x=await Contact.create(req.body);ok(res,x,'Inquiry received',201)}catch(e){fail(res,e.message)}});
app.get('/api/contact',auth,roles('Admin'),async(_req,res)=>ok(res,await Contact.find().sort({createdAt:-1}).lean()));
app.put('/api/contact/:id',auth,roles('Admin'),async(req,res)=>{const x=await Contact.findByIdAndUpdate(req.params.id,{status:req.body.status},{new:true});return x?ok(res,x):fail(res,'Inquiry not found',404)});
app.delete('/api/contact/:id',auth,roles('Admin'),async(req,res)=>{const x=await Contact.findByIdAndDelete(req.params.id);return x?ok(res,null,'Deleted'):fail(res,'Inquiry not found',404)});
app.get('/api/testimonials',async(_req,res)=>ok(res,await Testimonial.find().sort({featured:-1,createdAt:-1}).lean()));
app.post('/api/testimonials',auth,roles('Admin','Editor'),async(req,res)=>ok(res,await Testimonial.create(req.body),'Created',201));
app.put('/api/testimonials/:id',auth,roles('Admin','Editor'),async(req,res)=>{const x=await Testimonial.findByIdAndUpdate(req.params.id,req.body,{new:true});return x?ok(res,x,'Updated'):fail(res,'Not found',404)});
app.delete('/api/testimonials/:id',auth,roles('Admin'),async(req,res)=>{const x=await Testimonial.findByIdAndDelete(req.params.id);return x?ok(res,null,'Deleted'):fail(res,'Not found',404)});
app.post('/api/newsletter',async(req,res)=>{try{const email=String(req.body?.email||'').toLowerCase().trim();if(!/^\S+@\S+\.\S+$/.test(email))return fail(res,'Valid email required');await Newsletter.updateOne({email},{$setOnInsert:{email}},{upsert:true});ok(res,null,'Subscribed',201)}catch(e){fail(res,e.message)}});
app.get('/api/dashboard/stats',auth,roles('Admin','Editor'),async(_req,res)=>{const [products,blog,cases,jobs,contacts]=await Promise.all([Product.countDocuments(),Content.countDocuments({type:'blog'}),Content.countDocuments({type:'case-studies'}),Content.countDocuments({type:'jobs'}),Contact.countDocuments({status:'New'})]);ok(res,{products,blog,caseStudies:cases,jobs,newContacts:contacts})});

const seed=async()=>{if(!mongoose.connection.readyState)return;const adminEmail=process.env.ADMIN_EMAIL||'admin@primestack.dev';if(!await User.exists({email:adminEmail})){await User.create({name:process.env.ADMIN_NAME||'PrimeStack Admin',email:adminEmail,password:await bcrypt.hash(process.env.ADMIN_PASSWORD||'ChangeMe123!',12),role:'Admin'});console.log(`Admin seeded: ${adminEmail}`)}if(await Product.countDocuments()===0){await Product.insertMany([
{name:'ProjectFlow',slug:'projectflow',tagline:'Project management without the overhead.',description:'A focused workspace for planning projects, coordinating teams and keeping delivery on track.',longDescription:'ProjectFlow brings planning, collaboration, reporting and accountability into one calm workspace.',category:'Productivity',platforms:['Web','Cloud'],technologies:['React','Node.js','MongoDB'],status:'Live',featured:true,features:[{title:'Real-time collaboration',description:'Keep teams aligned with shared workspaces and updates.'},{title:'Advanced reporting',description:'Turn delivery data into clear operational insight.'},{title:'Role-based permissions',description:'Give every team member the right level of access.'}],benefits:['Faster project delivery','Clearer ownership','Better operational visibility']},
{name:'DataPulse',slug:'datapulse',tagline:'Business intelligence in real time.',description:'Dashboards and analytics that turn operational data into decisions.',category:'Analytics',platforms:['Web','API'],technologies:['React','Node.js','MongoDB'],status:'Beta',featured:true,features:[{title:'Live dashboards',description:'Monitor important metrics as they change.'},{title:'Flexible analytics',description:'Build views around the questions your business asks.'}]},
{name:'SecureDesk',slug:'securedesk',tagline:'Customer support teams move faster.',description:'Ticketing, knowledge and customer communication in one secure platform.',category:'Security',platforms:['Web','Cloud'],technologies:['React','Node.js'],status:'Coming Soon',featured:true,features:[{title:'Smart ticketing',description:'Route and prioritize customer issues.'},{title:'Knowledge base',description:'Help customers find answers quickly.'}]},
{name:'AutomateX',slug:'automatex',tagline:'Automate repetitive business workflows.',description:'Connect processes, approvals and notifications without unnecessary manual work.',category:'Automation',platforms:['Web','API'],technologies:['Node.js','MongoDB'],status:'Live',featured:true,features:[{title:'Workflow builder',description:'Model repeatable processes visually.'},{title:'API integrations',description:'Connect your existing systems.'}]}
]);}}

app.use((req,res)=>fail(res,'Route not found',404));app.use((err,_req,res,_next)=>{console.error(err);fail(res,err.message||'Internal server error',err.status||500)});
const start=async()=>{try{if(process.env.MONGODB_URI)await mongoose.connect(process.env.MONGODB_URI);await seed();app.listen(port,()=>console.log(`primeStack API listening on ${port}`))}catch(e){console.error('Startup failed:',e);process.exit(1)}};start();export default app;
