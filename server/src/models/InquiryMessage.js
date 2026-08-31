import mongoose from 'mongoose';

const inquiryMessageSchema = new mongoose.Schema(
  {
    inquiry: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Contact',
      required: true,
      index: true
    },

    senderType: {
      type: String,
      enum: ['customer', 'admin'],
      required: true,
      index: true
    },

    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },

    senderName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150
    },

    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 5000
    },

    readByCustomer: {
      type: Boolean,
      default: false,
      index: true
    },

    readByAdmin: {
      type: Boolean,
      default: false,
      index: true
    }
  },
  {
    timestamps: true
  }
);

inquiryMessageSchema.index({
  inquiry: 1,
  createdAt: 1
});

const InquiryMessage =
  mongoose.models.InquiryMessage ||
  mongoose.model('InquiryMessage', inquiryMessageSchema);

export default InquiryMessage;
