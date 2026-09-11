const express = require('express');
const router = express.Router();
const Livestream = require('../models/Livestream');

// Get all active livestreams
router.get('/active', async (req, res) => {
  try {
    const streams = await Livestream.find({ isActive: true })
      .populate('streamer', 'username profilePicture')
      .sort({ startedAt: -1 });
    res.json(streams);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create new livestream
router.post('/start', async (req, res) => {
  const { streamerId, streamerName, title, description } = req.body;

  const stream = new Livestream({
    streamer: streamerId,
    streamerName,
    title,
    description
  });

  try {
    const newStream = await stream.save();
    res.status(201).json(newStream);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// End livestream
router.post('/:id/end', async (req, res) => {
  try {
    const stream = await Livestream.findById(req.params.id);
    if (!stream) return res.status(404).json({ message: 'Stream not found' });
    
    stream.isActive = false;
    stream.endedAt = new Date();
    await stream.save();
    
    res.json(stream);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get stream details
router.get('/:id', async (req, res) => {
  try {
    const stream = await Livestream.findById(req.params.id)
      .populate('streamer', 'username profilePicture')
      .populate('viewers', 'username profilePicture');
    if (!stream) return res.status(404).json({ message: 'Stream not found' });
    res.json(stream);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get past streams
router.get('/history/all', async (req, res) => {
  try {
    const streams = await Livestream.find({ isActive: false })
      .populate('streamer', 'username profilePicture')
      .sort({ endedAt: -1 })
      .limit(20);
    res.json(streams);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
