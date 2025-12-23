const express = require('express');
const path = require('path');
const { engine } = require('express-handlebars');

const { connectDB } = require('./config/db');

const productsRouter = require('./routes/products.router');
const cartsRouter = require('./routes/carts.router');
const viewsRouter = require('./routes/views.router');

const app = express();

connectDB().catch((e) => {
    console.error('Mongo connection error:', e.message);
});

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static (para JS de front, CSS, etc.)
app.use(express.static(path.join(__dirname, 'public')));

// Configuración de Handlebars
app.engine('handlebars', engine({
    defaultLayout: 'main',
    layoutsDir: path.join(__dirname, 'views', 'layouts')
}));
app.set('view engine', 'handlebars');
app.set('views', path.join(__dirname, 'views'));

// Rutas
app.use('/api/products', productsRouter);
app.use('/api/carts', cartsRouter);

// Rutas de vistas
app.use('/', viewsRouter);

// Root opcional
app.get('/', (req, res) => {
    res.send('Hello World!');
});

// 404
app.use((req, res) => {
    res.status(404).json({ error: 'Not found' });
});

module.exports = app;
