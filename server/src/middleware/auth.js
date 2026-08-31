import jwt from 'jsonwebtoken';
import User from '../models/User.js';
export const requireAuth=async(req,res,next)=>{try{const token=req.cookies?.token||req.headers.authorization?.replace('Bearer ','');if(!token)return res.status(401).json({success:false,message:'Authentication required'});const decoded=jwt.verify(token,process.env.JWT_SECRET);req.user=await User.findById(decoded.id).select('-password');if(!req.user)return res.status(401).json({success:false,message:'User not found'});next();}catch(e){return res.status(401).json({success:false,message:'Invalid or expired session'});}};
export const requireRole=(...roles)=>(req,res,next)=>roles.includes(req.user?.role)?next():res.status(403).json({success:false,message:'Insufficient permissions'});
