import pg from 'pg'
import dotenv from 'dotenv'
import path from 'path'

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env') })

const { Client } = pg
const connectionString = process.env.DATABASE_URL

console.log('Testing Direct PostgreSQL Connection...')

if (!connectionString) {
  console.error('Missing DATABASE_URL')
  process.exit(1)
}

const client = new Client({
  connectionString,
})

async function testDirectConnection() {
  try {
    await client.connect()
    console.log('Connected to PostgreSQL!')
    
    const res = await client.query('SELECT NOW() as current_time')
    console.log('Query successful. Server time:', res.rows[0].current_time)
    
    await client.end()
  } catch (err) {
    console.error('Connection error:', err)
  }
}

testDirectConnection()
