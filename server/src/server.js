import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import mongoose from 'mongoose';
import authRoutes from './routes/auth.routes.js';
import productRoutes from './routes/product.routes.js';
import blogRoutes from './routes/blog.routes.js';
import caseStudyRoutes from './routes/caseStudy.routes.js';
import jobRoutes from './routes/job.routes.js';
import contactRoutes from './routes/contact.routes.js';
import testimonialRoutes from './routes/testimonial.routes.js';

const app = express();
const port = Number(process.env.PORT || 5000);
const allowed = (process.env.CLIENT_URL || 'http://localhost:5173').split(',').map(v => v.trim()).filter(Boolean);

app.use(helmet());
app.use(cors({ origin: (origin, cb) => !origin || allowed.includes(origin) ? cb(null, true) : cb(new Error('CORS origin denied')), credentials: true }));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));
app.use(cookieParser());
app.use(rateLimit({ windowMs: 15 * 60 * 1000, limit: 300, standardHeaders: true, legacyHeaders: false }));

app.get('/', (_req, res) => res.json({ success: true, message: 'primeStack API running' }));
app.get('/health', (_req, res) => res.json({ success: true, status: 'OK', database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' }));
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/blog', blogRoutes);
app.use('/api/case-studies', caseStudyRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/testimonials', testimonialRoutes);

app.use((req, res) => res.status(404).json({ success: false, message: 'Route not found' }));
app.use((err, _req, res, _next) => { console.error(err); res.status(err.status || 500).json({ success: false, message: err.message || 'Internal server error' }); });

const start = async () => {
  try {
    if (process.env.MONGODB_URI) await mongoose.connect(process.env.MONGODB_URI);
    app.listen(port, () => console.log(`primeStack API listening on ${port}`));
  } catch (error) { console.error('Startup failed:', error); process.exit(1); }
};
start();
export default app;
