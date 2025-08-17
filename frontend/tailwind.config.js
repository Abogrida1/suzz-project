/** @type {import('tailwindcss').Config} */ 
export default {
	content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
	theme: {
		extend: {
			colors: {
				cafe: {
					brown: '#5C3A21',
					cream: '#F5E6D3',
				}
			}
		}
	},
	plugins: []
}