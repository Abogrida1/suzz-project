import React from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import './index.css'
import LandingPage from './pages/LandingPage.jsx'
import DiscountPage from './pages/DiscountPage.jsx'
import AdminLogin from './pages/AdminLogin.jsx'
import AdminDashboard from './pages/AdminDashboard.jsx'

const router = createBrowserRouter([
	{ path: '/', element: <LandingPage /> },
	{ path: '/discount', element: <DiscountPage /> },
	{ path: '/admin', element: <AdminLogin /> },
	{ path: '/admin/dashboard', element: <AdminDashboard /> },
])

ReactDOM.createRoot(document.getElementById('root')).render(
	<React.StrictMode>
		<RouterProvider router={router} />
	</React.StrictMode>
)