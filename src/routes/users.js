const express = require('express');
const router = express.Router();
const db = require('../db/connection');
const cache = require('../cache/redis');
const { isValidEmail } = require('../utils/validation');

const sendError = (res, error) => {
  console.error(error);
  return res.status(500).json({ error: 'Internal Server Error' });
};

router.get('/', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit, 10) || 10));
    const offset = (page - 1) * limit;

    const cacheKey = `users:all:page:${page}:limit:${limit}`;
    const cached = await cache.get(cacheKey);
    if (cached) {
      console.log('Users list cache hit');
      return res.json(JSON.parse(cached));
    }

    const totalRes = await db.query('SELECT COUNT(*)::int AS total FROM users');
    const total = totalRes.rows[0].total || 0;

    const result = await db.query('SELECT * FROM users ORDER BY id LIMIT $1 OFFSET $2', [limit, offset]);
    const payload = { data: result.rows, page, limit, total };

    await cache.set(cacheKey, JSON.stringify(payload), { EX: 120 });
    res.json(payload);
  } catch (error) {
    sendError(res, error);
  }
});

router.get('/search', async (req, res) => {
  try {
    const q = String(req.query.q || '').trim();
    if (!q) {
      return res.status(400).json({ error: 'Query parameter q is required' });
    }

    const cacheKey = `users:search:${q}`;
    const cached = await cache.get(cacheKey);
    if (cached) {
      console.log('Search cache hit');
      return res.json(JSON.parse(cached));
    }

    const tokens = q.split(/\s+/).filter(Boolean);
    const patterns = tokens.map((token) => `%${token}%`);

    const result = await db.query(
      'SELECT * FROM users WHERE name ILIKE ANY($1) OR email ILIKE ANY($1)',
      [patterns]
    );

    await cache.set(cacheKey, JSON.stringify(result.rows), { EX: 120 });
    res.json(result.rows);
  } catch (error) {
    sendError(res, error);
  }
});

router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    const cacheKey = `user:${id}`;
    const cached = await cache.get(cacheKey);
    if (cached) {
      return res.json(JSON.parse(cached));
    }

    const result = await db.query('SELECT * FROM users WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    await cache.set(cacheKey, JSON.stringify(result.rows[0]), { EX: 60 * 60 });
    res.json(result.rows[0]);
  } catch (error) {
    sendError(res, error);
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, email } = req.body;
    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required' });
    }
    if (!isValidEmail(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    const result = await db.query(
      'INSERT INTO users (name, email) VALUES ($1, $2) RETURNING *',
      [name, email]
    );

    await cache.invalidateListCache();
    await cache.invalidateSearchCache();
    res.status(201).json(result.rows[0]);
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Email already exists' });
    }
    sendError(res, error);
  }
});

router.put('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    const { name, email } = req.body;
    if (name === undefined && email === undefined) {
      return res.status(400).json({ error: 'At least one field must be provided for update' });
    }
    if (email !== undefined && !isValidEmail(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    const result = await db.query(
      'UPDATE users SET name = COALESCE($1, name), email = COALESCE($2, email) WHERE id = $3 RETURNING *',
      [name, email, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    await cache.del(`user:${id}`);
    await cache.invalidateListCache();
    await cache.invalidateSearchCache();
    res.json(result.rows[0]);
  } catch (error) {
    sendError(res, error);
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    const result = await db.query('DELETE FROM users WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    await cache.del(`user:${id}`);
    await cache.invalidateListCache();
    await cache.invalidateSearchCache();
    res.json({ message: 'User deleted successfully', user: result.rows[0] });
  } catch (error) {
    sendError(res, error);
  }
});

module.exports = router;