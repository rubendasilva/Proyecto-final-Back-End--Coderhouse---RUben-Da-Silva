const { Router } = require('express');
const path = require('path');
const CartManager = require('../managers/CartManager');

const router = Router();
const manager = new CartManager(path.join(__dirname, '..', 'data', 'carts.json'));

// POST /api/carts/ → crea carrito
router.post('/', async (req, res) => {
    try {
        const cart = await manager.createCart();
        res.status(201).json(cart);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// GET /api/carts/:cid → lista productos del carrito
router.get('/:cid', async (req, res) => {
    try {
        const cart = await manager.getById(req.params.cid);
        if (!cart) return res.status(404).json({ error: 'Carrito no encontrado' });
        res.json(cart.products);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// POST /api/carts/:cid/product/:pid → agrega producto al carrito
router.post('/:cid/product/:pid', async (req, res) => {
    try {
        const qty = Number(req.body?.quantity) || 1;
        const cart = await manager.addProduct(req.params.cid, req.params.pid, qty);
        res.status(201).json(cart);
    } catch (e) {
        res.status(e.statusCode || 500).json({ error: e.message });
    }
});

module.exports = router;
