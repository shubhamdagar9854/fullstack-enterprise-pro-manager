const express = require('express');
const router = express.Router();
const db = require('../db/connection');
const cache = require('../cache/redis');

const sendError = (res, error) => {
    console.error(error);
    return res.status(500).json({ error: 'Internal Server Error' });
};

router.get('/', async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM users');
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
        await cache.set(`user:${id}`, JSON.stringify(result.rows[0]), 60 * 60);
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
        res.status(201).json(result.rows[0]);
    } catch (error) {
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
        res.json({ message: 'User delete ho gaya', user: result.rows[0] });
    } catch (error) {
        sendError(res, error);
    }
});

module.exports = router;