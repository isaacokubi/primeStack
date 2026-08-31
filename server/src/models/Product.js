import mongoose from 'mongoose';
const schema = new mongoose.Schema({
 name:{type:String,required:true,trim:true}, slug:{type:String,required:true,unique:true,index:true}, tagline:String, description:String, longDescription:String,
 category:{type:String,index:true}, logo:String, screenshots:[String], features:[{title:String,description:String,icon:String}], benefits:[String], useCases:[String], pricing:[{name:String,price:String,description:String,features:[String]}], faq:[{question:String,answer:String}], platforms:[String], technologies:[String], status:{type:String,enum:['Live','Beta','Coming Soon','Archived'],default:'Coming Soon'}, websiteUrl:String, documentationUrl:String, releaseDate:Date, featured:{type:Boolean,default:false}, published:{type:Boolean,default:true}, seo:{title:String,description:String,keywords:[String],ogImage:String}
},{timestamps:true});
export default mongoose.model('Product',schema);
