const fs = require('fs').promises;
const path = require('path');

class CartManager {
    constructor(filePath) {
        this.filePath = path.resolve(filePath);
    }

    async #ensureFile() {
        try {
            await fs.access(this.filePath);
        } catch {
            await fs.mkdir(path.dirname(this.filePath), { recursive: true });
            await fs.writeFile(this.filePath, '[]', 'utf8');
        }
    }

    async #readAll() {
        await this.#ensureFile();
        const raw = await fs.readFile(this.filePath, 'utf8');
        try {
            const data = JSON.parse(raw);
            return Array.isArray(data) ? data : [];
        } catch {
            await fs.writeFile(this.filePath, '[]', 'utf8');
            return [];
        }
    }

    async #writeAll(list) {
        await fs.writeFile(this.filePath, JSON.stringify(list, null, 2), 'utf8');
    }

    #nextId(list) {
        const ids = list.map(c => Number(c.id)).filter(n => !Number.isNaN(n));
        const next = ids.length ? Math.max(...ids) + 1 : 1;
        return String(next);
    }

    async createCart() {
        const all = await this.#readAll();
        const cart = { id: this.#nextId(all), products: [] };
        all.push(cart);
        await this.#writeAll(all);
        return cart;
    }

    async getById(cid) {
        const all = await this.#readAll();
        return all.find(c => String(c.id) === String(cid)) || null;
    }

    async addProduct(cid, pid, quantity = 1) {
        const all = await this.#readAll();
        const idx = all.findIndex(c => String(c.id) === String(cid));
        if (idx === -1) {
            const err = new Error('Carrito no encontrado');
            err.statusCode = 404;
            throw err;
        }

        const cart = all[idx];
        const item = cart.products.find(p => String(p.product) === String(pid));
        if (item) {
            item.quantity += Number(quantity) || 1;
        } else {
            cart.products.push({ product: String(pid), quantity: Number(quantity) || 1 });
        }

        all[idx] = cart;
        await this.#writeAll(all);
        return cart;
    }
}

module.exports = CartManager;
