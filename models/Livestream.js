const mongoose = require('mongoose');

const livestreamSchema = new mongoose.Schema({
  streamer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  streamerName: String,
  title: {
    type: String,
    required: true
  },
  description: String,
  startedAt: {
    type: Date,
    default: Date.now
  },
  endedAt: Date,
  viewers: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  ],
  viewCount: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  recordingUrl: String,
  thumbnail: String,
  streamUrl: String
});

module.exports = mongoose.model('Livestream', livestreamSchema);
