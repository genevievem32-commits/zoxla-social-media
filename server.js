const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/zoxla', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log(err));

// Routes
app.use('/api/posts', require('./routes/posts'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/comments', require('./routes/comments'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/live', require('./routes/livestream'));
app.use('/api/merch', require('./routes/merch'));
app.use('/api/stories', require('./routes/stories'));

// Socket.io for live streaming and real-time features
let activeStreams = {};
let activeUsers = {};

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  activeUsers[socket.id] = { id: socket.id, connectedAt: new Date() };

  // Live stream events
  socket.on('start_stream', (data) => {
    activeStreams[socket.id] = {
      userId: data.userId,
      username: data.username,
      title: data.title,
      description: data.description,
      startedAt: new Date(),
      viewers: [socket.id]
    };
    
    socket.broadcast.emit('stream_started', {
      streamerId: socket.id,
      stream: activeStreams[socket.id]
    });
    console.log(`Stream started by ${data.username}`);
  });

  socket.on('join_stream', (streamerId) => {
    if (activeStreams[streamerId]) {
      activeStreams[streamerId].viewers.push(socket.id);
      socket.join(`stream-${streamerId}`);
      
      // Notify streamer of new viewer
      io.to(streamerId).emit('viewer_joined', {
        viewerId: socket.id,
        totalViewers: activeStreams[streamerId].viewers.length
      });
      
      // Send stream to viewer
      socket.emit('stream_ready', {
        streamerId: streamerId,
        stream: activeStreams[streamerId]
      });
    }
  });

  socket.on('stream_data', (data) => {
    if (activeStreams[socket.id]) {
      io.to(`stream-${socket.id}`).emit('receive_stream_data', data);
    }
  });

  socket.on('stream_chat', (data) => {
    if (activeStreams[socket.id]) {
      io.to(`stream-${socket.id}`).emit('chat_message', {
        username: data.username,
        message: data.message,
        timestamp: new Date()
      });
    }
  });

  socket.on('end_stream', () => {
    if (activeStreams[socket.id]) {
      const streamData = activeStreams[socket.id];
      io.to(`stream-${socket.id}`).emit('stream_ended');
      delete activeStreams[socket.id];
      console.log('Stream ended');
    }
  });

  // Direct messaging events
  socket.on('send_message', (data) => {
    io.emit('new_message', {
      from: data.from,
      to: data.to,
      message: data.message,
      timestamp: new Date()
    });
  });

  // Notification events
  socket.on('follow_user', (data) => {
    io.emit('notification', {
      type: 'follow',
      from: data.from,
      to: data.to,
      message: `${data.fromUsername} followed you!`
    });
  });

  socket.on('like_post', (data) => {
    io.emit('notification', {
      type: 'like',
      from: data.from,
      postId: data.postId,
      message: `${data.fromUsername} liked your post!`
    });
  });

  socket.on('disconnect', () => {
    if (activeStreams[socket.id]) {
      io.to(`stream-${socket.id}`).emit('stream_ended');
      delete activeStreams[socket.id];
    }
    delete activeUsers[socket.id];
    console.log('User disconnected:', socket.id);
  });
});

// Get active streams endpoint
app.get('/api/live/active-streams', (req, res) => {
  res.json(activeStreams);
});

// Get active users count
app.get('/api/users/active', (req, res) => {
  res.json({ activeUsers: Object.keys(activeUsers).length });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
