import express from 'express';
import mongoose from 'mongoose';
import InquiryMessage from '../models/InquiryMessage.js';
import Contact from '../models/Contact.js';

const router = express.Router();

const requireAuth = (req, res, next) => {
  if (!req.user) return res.status(401).json({ success: false, message: 'Authentication required' });
  next();
};

const isAdmin = req => ['Admin', 'Editor'].includes(String(req.user?.role || ''));
const getUserEmail = req => String(req.user?.email || '').trim().toLowerCase();
const getUserId = req => req.user?.id || req.user?._id || req.user?.userId || null;
const ownsInquiry = (req, inquiry) => getUserEmail(req) === String(inquiry?.email || '').trim().toLowerCase();

const withUnreadCount = async (inquiries, senderType, readField) => {
  if (!inquiries.length) return [];
  const unread = await InquiryMessage.aggregate([
    { $match: { inquiry: { $in: inquiries.map(item => item._id) }, senderType, [readField]: false } },
    { $group: { _id: '$inquiry', count: { $sum: 1 } } }
  ]);
  const map = new Map(unread.map(item => [String(item._id), item.count]));
  return inquiries.map(inquiry => ({ ...inquiry, unreadCount: map.get(String(inquiry._id)) || 0 }));
};

router.get('/customer/inquiries', requireAuth, async (req, res) => {
  try {
    const inquiries = await Contact.find({ email: getUserEmail(req) }).sort({ updatedAt: -1, createdAt: -1 }).lean();
    return res.json({ success: true, data: await withUnreadCount(inquiries, 'admin', 'readByCustomer') });
  } catch (error) {
    console.error('Customer inquiries error:', error);
    return res.status(500).json({ success: false, message: 'Unable to load inquiries', error: process.env.NODE_ENV === 'production' ? undefined : error.message });
  }
});

router.get('/admin/inquiries', requireAuth, async (req, res) => {
  try {
    if (!isAdmin(req)) return res.status(403).json({ success: false, message: 'Admin access required' });
    const inquiries = await Contact.find({}).sort({ updatedAt: -1, createdAt: -1 }).lean();
    return res.json({ success: true, data: await withUnreadCount(inquiries, 'customer', 'readByAdmin') });
  } catch (error) {
    console.error('Admin inquiries error:', error);
    return res.status(500).json({ success: false, message: 'Unable to load inquiries', error: process.env.NODE_ENV === 'production' ? undefined : error.message });
  }
});

router.get('/:id/messages', requireAuth, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ success: false, message: 'Invalid inquiry ID' });
    const inquiry = await Contact.findById(req.params.id).lean();
    if (!inquiry) return res.status(404).json({ success: false, message: 'Inquiry not found' });
    if (!isAdmin(req) && !ownsInquiry(req, inquiry)) return res.status(403).json({ success: false, message: 'You do not have access to this conversation' });

    const messages = await InquiryMessage.find({ inquiry: inquiry._id }).sort({ createdAt: 1 }).lean();
    await InquiryMessage.updateMany(
      { inquiry: inquiry._id, senderType: isAdmin(req) ? 'customer' : 'admin', [isAdmin(req) ? 'readByAdmin' : 'readByCustomer']: false },
      { $set: { [isAdmin(req) ? 'readByAdmin' : 'readByCustomer']: true } }
    );
    return res.json({ success: true, data: { inquiry, messages } });
  } catch (error) {
    console.error('Conversation fetch error:', error);
    return res.status(500).json({ success: false, message: 'Unable to load conversation', error: process.env.NODE_ENV === 'production' ? undefined : error.message });
  }
});

router.post('/:id/messages', requireAuth, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ success: false, message: 'Invalid inquiry ID' });
    const inquiry = await Contact.findById(req.params.id);
    if (!inquiry) return res.status(404).json({ success: false, message: 'Inquiry not found' });

    const messageText = String(req.body?.message || '').trim();
    if (!messageText) return res.status(400).json({ success: false, message: 'Message is required' });
    if (messageText.length > 5000) return res.status(400).json({ success: false, message: 'Message cannot exceed 5000 characters' });

    const adminSender = isAdmin(req);
    if (!adminSender && !ownsInquiry(req, inquiry)) return res.status(403).json({ success: false, message: 'You do not have access to this conversation' });
    if (!adminSender && inquiry.status === 'Closed') return res.status(409).json({ success: false, message: 'This conversation is closed. Please contact the primeStack team to reopen it.' });

    const senderId = getUserId(req);
    const newMessage = await InquiryMessage.create({
      inquiry: inquiry._id,
      senderType: adminSender ? 'admin' : 'customer',
      sender: senderId && mongoose.Types.ObjectId.isValid(senderId) ? senderId : null,
      senderName: req.user?.name || (adminSender ? 'PrimeStack Admin' : inquiry.name),
      message: messageText,
      readByCustomer: !adminSender,
      readByAdmin: adminSender
    });

    if (adminSender && inquiry.status === 'New') inquiry.status = 'Contacted';
    if (!adminSender && inquiry.status === 'Contacted') inquiry.status = 'In Progress';
    inquiry.updatedAt = new Date();
    await inquiry.save();

    return res.status(201).json({ success: true, message: 'Message sent', data: newMessage, inquiry: { id: inquiry._id, status: inquiry.status } });
  } catch (error) {
    console.error('Send inquiry message error:', error);
    return res.status(500).json({ success: false, message: 'Unable to send message', error: process.env.NODE_ENV === 'production' ? undefined : error.message });
  }
});

router.get('/unread/counts', requireAuth, async (req, res) => {
  try {
    if (isAdmin(req)) {
      const unreadCount = await InquiryMessage.countDocuments({ senderType: 'customer', readByAdmin: false });
      return res.json({ success: true, data: { unreadCount } });
    }
    const inquiries = await Contact.find({ email: getUserEmail(req) }).select('_id').lean();
    const unreadCount = await InquiryMessage.countDocuments({ inquiry: { $in: inquiries.map(item => item._id) }, senderType: 'admin', readByCustomer: false });
    return res.json({ success: true, data: { unreadCount } });
  } catch (error) {
    console.error('Unread count error:', error);
    return res.status(500).json({ success: false, message: 'Unable to load unread count' });
  }
});

export default router;
