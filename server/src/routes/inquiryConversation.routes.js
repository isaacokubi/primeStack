import express from 'express';
import mongoose from 'mongoose';
import InquiryMessage from '../models/InquiryMessage.js';

const router = express.Router();

// Contact and User are registered by server.js. Do not compile duplicate
// schemas in this route because ESM dependencies are evaluated before
// server.js finishes registering its models.
const getContactModel = () => mongoose.model('Contact');

function requireAuth(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }

  next();
}

function isAdmin(req) {
  return ['Admin', 'Editor'].includes(req.user?.role);
}

function getUserEmail(req) {
  return String(req.user?.email || '').trim().toLowerCase();
}

function getUserId(req) {
  return req.user?.id || req.user?._id || req.user?.userId || null;
}

/*
 * GET CUSTOMER INQUIRIES
 */
router.get('/customer/inquiries', requireAuth, async (req, res) => {
  try {
    const Contact = getContactModel();
    const email = getUserEmail(req);

    const inquiries = await Contact.find({
      email
    })
      .sort({ updatedAt: -1, createdAt: -1 })
      .lean();

    const ids = inquiries.map(i => i._id);

    const unread = await InquiryMessage.aggregate([
      {
        $match: {
          inquiry: { $in: ids },
          senderType: 'admin',
          readByCustomer: false
        }
      },
      {
        $group: {
          _id: '$inquiry',
          count: { $sum: 1 }
        }
      }
    ]);

    const unreadMap = new Map(
      unread.map(item => [String(item._id), item.count])
    );

    res.json({
      success: true,
      data: inquiries.map(inquiry => ({
        ...inquiry,
        unreadCount: unreadMap.get(String(inquiry._id)) || 0
      }))
    });
  } catch (error) {
    console.error('Customer inquiries error:', error);
    res.status(500).json({
      success: false,
      message: 'Unable to load inquiries'
    });
  }
});

/*
 * GET ADMIN INQUIRIES
 */
router.get('/admin/inquiries', requireAuth, async (req, res) => {
  try {
    if (!isAdmin(req)) {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const Contact = getContactModel();
    const inquiries = await Contact.find({})
      .sort({ updatedAt: -1, createdAt: -1 })
      .lean();

    const ids = inquiries.map(i => i._id);

    const unread = await InquiryMessage.aggregate([
      {
        $match: {
          inquiry: { $in: ids },
          senderType: 'customer',
          readByAdmin: false
        }
      },
      {
        $group: {
          _id: '$inquiry',
          count: { $sum: 1 }
        }
      }
    ]);

    const unreadMap = new Map(
      unread.map(item => [String(item._id), item.count])
    );

    res.json({
      success: true,
      data: inquiries.map(inquiry => ({
        ...inquiry,
        unreadCount: unreadMap.get(String(inquiry._id)) || 0
      }))
    });
  } catch (error) {
    console.error('Admin inquiries error:', error);
    res.status(500).json({
      success: false,
      message: 'Unable to load inquiries'
    });
  }
});

/*
 * GET CONVERSATION
 */
router.get('/:id/messages', requireAuth, async (req, res) => {
  try {
    const Contact = getContactModel();
    const inquiry = await Contact.findById(req.params.id).lean();

    if (!inquiry) {
      return res.status(404).json({
        success: false,
        message: 'Inquiry not found'
      });
    }

    const customerOwnsInquiry =
      getUserEmail(req) === String(inquiry.email || '').toLowerCase();

    if (!isAdmin(req) && !customerOwnsInquiry) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this conversation'
      });
    }

    const messages = await InquiryMessage.find({
      inquiry: inquiry._id
    })
      .sort({ createdAt: 1 })
      .lean();

    if (isAdmin(req)) {
      await InquiryMessage.updateMany(
        {
          inquiry: inquiry._id,
          senderType: 'customer',
          readByAdmin: false
        },
        {
          $set: { readByAdmin: true }
        }
      );
    } else {
      await InquiryMessage.updateMany(
        {
          inquiry: inquiry._id,
          senderType: 'admin',
          readByCustomer: false
        },
        {
          $set: { readByCustomer: true }
        }
      );
    }

    res.json({
      success: true,
      data: {
        inquiry,
        messages
      }
    });
  } catch (error) {
    console.error('Conversation fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Unable to load conversation'
    });
  }
});

/*
 * SEND MESSAGE
 */
router.post('/:id/messages', requireAuth, async (req, res) => {
  try {
    const Contact = getContactModel();
    const inquiry = await Contact.findById(req.params.id);

    if (!inquiry) {
      return res.status(404).json({
        success: false,
        message: 'Inquiry not found'
      });
    }

    const message = String(req.body?.message || '').trim();

    if (!message) {
      return res.status(400).json({
        success: false,
        message: 'Message is required'
      });
    }

    if (message.length > 5000) {
      return res.status(400).json({
        success: false,
        message: 'Message cannot exceed 5000 characters'
      });
    }

    const customerOwnsInquiry =
      getUserEmail(req) === String(inquiry.email || '').toLowerCase();

    if (!isAdmin(req) && !customerOwnsInquiry) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this conversation'
      });
    }

    const senderType = isAdmin(req) ? 'admin' : 'customer';

    const senderName =
      req.user?.name ||
      (isAdmin(req) ? 'PrimeStack Admin' : inquiry.name);

    const sender = getUserId(req);

    const newMessage = await InquiryMessage.create({
      inquiry: inquiry._id,
      senderType,
      sender: sender && mongoose.Types.ObjectId.isValid(sender)
        ? sender
        : null,
      senderName,
      message,
      readByCustomer: senderType === 'customer',
      readByAdmin: senderType === 'admin'
    });

    if (senderType === 'admin' && inquiry.status === 'New') {
      inquiry.status = 'Contacted';
      await inquiry.save();
    }

    res.status(201).json({
      success: true,
      message: 'Message sent',
      data: newMessage
    });
  } catch (error) {
    console.error('Send inquiry message error:', error);
    res.status(500).json({
      success: false,
      message: 'Unable to send message'
    });
  }
});

/*
 * UNREAD TOTALS
 */
router.get('/unread/counts', requireAuth, async (req, res) => {
  try {
    const Contact = getContactModel();
    let result;

    if (isAdmin(req)) {
      result = await InquiryMessage.countDocuments({
        senderType: 'customer',
        readByAdmin: false
      });
    } else {
      const inquiries = await Contact.find({
        email: getUserEmail(req)
      }).select('_id');

      result = await InquiryMessage.countDocuments({
        inquiry: { $in: inquiries.map(i => i._id) },
        senderType: 'admin',
        readByCustomer: false
      });
    }

    res.json({
      success: true,
      data: {
        unreadCount: result
      }
    });
  } catch (error) {
    console.error('Unread count error:', error);
    res.status(500).json({
      success: false,
      message: 'Unable to load unread count'
    });
  }
});

export default router;
