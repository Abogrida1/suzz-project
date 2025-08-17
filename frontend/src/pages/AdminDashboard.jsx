import { useEffect, useState } from 'react'
import axios from 'axios'
import { useZxing } from 'react-zxing'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000'

export default function AdminDashboard() {
	const [items, setItems] = useState([])
	const [error, setError] = useState('')
	const [code, setCode] = useState('')
	const [scanning, setScanning] = useState(false)
	const auth = localStorage.getItem('adminAuth') || ''

	async function load() {
		try {
			const res = await axios.get(`${API_BASE}/api/admin/customers`, { headers: { Authorization: auth } })
			setItems(res.data)
		} catch (err) { setError('Unauthorized or failed to load') }
	}
	useEffect(()=>{ load() }, [])

	async function redeem(inputCode){
		try{
			await axios.post(`${API_BASE}/api/admin/redeem`, { redemptionCode: inputCode }, { headers: { Authorization: auth } })
			await load()
			alert('Redeemed!')
		}catch(err){
			alert(err?.response?.data?.error || 'Failed to redeem')
		}
	}

	const { ref } = useZxing({
		onDecodeResult(result) {
			try {
				const text = result.getText()
				const parsed = JSON.parse(text)
				if (parsed?.redemptionCode) redeem(parsed.redemptionCode)
			} catch(e) { console.error(e) }
		},
		enabled: scanning,
	})

	return (
		<div className="p-4">
			<div className="flex items-center justify-between">
				<h2 className="text-2xl font-semibold">Admin Dashboard</h2>
				<button onClick={()=>{ localStorage.removeItem('adminAuth'); window.location.href='/admin' }} className="text-sm underline">Logout</button>
			</div>
			<div className="mt-4 bg-white p-4 rounded-xl shadow">
				<div className="flex gap-2 items-center">
					<input value={code} onChange={e=>setCode(e.target.value)} placeholder="Enter redemption code" className="border px-3 py-2 rounded" />
					<button onClick={()=> redeem(code)} className="bg-cafe-brown text-white px-4 py-2 rounded">Redeem</button>
					<button onClick={()=> setScanning(s=>!s)} className="border px-4 py-2 rounded">{scanning? 'Stop Scan' : 'Scan QR'}</button>
				</div>
				{scanning && <div className="mt-4"><video ref={ref} style={{width:'100%'}} /></div>}
			</div>

			<h3 className="mt-6 text-lg font-semibold">Customers</h3>
			<div className="mt-2 overflow-auto">
				<table className="min-w-full text-sm">
					<thead>
						<tr className="text-left border-b">
							<th className="p-2">Phone</th>
							<th className="p-2">Discount</th>
							<th className="p-2">Code</th>
							<th className="p-2">Status</th>
						</tr>
					</thead>
					<tbody>
						{items.map((i)=> (
							<tr key={i.redemptionCode} className="border-b">
								<td className="p-2 font-mono">{i.phoneNumber}</td>
								<td className="p-2">{i.discountPercent}%</td>
								<td className="p-2 font-mono">{i.redemptionCode}</td>
								<td className="p-2">{i.status}</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>

			{error && <p className="text-red-600 mt-4">{error}</p>}
		</div>
	)
}