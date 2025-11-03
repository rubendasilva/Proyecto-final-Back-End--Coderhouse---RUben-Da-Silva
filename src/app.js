const express = require('express');
const productsRouter = require('./routes/products.router');
const cartsRouter = require('./routes/carts.router');

const app = express();

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rutas
app.use('/api/products', productsRouter);
app.use('/api/carts', cartsRouter);

// Root opcional
app.get('/', (req, res) => {
    res.send('Hello World!');
});

// 404
app.use((req, res) => {
    res.status(404).json({ error: 'Not found' });
});

module.exports = app;
