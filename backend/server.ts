import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config({ path: '../.env' });

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.get('/health', (req, res) => {
  res.json({ status: 'Grandma Mode backend is alive!' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🧓 Grandma Mode backend running on port ${PORT}`);
});
