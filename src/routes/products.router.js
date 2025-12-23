const { Router } = require('express');
const Product = require('../models/Product');

const router = Router();

// GET /api/products?limit=&page=&sort=asc|desc&query=
router.get('/', async (req, res) => {
    try {
        const limit = Math.max(1, Number(req.query.limit) || 10);
        const page = Math.max(1, Number(req.query.page) || 1);
        const sort = req.query.sort === 'asc' ? 1 : req.query.sort === 'desc' ? -1 : null;

        let filter = {};
        const q = (req.query.query || '').trim();
        if (q) {
            try {
                // allow query as JSON string: {"category":"food"} or {"status":true}
                const obj = JSON.parse(q);
                if (obj && typeof obj === 'object') filter = obj;
            } catch {
                // allow simple: "true/false" => status, otherwise => category
                if (q.toLowerCase() === 'true' || q.toLowerCase() === 'false') {
                    filter = { status: q.toLowerCase() === 'true' };
                } else {
                    filter = { category: q };
                }
            }
        }

        const totalDocs = await Product.countDocuments(filter);
        const totalPages = Math.max(1, Math.ceil(totalDocs / limit));
        const safePage = Math.min(page, totalPages);

        const cursor = Product.find(filter)
            .skip((safePage - 1) * limit)
            .limit(limit);

        if (sort) cursor.sort({ price: sort });

        const payload = await cursor.lean();

        const hasPrevPage = safePage > 1;
        const hasNextPage = safePage < totalPages;
        const prevPage = hasPrevPage ? safePage - 1 : null;
        const nextPage = hasNextPage ? safePage + 1 : null;

        const base = `${req.protocol}://${req.get('host')}${req.baseUrl}`;
        const qp = (p) => {
            const u = new URL(base, `${req.protocol}://${req.get('host')}`);
            u.pathname = req.baseUrl;
            if (req.query.limit) u.searchParams.set('limit', String(limit));
            u.searchParams.set('page', String(p));
            if (req.query.sort) u.searchParams.set('sort', String(req.query.sort));
            if (req.query.query) u.searchParams.set('query', String(req.query.query));
            return u.pathname + u.search;
        };

        res.json({
            status: 'success',
            payload,
            totalPages,
            prevPage,
            nextPage,
            page: safePage,
            hasPrevPage,
            hasNextPage,
            prevLink: hasPrevPage ? qp(prevPage) : null,
            nextLink: hasNextPage ? qp(nextPage) : null,
        });
    } catch (e) {
        res.status(500).json({ status: 'error', error: e.message });
    }
});

// GET /api/products/:pid → producto por id
router.get('/:pid', async (req, res) => {
    try {
        const prod = await Product.findById(req.params.pid).lean();
        if (!prod) return res.status(404).json({ error: 'Producto no encontrado' });
        res.json(prod);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// POST /api/products/ → agrega producto (id se autogenera)
router.post('/', async (req, res) => {
    try {
        const created = await Product.create(req.body);
        res.status(201).json(created);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// PUT /api/products/:pid → actualiza (no se actualiza id)
router.put('/:pid', async (req, res) => {
    try {
        const { _id, id, ...rest } = req.body || {};
        const updated = await Product.findByIdAndUpdate(req.params.pid, rest, { new: true }).lean();
        if (!updated) return res.status(404).json({ error: 'Producto no encontrado' });
        res.json(updated);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// DELETE /api/products/:pid → elimina
router.delete('/:pid', async (req, res) => {
    try {
        const r = await Product.findByIdAndDelete(req.params.pid);
        if (!r) return res.status(404).json({ error: 'Producto no encontrado' });
        res.json({ status: 'ok' });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

module.exports = router;
