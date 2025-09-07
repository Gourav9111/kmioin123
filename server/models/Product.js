const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  shortDescription: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  salePrice: {
    type: Number,
    min: 0
  },
  category: {
    type: String,
    required: true,
    enum: ['cricket', 'football', 'basketball', 'badminton', 'esports', 'biker', 'marathon']
  },
  images: [{
    type: String,
    required: true
  }],
  availableSizes: [{
    type: String,
    enum: ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL']
  }],
  availableColors: [{
    name: String,
    hex: String
  }],
  stock: {
    type: Number,
    default: 0,
    min: 0
  },
  tags: [String],
  isActive: {
    type: Boolean,
    default: true
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  customizationOptions: {
    allowPlayerName: { type: Boolean, default: true },
    allowPlayerNumber: { type: Boolean, default: true },
    allowTeamLogo: { type: Boolean, default: true },
    allowColorChange: { type: Boolean, default: false }
  }
}, {
  timestamps: true
});

// Create text index for search functionality
productSchema.index({ 
  name: 'text', 
  description: 'text', 
  tags: 'text' 
});

module.exports = mongoose.model('Product', productSchema);