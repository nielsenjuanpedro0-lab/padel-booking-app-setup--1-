const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://padel_db_2i7o_user:vJEOhJnK8jrRaU7Rg28ujCTkoXu9gWiD@dpg-d6aglq9r0fns73f6f5i0-a.oregon-postgres.render.com/padel_db_2i7o',
  ssl: { rejectUnauthorized: false }
});

async function setup() {
  const client = await pool.connect();
  try {
    await client.query(`CREATE TABLE IF NOT EXISTS users (id SERIAL PRIMARY KEY, name TEXT NOT NULL, email TEXT UNIQUE NOT NULL, password TEXT NOT NULL, role TEXT DEFAULT 'user')`);
    await client.query(`CREATE TABLE IF NOT EXISTS courts (id SERIAL PRIMARY KEY, name TEXT NOT NULL, address TEXT NOT NULL, city TEXT NOT NULL, price INTEGER NOT NULL)`);
    await client.query(`CREATE TABLE IF NOT EXISTS bookings (id SERIAL PRIMARY KEY, court_id INTEGER NOT NULL REFERENCES courts(id), user_id INTEGER NOT NULL REFERENCES users(id), date TEXT NOT NULL, time TEXT NOT NULL, status TEXT DEFAULT 'confirmed', created_at BIGINT)`);
    await client.query(`INSERT INTO courts (name, address, city, price) VALUES ('Necochea Padel Club', 'Calle 64 3450', 'Necochea', 9000) ON CONFLICT DO NOTHING`);
    await client.query(`INSERT INTO courts (name, address, city, price) VALUES ('Punto de Oro', 'Av. 59 1200', 'Necochea', 9000) ON CONFLICT DO NOTHING`);
    await client.query(`INSERT INTO courts (name, address, city, price) VALUES ('Master Padel', 'Calle 83 220', 'Necochea', 9000) ON CONFLICT DO NOTHING`);
    console.log('Base de datos lista!');
  } catch(e) {
    console.error(e);
  } finally {
    client.release();
    process.exit();
  }
}

setup();
