import express from 'express';
import Customer from '../models/Customer.js';

const router = express.Router();

function checkAuth(req, res, next) {
	const header = req.headers.authorization || '';
	if (!header.startsWith('Basic ')) return res.status(401).json({ error: 'Unauthorized' });
	const base64 = header.slice(6);
	const decoded = Buffer.from(base64, 'base64').toString('utf-8');
	const [username, password] = decoded.split(':');
	if (username === process.env.ADMIN_USERNAME && password === process.env.ADMIN_PASSWORD) return next();
	return res.status(401).json({ error: 'Unauthorized' });
}

router.get('/customers', checkAuth, async (req, res) => {
	const items = await Customer.find({ status: { $in: ['Active', 'Redeemed'] } }).sort({ createdAt: -1 });
	res.json(items.map(c => ({ phoneNumber: c.phoneNumber, discountPercent: c.discountPercent, redemptionCode: c.redemptionCode, status: c.status, qr: c.qrCodeData })));
});

router.post('/redeem', checkAuth, async (req, res) => {
	try {
		const { redemptionCode } = req.body;
		if (!redemptionCode) return res.status(400).json({ error: 'Missing code' });
		const customer = await Customer.findOne({ redemptionCode: String(redemptionCode).trim().toUpperCase() });
		if (!customer) return res.status(404).json({ error: 'Code not found' });
		if (customer.status === 'Redeemed') return res.status(400).json({ error: 'Already redeemed' });
		customer.status = 'Redeemed';
		await customer.save();
		res.json({ success: true });
	} catch (err) {
		console.error(err);
		res.status(500).json({ error: 'Failed to redeem' });
	}
});

export default router;