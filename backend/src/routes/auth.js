import express from 'express';
import crypto from 'crypto';
import Customer from '../models/Customer.js';
import { normalizePhone } from '../utils/phone.js';
import { sendOtpWhatsApp } from '../services/ultraMessage.js';

const router = express.Router();

function hash(value) {
	return crypto.createHash('sha256').update(value).digest('hex');
}

router.post('/request-otp', async (req, res) => {
	try {
		const { phoneNumber } = req.body;
		const normalized = normalizePhone(phoneNumber);
		if (!normalized) return res.status(400).json({ error: 'Invalid phone number' });

		const otp = String(Math.floor(100000 + Math.random() * 900000));
		const otpHash = hash(otp);
		const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000);

		let customer = await Customer.findOne({ phoneNumber: normalized });
		if (!customer) {
			customer = await Customer.create({ phoneNumber: normalized, otpHash, otpExpiresAt, status: 'None' });
		} else {
			customer.otpHash = otpHash;
			customer.otpExpiresAt = otpExpiresAt;
			await customer.save();
		}

		await sendOtpWhatsApp(normalized, otp);
		const isDevSim = !process.env.ULTRA_INSTANCE_ID || !process.env.ULTRA_TOKEN;
		res.json({ success: true, devOtp: isDevSim ? otp : undefined });
	} catch (err) {
		console.error(err);
		res.status(500).json({ error: 'Failed to request OTP' });
	}
});

router.post('/verify-otp', async (req, res) => {
	try {
		const { phoneNumber, otp } = req.body;
		const normalized = normalizePhone(phoneNumber);
		if (!normalized) return res.status(400).json({ error: 'Invalid phone number' });

		const customer = await Customer.findOne({ phoneNumber: normalized });
		if (!customer || !customer.otpHash || !customer.otpExpiresAt) {
			return res.status(400).json({ error: 'OTP not requested' });
		}
		if (customer.otpExpiresAt.getTime() < Date.now()) {
			return res.status(400).json({ error: 'OTP expired' });
		}
		if (hash(String(otp)) !== customer.otpHash) {
			return res.status(400).json({ error: 'Invalid OTP' });
		}
		customer.otpHash = undefined;
		customer.otpExpiresAt = undefined;
		customer.lastOtpVerifiedAt = new Date();
		await customer.save();
		res.json({ success: true });
	} catch (err) {
		console.error(err);
		res.status(500).json({ error: 'Failed to verify OTP' });
	}
});

export default router;