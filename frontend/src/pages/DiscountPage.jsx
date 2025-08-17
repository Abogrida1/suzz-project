import { useEffect, useState } from 'react'
import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000'

export default function DiscountPage() {
	const [data, setData] = useState(null)
	const [error, setError] = useState('')

	useEffect(() => {
		const params = new URLSearchParams(window.location.search)
		const phone = params.get('phone')
		if (!phone) { setError('Missing phone'); return }
		(async () => {
			try {
				const res = await axios.post(`${API_BASE}/api/discount/get-or-create`, { phoneNumber: phone })
				setData(res.data)
			} catch (err) {
				setError(err?.response?.data?.error || err?.response?.data?.message || 'Failed to load discount')
			}
		})()
	}, [])

	if (error) return <div className="p-6 text-red-600">{error}</div>
	if (!data) return <div className="p-6">Loading...</div>

	if (data.status === 'Redeemed') {
		return <div className="min-h-screen flex items-center justify-center">
			<div className="bg-white rounded-xl p-8 shadow">
				<h2 className="text-xl font-semibold text-cafe-brown">You have already used your discount.</h2>
			</div>
		</div>
	}

	return (
		<div className="min-h-screen flex items-center justify-center">
			<div className="bg-white rounded-xl p-8 shadow max-w-md w-full text-center">
				<h2 className="text-3xl font-bold text-cafe-brown">{data.discountPercent}% OFF</h2>
				<p className="text-gray-600">Show this QR or code at the counter.</p>
				<img src={data.qr} alt="QR" className="mx-auto my-4 w-64 h-64" />
				<p className="text-lg">Code: <span className="font-mono text-xl">{data.redemptionCode}</span></p>
			</div>
		</div>
	)
}