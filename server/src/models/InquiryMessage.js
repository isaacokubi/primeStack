import mongoose from 'mongoose';

const inquiryMessageSchema = new mongoose.Schema(
  {
    inquiry: { type: mongoose.Schema.Types.ObjectId, ref: 'Contact', required: true, index: true },
    senderType: { type: String, enum: ['customer', 'admin'], required: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    senderName: { type: String, required: true, trim: true, maxlength: 120 },
    message: { type: String, required: true, trim: true, maxlength: 5000 },
    readByCustomer: { type: Boolean, default: false },
    readByAdmin: { type: Boolean, default: false }
  },
  { timestamps: true }
);

inquiryMessageSchema.index({ inquiry: 1, createdAt: 1 });

export default mongoose.models.InquiryMessage || mongoose.model('InquiryMessage', inquiryMessageSchema);
