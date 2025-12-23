const { Router } = require('express');
const Cart = require('../models/Cart');
const Product = require('../models/Product');

const router = Router();

// POST /api/carts -> crea carrito
router.post('/', async (req, res) => {
  try {
    const cart = await Cart.create({ products: [] });
    res.status(201).json(cart);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/carts/:cid -> trae carrito con productos completos
router.get('/:cid', async (req, res) => {
  try {
    const cart = await Cart.findById(req.params.cid).populate('products.product').lean();
    if (!cart) return res.status(404).json({ error: 'Carrito no encontrado' });
    res.json(cart.products);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/carts/:cid/products/:pid -> agrega producto (default qty=1)
router.post('/:cid/products/:pid', async (req, res) => {
  try {
    const qty = Math.max(1, Number(req.body?.quantity) || 1);
    const prod = await Product.findById(req.params.pid).lean();
    if (!prod) return res.status(404).json({ error: 'Producto no encontrado' });

    const cart = await Cart.findById(req.params.cid);
    if (!cart) return res.status(404).json({ error: 'Carrito no encontrado' });

    const idx = cart.products.findIndex((p) => String(p.product) === String(req.params.pid));
    if (idx >= 0) cart.products[idx].quantity += qty;
    else cart.products.push({ product: req.params.pid, quantity: qty });

    await cart.save();
    res.status(201).json(cart);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// DELETE /api/carts/:cid/products/:pid -> elimina un producto del carrito
router.delete('/:cid/products/:pid', async (req, res) => {
  try {
    const cart = await Cart.findById(req.params.cid);
    if (!cart) return res.status(404).json({ error: 'Carrito no encontrado' });

    cart.products = cart.products.filter((p) => String(p.product) !== String(req.params.pid));
    await cart.save();
    res.json({ status: 'ok', cart });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// PUT /api/carts/:cid -> reemplaza todos los productos del carrito
router.put('/:cid', async (req, res) => {
  try {
    const items = Array.isArray(req.body) ? req.body : req.body?.products;
    if (!Array.isArray(items)) return res.status(400).json({ error: 'Se espera un array de productos' });

    const normalized = items
      .map((it) => ({
        product: it.product || it._id || it.pid || it.productId,
        quantity: Math.max(1, Number(it.quantity) || 1),
      }))
      .filter((it) => it.product);

    // validar existencia de productos
    const ids = [...new Set(normalized.map((i) => String(i.product)))];
    const count = await Product.countDocuments({ _id: { $in: ids } });
    if (count !== ids.length) return res.status(400).json({ error: 'Uno o más productos no existen' });

    const cart = await Cart.findByIdAndUpdate(
      req.params.cid,
      { products: normalized },
      { new: true }
    ).lean();
    if (!cart) return res.status(404).json({ error: 'Carrito no encontrado' });
    res.json(cart);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// PUT /api/carts/:cid/products/:pid -> actualiza SOLO la cantidad
router.put('/:cid/products/:pid', async (req, res) => {
  try {
    const quantity = Math.max(1, Number(req.body?.quantity));
    if (!quantity) return res.status(400).json({ error: 'quantity es requerido' });

    const cart = await Cart.findById(req.params.cid);
    if (!cart) return res.status(404).json({ error: 'Carrito no encontrado' });

    const idx = cart.products.findIndex((p) => String(p.product) === String(req.params.pid));
    if (idx < 0) return res.status(404).json({ error: 'Producto no está en el carrito' });

    cart.products[idx].quantity = quantity;
    await cart.save();
    res.json({ status: 'ok', cart });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// DELETE /api/carts/:cid -> vacía carrito
router.delete('/:cid', async (req, res) => {
  try {
    const cart = await Cart.findByIdAndUpdate(req.params.cid, { products: [] }, { new: true }).lean();
    if (!cart) return res.status(404).json({ error: 'Carrito no encontrado' });
    res.json({ status: 'ok', cart });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
