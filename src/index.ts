import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import cors from 'cors';
import jobsRouter from '../jobs';
import adzunaFetcher from '../adzunaFetcher';

dotenv.config();
const app = express();
const PORT = Number(process.env.PORT) || 8080;

app.use(cors({
	origin: 'https://djha786543-gif.github.io',
	credentials: true
}));
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// 1. Health Check
app.get('/health', (req, res) => {
	res.status(200).json({ status: 'ok' });
});

// 2. Real Home Page
app.get('/', (req, res) => {
	res.send('<h1>Career OS API</h1><p>Backend is Live and Running</p>');
});

// 3. Re-linking your actual features
app.use('/api/jobs', jobsRouter);
app.use('/api/adzuna', adzunaFetcher);

app.listen(PORT, '0.0.0.0', () => {
	console.log('✅ Career-OS backend running on port ' + PORT);
});
