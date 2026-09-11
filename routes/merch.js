const express = require('express');
const router = express.Router();
const Merch = require('../models/Merch');

// Get all merch
router.get('/', async (req, res) => {
  try {
    const merch = await Merch.find().sort({ createdAt: -1 });
    res.json(merch);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get merch by category
router.get('/category/:category', async (req, res) => {
  try {
    const merch = await Merch.find({ category: req.params.category });
    res.json(merch);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create merch (admin only)
router.post('/', async (req, res) => {
  const { name, description, price, image, category, stock } = req.body;

  const merch = new Merch({
    name,
    description,
    price,
    image,
    category,
    stock
  });

  try {
    const newMerch = await merch.save();
    res.status(201).json(newMerch);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Add review to merch
router.post('/:id/review', async (req, res) => {
  try {
    const merch = await Merch.findById(req.params.id);
    if (!merch) return res.status(404).json({ message: 'Merch not found' });

    const review = {
      userId: req.body.userId,
      username: req.body.username,
      rating: req.body.rating,
      comment: req.body.comment
    };

    merch.reviews.push(review);
    
    // Calculate average rating
    const totalRating = merch.reviews.reduce((sum, r) => sum + r.rating, 0);
    merch.rating = totalRating / merch.reviews.length;

    await merch.save();
    res.status(201).json(merch);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Update stock (admin only)
router.patch('/:id/stock', async (req, res) => {
  try {
    const merch = await Merch.findById(req.params.id);
    if (!merch) return res.status(404).json({ message: 'Merch not found' });

    merch.stock = req.body.stock;
    await merch.save();
    res.json(merch);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Record purchase
router.post('/:id/purchase', async (req, res) => {
  try {
    const merch = await Merch.findById(req.params.id);
    if (!merch) return res.status(404).json({ message: 'Merch not found' });

    const quantity = req.body.quantity || 1;
    
    if (merch.stock < quantity) {
      return res.status(400).json({ message: 'Not enough stock' });
    }

    merch.stock -= quantity;
    merch.soldCount += quantity;
    await merch.save();

    res.json({ message: 'Purchase recorded', merch });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get single merch
router.get('/:id', async (req, res) => {
  try {
    const merch = await Merch.findById(req.params.id);
    if (!merch) return res.status(404).json({ message: 'Merch not found' });
    res.json(merch);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
