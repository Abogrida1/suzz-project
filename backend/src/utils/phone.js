import { parsePhoneNumberFromString } from 'libphonenumber-js';

export function normalizePhone(input) {
	if (!input) return null;
	let value = String(input).trim();
	// If it starts with 0 and looks Egyptian, convert to +20
	if (/^0\d{9}$/.test(value)) {
		value = '+20' + value.slice(1);
	}
	// If it starts with 01 Egyptian mobile pattern, ensure +20 prefix
	if (/^01\d{9}$/.test(value)) {
		value = '+2' + value;
	}
	const phone = parsePhoneNumberFromString(value, 'EG');
	if (!phone || !phone.isValid()) return null;
	return phone.number; // E.164 +XXXXXXXX
}