import 'dotenv/config'

const requiredKeys = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY']
const missing = requiredKeys.filter((key) => !process.env[key])

if (missing.length > 0) {
	console.error(
		`Missing required environment variables: ${missing.join(
			', ',
		)}\nPlease create or update .env.local and then restart the dev server.`,
	)
	process.exit(1)
}

console.log('Environment OK ✓')


