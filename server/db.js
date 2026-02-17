import pg from 'pg';
import bcrypt from 'bcryptjs';

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/padel_app',
});

export const query = (text, params) => pool.query(text, params);

export const initDB = async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Create tables
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT DEFAULT 'user'
      );
    `);

    // Migration for role column
    try {
      await client.query('ALTER TABLE users ADD COLUMN role TEXT DEFAULT \'user\'');
    } catch (e) {
      // Ignore if column already exists
    }

    await client.query(`
      CREATE TABLE IF NOT EXISTS courts (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        address TEXT NOT NULL,
        city TEXT NOT NULL,
        price INTEGER NOT NULL
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS bookings (
        id SERIAL PRIMARY KEY,
        court_id INTEGER NOT NULL REFERENCES courts(id),
        user_id INTEGER NOT NULL REFERENCES users(id),
        date TEXT NOT NULL,
        time TEXT NOT NULL,
        status TEXT DEFAULT 'confirmed',
        created_at BIGINT
      );
    `);
    
    // Seed Courts
    const res = await client.query('SELECT count(*) as count FROM courts');
    const count = parseInt(res.rows[0].count);
    
    if (count === 0) {
        await client.query('INSERT INTO courts (name, address, city, price) VALUES ($1, $2, $3, $4)', ['Necochea Padel Club', 'Calle 64 3450', 'Necochea', 9000]);
        await client.query('INSERT INTO courts (name, address, city, price) VALUES ($1, $2, $3, $4)', ['Punto de Oro', 'Av. 59 1200', 'Necochea', 9000]);
        await client.query('INSERT INTO courts (name, address, city, price) VALUES ($1, $2, $3, $4)', ['Master Padel', 'Calle 83 220', 'Necochea', 9000]);
        console.log('Courts seeded');
    } else {
        // Ensure price update
         await client.query('UPDATE courts SET price = 9000');
    }

    // Seed Admin (Legacy)
    const adminRes = await client.query('SELECT * FROM users WHERE email = $1', ['admin@admin.com']);
    if (adminRes.rows.length === 0) {
        const hashedPassword = bcrypt.hashSync('admin123', 10);
        await client.query('INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4)', ['Admin', 'admin@admin.com', hashedPassword, 'admin']);
    }

    // Seed Admin (New Request)
    const adminPadelRes = await client.query('SELECT * FROM users WHERE email = $1', ['admin@padel.com']);
    if (adminPadelRes.rows.length === 0) {
        const hashedPassword = bcrypt.hashSync('admin123', 10);
        await client.query('INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4)', ['Admin Padel', 'admin@padel.com', hashedPassword, 'admin']);
        console.log('Admin user (padel) seeded');
    }

    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('Database initialization failed:', e);
  } finally {
    client.release();
  }
};

export default {
  query,
  initDB
};
