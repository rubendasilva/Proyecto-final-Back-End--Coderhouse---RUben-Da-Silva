const { Router } = require('express');
const Product = require('../models/Product');
const Cart = require('../models/Cart');

const router = Router();

// HOME
router.get('/', async (req, res) => {
  try {
    const products = await Product.find().limit(50).lean();
    res.render('home', { products });
  } catch {
    res.status(500).send('Error cargando productos');
  }
});

// /products with pagination (Entrega Final)
router.get('/products', async (req, res) => {
  try {
    const limit = Math.max(1, Number(req.query.limit) || 10);
    const page = Math.max(1, Number(req.query.page) || 1);
    const sort = req.query.sort === 'asc' ? 1 : req.query.sort === 'desc' ? -1 : null;

    let filter = {};
    const q = (req.query.query || '').trim();
    if (q) {
      try {
        const obj = JSON.parse(q);
        if (obj && typeof obj === 'object') filter = obj;
      } catch {
        if (q.toLowerCase() === 'true' || q.toLowerCase() === 'false') filter = { status: q.toLowerCase() === 'true' };
        else filter = { category: q };
      }
    }

    const totalDocs = await Product.countDocuments(filter);
    const totalPages = Math.max(1, Math.ceil(totalDocs / limit));
    const safePage = Math.min(page, totalPages);

    const cursor = Product.find(filter)
      .skip((safePage - 1) * limit)
      .limit(limit);
    if (sort) cursor.sort({ price: sort });

    const products = await cursor.lean();
    const hasPrevPage = safePage > 1;
    const hasNextPage = safePage < totalPages;

    const makeLink = (p) => {
      const params = new URLSearchParams();
      params.set('page', String(p));
      if (req.query.limit) params.set('limit', String(limit));
      if (req.query.sort) params.set('sort', String(req.query.sort));
      if (req.query.query) params.set('query', String(req.query.query));
      return `/products?${params.toString()}`;
    };

    res.render('products', {
      products,
      page: safePage,
      totalPages,
      hasPrevPage,
      hasNextPage,
      prevLink: hasPrevPage ? makeLink(safePage - 1) : null,
      nextLink: hasNextPage ? makeLink(safePage + 1) : null,
    });
  } catch {
    res.status(500).send('Error cargando productos');
  }
});

// /products/:pid product detail
router.get('/products/:pid', async (req, res) => {
  try {
    const product = await Product.findById(req.params.pid).lean();
    if (!product) return res.status(404).send('Producto no encontrado');
    res.render('productDetail', { product });
  } catch {
    res.status(500).send('Error cargando producto');
  }
});

// /carts/:cid cart view (populate)
router.get('/carts/:cid', async (req, res) => {
  try {
    const cart = await Cart.findById(req.params.cid).populate('products.product').lean();
    if (!cart) return res.status(404).send('Carrito no encontrado');
    res.render('cart', { cartId: req.params.cid, products: cart.products });
  } catch {
    res.status(500).send('Error cargando carrito');
  }
});

// realtime products view
router.get('/realtimeproducts', async (req, res) => {
  try {
    const products = await Product.find().lean();
    res.render('realTimeProducts', { products });
  } catch {
    res.status(500).send('Error cargando productos');
  }
});

module.exports = router;
