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

dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();
const server = http.createServer(app);

// Setup WebSockets
const allowedOrigins = [
  process.env.CLIENT_URL,
  process.env.VITE_API_URL,
  'http://localhost:5173',
  'http://localhost:5174',
].filter(Boolean);

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
  },
});

// Middleware
app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  optionsSuccessStatus: 200
}));
app.use(express.json());

// Pass io to request object so controllers can use it
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Routes
app.use('/api/users', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/chatbot', chatbotRoutes);

// Socket.io connection
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Track active users and broadcast
  setActiveUsers(io.engine.clientsCount);
  broadcastStats(io);

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
    setActiveUsers(io.engine.clientsCount);
    broadcastStats(io);
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
