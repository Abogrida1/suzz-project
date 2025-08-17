import mongoose from 'mongoose';

const customerSchema = new mongoose.Schema(
	{
		phoneNumber: { type: String, unique: true, required: true, index: true },
		otpHash: { type: String },
		otpExpiresAt: { type: Date },
		discountPercent: { type: Number },
		redemptionCode: { type: String, unique: true, sparse: true },
		qrCodeData: { type: String },
		status: { type: String, enum: ['Active', 'Redeemed', 'None'], default: 'None' },
		lastOtpVerifiedAt: { type: Date },
	},
	{ timestamps: true }
);

export default mongoose.model('Customer', customerSchema);