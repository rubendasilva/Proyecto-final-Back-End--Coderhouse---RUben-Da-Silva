const { Router } = require('express');
const path = require('path');
const ProductManager = require('../managers/ProductManager');

const router = Router();
const manager = new ProductManager(path.join(__dirname, '..', 'data', 'products.json'));

// GET /api/products/  → lista todos
router.get('/', async (req, res) => {
    try {
        const products = await manager.getAll();
        res.json(products);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// GET /api/products/:pid → producto por id
router.get('/:pid', async (req, res) => {
    try {
        const prod = await manager.getById(req.params.pid);
        if (!prod) return res.status(404).json({ error: 'Producto no encontrado' });
        res.json(prod);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// POST /api/products/ → agrega producto (id se autogenera)
router.post('/', async (req, res) => {
    try {
        const created = await manager.add(req.body);
        res.status(201).json(created);
    } catch (e) {
        res.status(e.statusCode || 500).json({ error: e.message });
    }
});

// PUT /api/products/:pid → actualiza (no se actualiza id)
router.put('/:pid', async (req, res) => {
    try {
        const updated = await manager.update(req.params.pid, req.body);
        res.json(updated);
    } catch (e) {
        res.status(e.statusCode || 500).json({ error: e.message });
    }
});

// DELETE /api/products/:pid → elimina
router.delete('/:pid', async (req, res) => {
    try {
        await manager.delete(req.params.pid);
        res.json({ status: 'ok' });
    } catch (e) {
        res.status(e.statusCode || 500).json({ error: e.message });
    }
});

module.exports = router;
