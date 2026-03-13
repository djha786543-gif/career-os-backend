import express from 'express';
const router = express.Router();
const alerts: any[] = [];
router.post('/', (req, res) => {
  const { candidate, region, track, filters, email } = req.body;
  alerts.push({ candidate, region, track, filters, email });
  res.json({ status: 'alert registered' });
});
router.get('/check', (_req, res) => { res.json(alerts); });
export default router;
