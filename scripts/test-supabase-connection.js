import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env') })

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY

console.log('Testing Supabase Connection...')
console.log('URL:', supabaseUrl)
console.log('Key:', supabaseAnonKey ? 'Found' : 'Missing')

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testConnection() {
  try {
    const { data, error } = await supabase.from('clients').select('count', { count: 'exact', head: true })
    
    if (error) {
      console.error('Connection Failed:', error.message)
      return
    }
    
    console.log('Connection Successful!')
    console.log('Clients table accessible. Row count:', data)
  } catch (error) {
    console.error('Unexpected error:', error)
  }
}

testConnection()
