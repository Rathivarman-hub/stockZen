const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const productRoutes = require('./routes/productRoutes');
const authRoutes = require('./routes/authRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const statsRoutes = require('./routes/statsRoutes');
const chatbotRoutes = require('./routes/chatbotRoutes');
const { setActiveUsers, broadcastStats } = require('./controllers/statsController');
const jwt = require('jsonwebtoken');

// Store authenticated users to track unique active users
const activeUsers = new Map(); // socket.id -> userId

dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();
const server = http.createServer(app);

// Setup WebSockets
const allowedOrigins = [
  'https://stockzen-ims.vercel.app',
  'http://localhost:5173',
  'http://localhost:5174',
  process.env.CLIENT_URL
].filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 200
};

const io = new Server(server, {
  cors: corsOptions,
});

// Socket.io Middleware for Authentication
io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = decoded;
    } catch (err) {
      console.log('Socket Auth Error:', err.message);
    }
  }
  next();
});

// Middleware
app.set('trust proxy', 1);
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json());

// Pass io to request object so controllers can use it
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Routes
app.get('/', (req, res) => {
  res.send('StockZen API is running...');
});

app.use('/api/users', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/chatbot', chatbotRoutes);

// Socket.io connection
io.on('connection', (socket) => {
  if (socket.user) {
    socket.join('auth_users'); // Join room for authenticated stats updates
    activeUsers.set(socket.id, socket.user.id || socket.user._id);
    console.log(`Authenticated user connected: ${socket.user.name || socket.id}`);
  } else {
    console.log(`Anonymous user connected: ${socket.id}`);
  }

  // Update count and broadcast
  const uniqueUsersCount = new Set(activeUsers.values()).size;
  setActiveUsers(uniqueUsersCount);
  broadcastStats(io);

  socket.on('disconnect', () => {
    activeUsers.delete(socket.id);
    console.log(`User disconnected: ${socket.id}`);
    const uniqueUsersCount = new Set(activeUsers.values()).size;
    setActiveUsers(uniqueUsersCount);
    broadcastStats(io);
  });
});

const PORT = process.env.PORT || 5005;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);

  // Keep-alive ping to prevent Render free tier from sleeping (every 14 min)
  if (process.env.NODE_ENV === 'production') {
    const BACKEND_URL = process.env.RENDER_EXTERNAL_URL || `https://stockzen-ztkm.onrender.com`;
    setInterval(async () => {
      try {
        await fetch(`${BACKEND_URL}/`);
        console.log('Keep-alive ping sent');
      } catch (e) {
        console.log('Keep-alive ping failed:', e.message);
      }
    }, 14 * 60 * 1000); // 14 minutes
  }
});
