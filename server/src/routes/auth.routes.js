import {Router} from 'express';import bcrypt from 'bcryptjs';import jwt from 'jsonwebtoken';import User from '../models/User.js';import {requireAuth} from '../middleware/auth.js';
const r=Router();
const cookieOptions=()=>({httpOnly:true,secure:process.env.COOKIE_SECURE==='true'||process.env.NODE_ENV==='production',sameSite:process.env.NODE_ENV==='production'?'none':'lax',maxAge:7*24*60*60*1000,path:'/'});
r.post('/login',async(req,res)=>{try{const {email,password}=req.body||{};const user=await User.findOne({email:String(email||'').toLowerCase()});if(!user||!(await bcrypt.compare(password||'',user.password)))return res.status(401).json({success:false,message:'Invalid email or password'});const token=jwt.sign({id:user._id},process.env.JWT_SECRET,{expiresIn:'7d'});res.cookie('token',token,cookieOptions()).json({success:true,data:{user:{id:user._id,name:user.name,email:user.email,role:user.role}}});}catch(e){res.status(500).json({success:false,message:'Login failed'});}});
r.post('/logout',(_req,res)=>res.clearCookie('token',cookieOptions()).json({success:true}));
r.get('/me',requireAuth,(req,res)=>res.json({success:true,data:{user:req.user}}));
export default r;
