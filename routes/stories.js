const express = require('express');
const router = express.Router();
const Story = require('../models/Story');

// Get all active stories
router.get('/', async (req, res) => {
  try {
    const stories = await Story.find({ expiresAt: { $gt: new Date() } })
      .populate('author', 'username profilePicture')
      .sort({ createdAt: -1 });
    
    res.json(stories);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get stories from specific user
router.get('/user/:userId', async (req, res) => {
  try {
    const stories = await Story.find({ 
      author: req.params.userId,
      expiresAt: { $gt: new Date() }
    }).sort({ createdAt: -1 });
    
    res.json(stories);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create story
router.post('/', async (req, res) => {
  const { authorId, authorName, authorPicture, mediaUrl, mediaType, caption } = req.body;

  const story = new Story({
    author: authorId,
    authorName,
    authorPicture,
    mediaUrl,
    mediaType,
    caption
  });

  try {
    const newStory = await story.save();
    res.status(201).json(newStory);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// View story
router.post('/:id/view', async (req, res) => {
  try {
    const story = await Story.findById(req.params.id);
    if (!story) return res.status(404).json({ message: 'Story not found' });

    if (!story.viewedBy.includes(req.body.userId)) {
      story.viewedBy.push(req.body.userId);
      await story.save();
    }

    res.json(story);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Like story
router.post('/:id/like', async (req, res) => {
  try {
    const story = await Story.findById(req.params.id);
    if (!story) return res.status(404).json({ message: 'Story not found' });

    if (!story.likes.includes(req.body.userId)) {
      story.likes.push(req.body.userId);
      await story.save();
    }

    res.json(story);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Unlike story
router.post('/:id/unlike', async (req, res) => {
  try {
    const story = await Story.findById(req.params.id);
    if (!story) return res.status(404).json({ message: 'Story not found' });

    story.likes = story.likes.filter(id => id.toString() !== req.body.userId);
    await story.save();

    res.json(story);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete story
router.delete('/:id', async (req, res) => {
  try {
    const story = await Story.findById(req.params.id);
    if (!story) return res.status(404).json({ message: 'Story not found' });

    await Story.findByIdAndDelete(req.params.id);
    res.json({ message: 'Story deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
