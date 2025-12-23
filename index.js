require("dotenv").config();

const http = require('http');
const { Server } = require('socket.io');

const app = require('./src/app');
const { connectDB } = require('./src/config/db');
const Product = require('./src/models/Product');

const PORT = 8080;

// Servidor HTTP
const httpServer = http.createServer(app);

// Socket.io
const io = new Server(httpServer);

connectDB().catch((e) => console.error('Mongo connection error:', e.message));

io.on('connection', async (socket) => {
    console.log('Nuevo cliente conectado', socket.id);

    // Enviar lista inicial
    const products = await Product.find().lean();
    socket.emit('productsUpdated', products);

    // Cliente pide refrescar lista
    socket.on('getProducts', async () => {
        const products = await Product.find().lean();
        socket.emit('productsUpdated', products);
    });

    // Crear producto desde formulario websocket
    socket.on('newProduct', async (productData) => {
        try {
            // Podés parsear thumbnails si viene como string separada por comas
            if (typeof productData.thumbnails === 'string') {
                productData.thumbnails = productData.thumbnails
                    .split(',')
                    .map(t => t.trim())
                    .filter(Boolean);
            }

            await Product.create(productData);
            const products = await Product.find().lean();
            io.emit('productsUpdated', products); // avisar a todos
            socket.emit('actionOk', 'Producto creado correctamente');
        } catch (e) {
            socket.emit('actionError', e.message || 'Error al crear producto');
        }
    });

    // Borrar producto
    socket.on('deleteProduct', async (productId) => {
        try {
            await Product.findByIdAndDelete(productId);
            const products = await Product.find().lean();
            io.emit('productsUpdated', products);
            socket.emit('actionOk', 'Producto eliminado correctamente');
        } catch (e) {
            socket.emit('actionError', e.message || 'Error al eliminar producto');
        }
    });
});

httpServer.listen(PORT, () => {
    console.log(`Example app listening on port http://localhost:${PORT}`);
});
