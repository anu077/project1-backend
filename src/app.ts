import express, { Application, Request, Response } from 'express';
import path from 'path';
import * as dotenv from 'dotenv';
import './database/connection';
import userRoute from './routes/userRoute';
import productRoute from './routes/productRoute';
import categoryRoute from './routes/categoryRoute';
import cartRoute from './routes/cartRoute';
import orderRoute from './routes/orderRoute';
import adminSeeder from './adminSeeder';
import categoryController from './controllers/categoryController';
import cors from 'cors';
import { Server } from 'socket.io';
import { promisify } from 'util';
import jwt from 'jsonwebtoken';
import User from './database/models/User';
import bodyParser from 'body-parser';

dotenv.config({ path: path.resolve(__dirname, '../.env') });
const app: Application = express();
const PORT: number = 3000;

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  // Add more origins as needed
];

// Middleware
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      return callback(new Error('Not allowed by CORS'), false);
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
app.use(express.json());
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));
app.use('/Uploads', express.static(path.join(__dirname, '../Uploads'))); // Serve uploaded files

// Admin seeder
adminSeeder();

// Routes
app.use('', userRoute);
app.use('/admin/product', productRoute);
app.use('/admin/category', categoryRoute);
app.use('/customer/cart', cartRoute);
app.use('/customer/order', orderRoute);

// Global error handler
app.use((err: any, req: Request, res: Response, next: Function) => {
  console.error('Global error:', err);
  res.status(500).json({
    message: 'Server error',
    error: err.message,
  });
});

const server = app.listen(PORT, () => {
  categoryController.seedCategory();
  console.log('Server has started at port', PORT);
});

const io = new Server(server, {
  cors: {
    origin: ['http://localhost:5173'],
  },
});

let onlineUsers: any = [];
const addToOnlineUsers = (socketId: string, userId: string, role: string) => {
  onlineUsers = onlineUsers.filter((user: any) => user.userId !== userId);
  onlineUsers.push({ socketId, userId, role });
};

io.on('connection', async (socket) => {
  console.log('A client connected');
  const { token } = socket.handshake.auth;
  if (token) {
    try {
      // @ts-ignore
      const decoded = await promisify(jwt.verify)(token, process.env.SECRET_KEY);
      // @ts-ignore
      const doesUserExists = await User.findByPk(decoded.id);
      if (doesUserExists) {
        addToOnlineUsers(socket.id, doesUserExists.id, doesUserExists.role);
      }
    } catch (error) {
      console.error('Socket authentication error:', error);
    }
  }
  socket.on('updatedOrderStatus', ({ status, orderId, userId }) => {
    const findUser = onlineUsers.find((user: any) => user.userId == userId);
    if (findUser) {
      io.to(findUser.socketId).emit('statusUpdated', { status, orderId });
    }
  });
  console.log('Online users:', onlineUsers);
});