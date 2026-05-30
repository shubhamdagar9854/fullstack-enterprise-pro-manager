const express = require('express');
const router = express.Router();
const db = require('../db/connection');
const cache = require('../cache/redis');

router.get('/', async (req, res) => {
    const result = await db.query('SELECT * FROM users');
    res.json(result.rows);
});

router.get('/:id', async (req, res) => {
    const [ id ]= req.params;

    const cached =await cache.get(`user:${id}`);
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
});

router.post('/', async (req, res) => {
    const { name, email } = req.body;
    const result = await db.query('INSERT INTO users (name, email) VALUES ($1, $2) RETURNING *', [name, email]);
    res.json(result.rows[0]);
});

router.put('/:id', async (req, res) => {
    const [id] = req.params;
    const { name, email } = req.body;

    const result = await db.query(
        'UPDATE users SET name = COALESCE($1, name), email = COALESCE($2, email) WHERE id = $3 RETURNING *',
        [name, email, id]
    );

    if (result.rows.length === 0) {
        return res.status(404).json({ error: 'User nhi milla!!!' });
    }

    await cache.del(`user:${id}`);
    res.json(result.rows[0]);
});

router.delete('/:id', async (req, res) => {
    const [id] = req.params;

    const result = await db.query('DELETE FROM users WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
        return res.status(404).json({ error: 'User nhi milla!!!' });
    }

    await cache.del(`user:${id}`);
    res.json({ message: 'User delete ho gaya', user: result.rows[0] });
});

module.exports = router;