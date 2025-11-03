const fs = require('fs').promises;
const path = require('path');

class ProductManager {
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

    // Helpers
    #nextId(list) {
        // Autogenera para evitar repetidos: max+1 como string
        const ids = list.map(p => Number(p.id)).filter(n => !Number.isNaN(n));
        const next = ids.length ? Math.max(...ids) + 1 : 1;
        return String(next);
    }

    // CRUD
    async getAll() {
        return await this.#readAll();
    }

    async getById(pid) {
        const all = await this.#readAll();
        return all.find(p => String(p.id) === String(pid)) || null;
    }

    async add(product) {
        const required = ['title', 'description', 'code', 'price', 'status', 'stock', 'category'];
        for (const k of required) {
            if (product[k] === undefined) {
                const err = new Error(`Falta el campo requerido: ${k}`);
                err.statusCode = 400;
                throw err;
            }
        }

        const all = await this.#readAll();

        // Validar code único (opcional pero útil)
        if (all.some(p => p.code === product.code)) {
            const err = new Error('El code del producto ya existe');
            err.statusCode = 400;
            throw err;
        }

        const toSave = {
            id: this.#nextId(all),
            title: String(product.title),
            description: String(product.description),
            code: String(product.code),
            price: Number(product.price),
            status: Boolean(product.status),
            stock: Number(product.stock),
            category: String(product.category),
            thumbnails: Array.isArray(product.thumbnails) ? product.thumbnails.map(String) : []
        };

        all.push(toSave);
        await this.#writeAll(all);
        return toSave;
    }

    async update(pid, fields) {
        const all = await this.#readAll();
        const idx = all.findIndex(p => String(p.id) === String(pid));
        if (idx === -1) {
            const err = new Error('Producto no encontrado');
            err.statusCode = 404;
            throw err;
        }

        // No permitir cambiar/eliminar id
        const { id, ...rest } = fields || {};
        all[idx] = { ...all[idx], ...rest };
        await this.#writeAll(all);
        return all[idx];
    }

    async delete(pid) {
        const all = await this.#readAll();
        const next = all.filter(p => String(p.id) !== String(pid));
        const deleted = next.length !== all.length;
        if (!deleted) {
            const err = new Error('Producto no encontrado');
            err.statusCode = 404;
            throw err;
        }
        await this.#writeAll(next);
        return true;
    }
}

module.exports = ProductManager;
