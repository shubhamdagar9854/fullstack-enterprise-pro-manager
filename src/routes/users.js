const express = require('express');
const router = express.Router();
const db = require('../db/connection');
const cache = require('../cache/redis');

const sendError = (res, error) => {
    console.error(error);
    return res.status(500).json({ error: 'Internal Server Error' });
};

const invalidateSearchCache = async () => {
    try {
        const keys = await cache.keys('users:search:*');
        if (keys.length > 0) {
            await cache.del(keys);
        }
    } catch (err) {
        console.error('Failed to invalidate search cache:', err);
    }
};

const invalidateListCache = async () => {
    try {
        await cache.del('users:all');
    } catch (err) {
        console.error('Failed to invalidate list cache:', err);
    }
};

router.get('/', async (req, res) => {
    try {
        const cacheKey = 'users:all';
        const cached = await cache.get(cacheKey);
        if (cached) {
            console.log('Users list cache hit');
            return res.json(JSON.parse(cached));
        }

        const result = await db.query('SELECT * FROM users');
        await cache.set(cacheKey, JSON.stringify(result.rows), { EX: 60 });
        res.json(result.rows);
    } catch (error) {
        sendError(res, error);
    }
});

router.get('/search', async (req, res) => {
    try {
        const { q } = req.query;
        if (!q) {
            return res.status(400).json({ error: 'Query parameter q is required' });
        }

        const cacheKey = `users:search:${q}`;
        const cached = await cache.get(cacheKey);
        if (cached) {
            console.log('Search cache hit');
            return res.json(JSON.parse(cached));
        }

        const likeQuery = `%${q}%`;
        const result = await db.query(
            'SELECT * FROM users WHERE name ILIKE $1 OR email ILIKE $1',
            [likeQuery]
        );

        await cache.set(cacheKey, JSON.stringify(result.rows), { EX: 60 });
        res.json(result.rows);
    } catch (error) {
        sendError(res, error);
    }
});

router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const cached = await cache.get(`user:${id}`);
        if (cached) {
            console.log('Cache se mila!!!!');
            return res.json(JSON.parse(cached));
        }
        const result = await db.query('SELECT * FROM users WHERE id = $1', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User nhi milla!!!' });
        }
        await cache.set(`user:${id}`, JSON.stringify(result.rows[0]), { EX: 60 * 60 });
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

        const result = await db.query('INSERT INTO users (name, email) VALUES ($1, $2) RETURNING *', [name, email]);
        await invalidateListCache();
        await invalidateSearchCache();
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
        const { id } = req.params;
        const { name, email } = req.body;

        if (name === undefined && email === undefined) {
            return res.status(400).json({ error: 'At least one field must be provided for update' });
        }

        const result = await db.query(
            'UPDATE users SET name = COALESCE($1, name), email = COALESCE($2, email) WHERE id = $3 RETURNING *',
            [name, email, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User nhi milla!!!' });
        }

        await cache.del(`user:${id}`);
        await invalidateListCache();
        await invalidateSearchCache();
        res.json(result.rows[0]);
    } catch (error) {
        sendError(res, error);
    }
});

router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const result = await db.query('DELETE FROM users WHERE id = $1 RETURNING *', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User nhi milla!!!' });
        }

        await cache.del(`user:${id}`);
        await invalidateListCache();
        await invalidateSearchCache();
        res.json({ message: 'User delete ho gaya', user: result.rows[0] });
    } catch (error) {
        sendError(res, error);
    }
});

module.exports = router;