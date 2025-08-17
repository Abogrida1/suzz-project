import axios from 'axios';

const ULTRA_BASE = 'https://api.ultramsg.com';

function getConfig() {
	const { ULTRA_INSTANCE_ID, ULTRA_TOKEN, ULTRA_PHONE_SENDER } = process.env;
	if (!ULTRA_INSTANCE_ID || !ULTRA_TOKEN || !ULTRA_PHONE_SENDER) {
		console.warn('Ultra Message credentials are not fully set. OTP will be simulated.');
	}
	return { instance: ULTRA_INSTANCE_ID, token: ULTRA_TOKEN, from: ULTRA_PHONE_SENDER };
}

export async function sendOtpWhatsApp(toE164, otpCode) {
	const { instance, token, from } = getConfig();
	if (!instance || !token) {
		// Simulate in development: no external call
		console.log(`[SIMULATED OTP] ${toE164}: ${otpCode}`);
		return { simulated: true };
	}
	const url = `${ULTRA_BASE}/${instance}/messages/chat`;
	const body = new URLSearchParams();
	body.set('to', toE164.replace('+', ''));
	body.set('body', `Your Cafe OTP is ${otpCode}. It expires in 5 minutes.`);
	try {
		const resp = await axios.post(url, body, { params: { token }, headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
		return resp.data;
	} catch (err) {
		console.error('Ultra send error', err?.response?.data || err.message);
		throw new Error('Failed to send OTP');
	}
}