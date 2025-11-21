const { Router } = require('express');
const path = require('path');
const ProductManager = require('../managers/ProductManager');

const router = Router();

const manager = new ProductManager(
    path.join(__dirname, '..', 'data', 'products.json')
);

// Vista HOME: Lista de productos
router.get('/', async (req, res) => {
    try {
        const products = await manager.getAll();
        res.render('home', { products });
    } catch (e) {
        res.status(500).send('Error cargando productos');
    }
});

// Vista realtimeproducts: Lista de productos con WebSockets
router.get('/realtimeproducts', async (req, res) => {
    try {
        const products = await manager.getAll();
        res.render('realTimeProducts', { products });
    } catch (e) {
        res.status(500).send('Error cargando productos');
    }
});

module.exports = router;
