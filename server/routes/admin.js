const express = require('express');
const { body, validationResult } = require('express-validator');
const Product = require('../models/Product');
const User = require('../models/User');
const PaymentConfig = require('../models/PaymentConfig');
const { auth, adminAuth } = require('../middleware/auth');

const router = express.Router();

// Apply auth middleware to all admin routes
router.use(auth);
router.use(adminAuth);

// Dashboard stats
router.get('/stats', async (req, res) => {
  try {
    const totalProducts = await Product.countDocuments({ isActive: true });
    const totalUsers = await User.countDocuments({ role: 'user', isActive: true });
    const featuredProducts = await Product.countDocuments({ isFeatured: true, isActive: true });
    const productsByCategory = await Product.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);

    res.json({
      totalProducts,
      totalUsers,
      featuredProducts,
      productsByCategory
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    res.status(500).json({ message: 'Server error while fetching stats' });
  }
});

// Product Management
router.get('/products', async (req, res) => {
  try {
    const { page = 1, limit = 10, category, search } = req.query;
    
    const filter = {};
    if (category) filter.category = category;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const products = await Product.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Product.countDocuments(filter);

    res.json({
      products,
      pagination: {
        currentPage: Number(page),
        totalPages: Math.ceil(total / limit),
        totalProducts: total
      }
    });
  } catch (error) {
    console.error('Admin get products error:', error);
    res.status(500).json({ message: 'Server error while fetching products' });
  }
});

router.post('/products', [
  body('name').notEmpty().withMessage('Product name is required'),
  body('description').notEmpty().withMessage('Description is required'),
  body('shortDescription').notEmpty().withMessage('Short description is required'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('category').isIn(['cricket', 'football', 'basketball', 'badminton', 'esports', 'biker', 'marathon'])
    .withMessage('Invalid category'),
  body('images').isArray({ min: 1 }).withMessage('At least one image is required'),
  body('availableSizes').isArray().withMessage('Available sizes must be an array'),
  body('availableColors').isArray().withMessage('Available colors must be an array')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }

    const productData = req.body;
    const product = new Product(productData);
    
    await product.save();

    res.status(201).json({ 
      message: 'Product created successfully',
      product 
    });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ message: 'Server error while creating product' });
  }
});

router.put('/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const product = await Product.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json({ 
      message: 'Product updated successfully',
      product 
    });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ message: 'Server error while updating product' });
  }
});

router.delete('/products/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findByIdAndDelete(id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ message: 'Server error while deleting product' });
  }
});

// User Management
router.get('/users', async (req, res) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    
    const filter = {};
    if (search) {
      filter.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await User.countDocuments(filter);

    res.json({
      users,
      pagination: {
        currentPage: Number(page),
        totalPages: Math.ceil(total / limit),
        totalUsers: total
      }
    });
  } catch (error) {
    console.error('Admin get users error:', error);
    res.status(500).json({ message: 'Server error while fetching users' });
  }
});

router.put('/users/:id/toggle-status', async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.isActive = !user.isActive;
    await user.save();

    res.json({ 
      message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`,
      user: { ...user.toObject(), password: undefined }
    });
  } catch (error) {
    console.error('Toggle user status error:', error);
    res.status(500).json({ message: 'Server error while updating user status' });
  }
});

// Payment Configuration
router.get('/payment-config', async (req, res) => {
  try {
    const configs = await PaymentConfig.find().sort({ createdAt: -1 });
    res.json({ configs });
  } catch (error) {
    console.error('Get payment config error:', error);
    res.status(500).json({ message: 'Server error while fetching payment config' });
  }
});

router.post('/payment-config', async (req, res) => {
  try {
    const { provider, config } = req.body;

    // Deactivate existing configs of the same provider
    await PaymentConfig.updateMany({ provider }, { isActive: false });

    const paymentConfig = new PaymentConfig({
      provider,
      config,
      isActive: true
    });

    await paymentConfig.save();

    res.status(201).json({ 
      message: 'Payment configuration saved successfully',
      config: paymentConfig 
    });
  } catch (error) {
    console.error('Save payment config error:', error);
    res.status(500).json({ message: 'Server error while saving payment config' });
  }
});

router.put('/payment-config/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const config = await PaymentConfig.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!config) {
      return res.status(404).json({ message: 'Payment configuration not found' });
    }

    res.json({ 
      message: 'Payment configuration updated successfully',
      config 
    });
  } catch (error) {
    console.error('Update payment config error:', error);
    res.status(500).json({ message: 'Server error while updating payment config' });
  }
});

module.exports = router;