import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { MercadoPagoConfig, Preference } from 'mercadopago';
import db, { initDB } from './db.js';
import { authenticateToken, isAdmin, JWT_SECRET } from './authMiddleware.js';

const app = express();
const PORT = 3000;

// Mercado Pago Configuration
const client = new MercadoPagoConfig({ accessToken: 'TEST-7613207919246181-061321-f3b7625123985721869871-123456789' });

app.use(cors());
app.use(express.json());

// Initialize Database
initDB().then(() => {
  console.log('Database initialized');
}).catch(err => {
  console.error('Failed to initialize database:', err);
});

// Auth Routes
app.post('/api/auth/register', async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const hashedPassword = bcrypt.hashSync(password, 10);
    const result = await db.query(
      'INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id, role',
      [name, email, hashedPassword, 'user']
    );
    const userId = result.rows[0].id;
    const userRole = result.rows[0].role;
    
    const token = jwt.sign({ id: userId, email, role: userRole }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ token, user: { id: userId, name, email, role: userRole } });
  } catch (err) {
    if (err.message.includes('unique constraint') || err.code === '23505') {
      res.status(400).json({ error: 'Email already exists' });
    } else {
      console.error(err);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];

    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Courts Routes
app.get('/api/courts', async (req, res) => {
  const { city } = req.query;
  let query = 'SELECT * FROM courts';
  const params = [];
  
  if (city) {
    query += ' WHERE city = $1';
    params.push(city);
  }
  
  try {
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch courts' });
  }
});

app.get('/api/courts/:id', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM courts WHERE id = $1', [req.params.id]);
    const court = result.rows[0];
    if (!court) return res.status(404).json({ error: 'Court not found' });
    res.json(court);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Bookings Routes
app.get('/api/bookings', async (req, res) => {
  const { court_id, date } = req.query;
  if (!court_id || !date) {
    return res.status(400).json({ error: 'court_id and date required' });
  }
  
  try {
    // Clean up expired pending bookings
    const expirationTime = Date.now() - 30 * 60 * 1000;
    await db.query('DELETE FROM bookings WHERE status = $1 AND created_at < $2', ['pending', expirationTime]);
    
    const result = await db.query('SELECT time FROM bookings WHERE court_id = $1 AND date = $2', [court_id, date]);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/my-bookings', authenticateToken, async (req, res) => {
  try {
    const expirationTime = Date.now() - 30 * 60 * 1000;
    await db.query('DELETE FROM bookings WHERE status = $1 AND created_at < $2', ['pending', expirationTime]);

    const result = await db.query(`
      SELECT b.id, b.date, b.time, b.status, b.created_at, c.name as "courtName", c.address, c.price 
      FROM bookings b
      JOIN courts c ON b.court_id = c.id
      WHERE b.user_id = $1
      ORDER BY b.date DESC, b.time ASC
    `, [req.user.id]);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/bookings', authenticateToken, async (req, res) => {
  const { court_id, date, time } = req.body;
  
  try {
    const expirationTime = Date.now() - 30 * 60 * 1000;
    await db.query('DELETE FROM bookings WHERE status = $1 AND created_at < $2', ['pending', expirationTime]);

    // Check availability
    const result = await db.query('SELECT * FROM bookings WHERE court_id = $1 AND date = $2 AND time = $3', [court_id, date, time]);
    const existing = result.rows[0];
    
    if (existing) {
      if (existing.user_id === req.user.id && existing.status === 'pending') {
         return res.json({ success: true, bookingId: existing.id });
      }
      return res.status(400).json({ error: 'El turno ya está reservado o en proceso de pago.' });
    }

    const createdAt = Date.now();
    const insertResult = await db.query(
      'INSERT INTO bookings (court_id, user_id, date, time, status, created_at) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
      [court_id, req.user.id, date, time, 'pending', createdAt]
    );
    res.json({ success: true, bookingId: insertResult.rows[0].id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to book' });
  }
});

app.put('/api/bookings/:id/confirm', authenticateToken, async (req, res) => {
  const { id } = req.params;
  
  try {
    const result = await db.query('SELECT * FROM bookings WHERE id = $1 AND user_id = $2', [id, req.user.id]);
    const booking = result.rows[0];
    
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    
    if (booking.status === 'confirmed') {
       return res.json({ success: true, message: 'Already confirmed' });
    }

    await db.query('UPDATE bookings SET status = $1 WHERE id = $2', ['confirmed', id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to confirm booking' });
  }
});

// Admin Routes
app.get('/api/admin/bookings', authenticateToken, isAdmin, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT b.id, b.date, b.time, b.status, b.created_at, 
             c.name as "courtName", u.name as "userName", u.email as "userEmail"
      FROM bookings b
      JOIN courts c ON b.court_id = c.id
      JOIN users u ON b.user_id = u.id
      ORDER BY b.date DESC, b.time ASC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/admin/bookings/:id/cancel', authenticateToken, isAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('DELETE FROM bookings WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to cancel booking' });
  }
});

app.put('/api/admin/bookings/:id/confirm', authenticateToken, isAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('UPDATE bookings SET status = $1 WHERE id = $2', ['confirmed', id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to confirm booking' });
  }
});

// Mercado Pago Payment
app.post('/api/create-preference', authenticateToken, async (req, res) => {
  const { bookingId } = req.body;

  try {
    const result = await db.query(`
      SELECT b.id, b.date, b.time, c.name as "courtName", c.address 
      FROM bookings b 
      JOIN courts c ON b.court_id = c.id 
      WHERE b.id = $1 AND b.user_id = $2
    `, [bookingId, req.user.id]);
    
    const booking = result.rows[0];

    if (!booking) {
      return res.status(404).json({ error: 'Reserva no encontrada' });
    }

    const preference = new Preference(client);
    const prefResult = await preference.create({
      body: {
        items: [
          {
            id: `booking-${booking.id}`,
            title: `Reserva Padel - ${booking.courtName} (${booking.date} ${booking.time})`,
            quantity: 1,
            unit_price: 2500, // Service Fee
            currency_id: 'ARS',
          },
        ],
        back_urls: {
          success: 'http://localhost:5173/my-bookings?status=success',
          failure: 'http://localhost:5173/my-bookings?status=failure',
          pending: 'http://localhost:5173/my-bookings?status=pending',
        },
        auto_return: 'approved',
        notification_url: 'https://webhook.site/YOUR-WEBHOOK-URL',
        metadata: {
          booking_id: booking.id,
          user_id: req.user.id
        }
      }
    });

    res.json({ init_point: prefResult.init_point });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al crear preferencia de pago' });
  }
});

// Webhook to receive payment notification
app.post('/api/webhook', async (req, res) => {
  const payment = req.query;
  try {
    if (payment.type === 'payment') {
      console.log('Webhook received:', payment);
    }
    res.sendStatus(200);
  } catch (error) {
    console.error(error);
    res.sendStatus(500);
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
