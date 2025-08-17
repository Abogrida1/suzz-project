import { useState } from 'react'
import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000'

export default function LandingPage() {
	const [phone, setPhone] = useState('')
	const [step, setStep] = useState('phone')
	const [otp, setOtp] = useState('')
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState('')
	const [devOtp, setDevOtp] = useState('')

	async function requestOtp(e) {
		e?.preventDefault()
		setError('')
		setLoading(true)
		setDevOtp('')
		try {
			const res = await axios.post(`${API_BASE}/api/auth/request-otp`, { phoneNumber: phone })
			if (res.data?.devOtp) setDevOtp(res.data.devOtp)
			setStep('otp')
		} catch (err) {
			setError(err?.response?.data?.error || 'Failed to request OTP')
		} finally { setLoading(false) }
	}

	async function verifyOtp(e) {
		e?.preventDefault()
		setError('')
		setLoading(true)
		try {
			await axios.post(`${API_BASE}/api/auth/verify-otp`, { phoneNumber: phone, otp })
			window.location.href = '/discount?phone=' + encodeURIComponent(phone)
		} catch (err) {
			setError(err?.response?.data?.error || 'Failed to verify OTP')
		} finally { setLoading(false) }
	}

	return (
		<div className="min-h-screen flex flex-col items-center">
			<header className="w-full p-4 flex items-center justify-center bg-cafe-cream">
				<img src="https://i.ibb.co/6JTrCJGK/IMG-5877.jpg" alt="Cafe Logo" className="h-16 rounded" />
			</header>
			<div className="w-full max-w-4xl p-4">
				<div className="rounded-xl overflow-hidden shadow">
					<img src="https://i.ibb.co/MDHwvrfG/IMG-5849.jpg" alt="Cafe" className="w-full h-64 object-cover" />
				</div>
				<div className="mt-8 bg-white/70 backdrop-blur rounded-xl p-6 shadow">
					<h1 className="text-2xl font-semibold text-cafe-brown">Get your cafe discount</h1>
					<p className="text-gray-600">Enter your phone number to receive a one-time password.</p>
					{step === 'phone' && (
						<form onSubmit={requestOtp} className="mt-4 flex gap-2">
							<input value={phone} onChange={e=>setPhone(e.target.value)} placeholder="e.g. 01012345678 or +201012345678" className="flex-1 border rounded px-3 py-2" />
							<button disabled={loading} className="bg-cafe-brown text-white px-4 py-2 rounded">{loading? 'Sending...' : 'Send OTP'}</button>
						</form>
					)}
					{step === 'otp' && (
						<form onSubmit={verifyOtp} className="mt-4 flex gap-2 items-center">
							<input value={otp} onChange={e=>setOtp(e.target.value)} placeholder="Enter OTP" className="flex-1 border rounded px-3 py-2" />
							<button disabled={loading} className="bg-cafe-brown text-white px-4 py-2 rounded">{loading? 'Verifying...' : 'Verify OTP'}</button>
							<button type="button" onClick={()=>setStep('phone')} className="px-4 py-2 border rounded">Back</button>
							{devOtp && <span className="text-xs text-gray-500 ml-2">Dev OTP: {devOtp}</span>}
						</form>
					)}
					{error && <p className="text-red-600 mt-2">{error}</p>}
				</div>
			</div>
			<footer className="mt-auto p-4 text-sm text-gray-600">© {new Date().getFullYear()} Cafe</footer>
		</div>
	)
}