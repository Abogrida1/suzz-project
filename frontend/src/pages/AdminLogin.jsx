import { useState } from 'react'

export default function AdminLogin() {
	const [username, setUsername] = useState('')
	const [password, setPassword] = useState('')
	function submit(e){
		e.preventDefault()
		const token = btoa(`${username}:${password}`)
		localStorage.setItem('adminAuth', `Basic ${token}`)
		window.location.href = '/admin/dashboard'
	}
	return (
		<div className="min-h-screen flex items-center justify-center">
			<form onSubmit={submit} className="bg-white p-6 rounded-xl shadow w-full max-w-sm">
				<h2 className="text-xl font-semibold mb-4">Admin Login</h2>
				<input className="border w-full mb-2 px-3 py-2" placeholder="Username" value={username} onChange={e=>setUsername(e.target.value)} />
				<input className="border w-full mb-4 px-3 py-2" placeholder="Password" type="password" value={password} onChange={e=>setPassword(e.target.value)} />
				<button className="bg-cafe-brown text-white w-full py-2 rounded">Login</button>
			</form>
		</div>
	)
}