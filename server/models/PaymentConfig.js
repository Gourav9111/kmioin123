const mongoose = require('mongoose');

const paymentConfigSchema = new mongoose.Schema({
  provider: {
    type: String,
    required: true,
    enum: ['upi', 'stripe', 'razorpay', 'paypal']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  config: {
    // For UPI
    upiId: String,
    qrCodeUrl: String,
    merchantName: String,
    
    // For Stripe
    publishableKey: String,
    secretKey: String,
    
    // For Razorpay
    keyId: String,
    keySecret: String,
    
    // For PayPal
    clientId: String,
    clientSecret: String
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('PaymentConfig', paymentConfigSchema);