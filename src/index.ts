import express from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import contactRouter from './routes/contact';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(helmet());


const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
});
app.use(limiter);

app.use ('/api/contact', contactRouter);


app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});