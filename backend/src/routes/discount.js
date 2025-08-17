import express from 'express';
import QRCode from 'qrcode';
import crypto from 'crypto';
import Customer from '../models/Customer.js';
import { normalizePhone } from '../utils/phone.js';

const router = express.Router();

function generateDiscount() {
	const min = 20;
	const max = 40;
	const options = [];
	for (let p = min; p <= max; p += 5) options.push(p);
	return options[Math.floor(Math.random() * options.length)];
}

function generateRedemptionCode() {
	return crypto.randomBytes(4).toString('hex').toUpperCase();
}

router.post('/get-or-create', async (req, res) => {
	try {
		const { phoneNumber } = req.body;
		const normalized = normalizePhone(phoneNumber);
		if (!normalized) return res.status(400).json({ error: 'Invalid phone number' });

		let customer = await Customer.findOne({ phoneNumber: normalized });
		if (!customer || !customer.lastOtpVerifiedAt) {
			return res.status(401).json({ error: 'OTP verification required' });
		}

		if (customer.status === 'Redeemed') {
			return res.json({ status: 'Redeemed', message: 'You have already used your discount.' });
		}

		if (customer.status === 'Active' && customer.discountPercent && customer.redemptionCode && customer.qrCodeData) {
			return res.json({ status: 'Active', discountPercent: customer.discountPercent, redemptionCode: customer.redemptionCode, qr: customer.qrCodeData });
		}

		const discountPercent = generateDiscount();
		let redemptionCode = generateRedemptionCode();
		// Ensure uniqueness for redemption code
		while (await Customer.findOne({ redemptionCode })) {
			redemptionCode = generateRedemptionCode();
		}
		const qrPayload = JSON.stringify({ phoneNumber: normalized, redemptionCode });
		const qr = await QRCode.toDataURL(qrPayload);

		customer.discountPercent = discountPercent;
		customer.redemptionCode = redemptionCode;
		customer.qrCodeData = qr;
		customer.status = 'Active';
		await customer.save();

		res.json({ status: 'Active', discountPercent, redemptionCode, qr });
	} catch (err) {
		console.error(err);
		res.status(500).json({ error: 'Failed to get or create discount' });
	}
});

router.post('/me', async (req, res) => {
	try {
		const { phoneNumber } = req.body;
		const normalized = normalizePhone(phoneNumber);
		if (!normalized) return res.status(400).json({ error: 'Invalid phone number' });
		const customer = await Customer.findOne({ phoneNumber: normalized });
		if (!customer) return res.json({ status: 'None' });
		if (customer.status === 'Redeemed') return res.json({ status: 'Redeemed', message: 'You have already used your discount.' });
		if (customer.status === 'Active') return res.json({ status: 'Active', discountPercent: customer.discountPercent, redemptionCode: customer.redemptionCode, qr: customer.qrCodeData });
		return res.json({ status: 'None' });
	} catch (err) {
		console.error(err);
		res.status(500).json({ error: 'Failed to check discount' });
	}
});

export default router;