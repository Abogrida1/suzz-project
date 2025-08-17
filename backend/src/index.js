import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';
import authRoutes from './routes/auth.js';
import discountRoutes from './routes/discount.js';
import adminRoutes from './routes/admin.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(express.json());
app.use(helmet());
app.use(morgan('dev'));
app.use(cors({ origin: process.env.CORS_ORIGIN?.split(',') || '*', credentials: true }));

app.get('/api/health', (req, res) => res.json({ ok: true }));

app.use('/api/auth', authRoutes);
app.use('/api/discount', discountRoutes);
app.use('/api/admin', adminRoutes);

const PORT = process.env.PORT || 4000;

async function connectMongo() {
	try {
		await mongoose.connect(process.env.MONGODB_URI, { dbName: process.env.MONGODB_DB || undefined });
		console.log('Connected to MongoDB');
		return true;
	} catch (err) {
		console.warn('MongoDB connection failed, falling back to memory server in dev:', err.message);
		if (process.env.NODE_ENV === 'production') throw err;
		const { MongoMemoryServer } = await import('mongodb-memory-server');
		const mongod = await MongoMemoryServer.create();
		const uri = mongod.getUri();
		await mongoose.connect(uri);
		console.log('Connected to in-memory MongoDB');
		return true;
	}
}

async function start() {
	try {
		await connectMongo();
		app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
	} catch (err) {
		console.error('Failed to start server', err);
		process.exit(1);
	}
}

start();