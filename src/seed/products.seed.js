require("dotenv").config();
const mongoose = require("mongoose");
const path = require("path");
const fs = require("fs");

const Product = require("../models/Product");

const filePath = path.join(__dirname, "../data/products.json");
const products = JSON.parse(fs.readFileSync(filePath, "utf-8"));

function normalizeThumbs(p) {
    const thumbs = Array.isArray(p.thumbnails) ? p.thumbnails : [];
    p.thumbnails = thumbs.map(t => {
        if (!t) return t;
        t = t.trim().replace(/\\/g, "/");

        if (t.startsWith("http")) return t;

        t = t.replace(/^\/?images\//, "");

        return `/images/${t}`;
    });

    return p;
}


(async () => {
    try {
        await mongoose.connect(process.env.MONGO_URL);

        const count = await Product.countDocuments();
        if (count > 0) {
            console.log("Producto ya existe. Salteando seed.");
            process.exit(0);
        }

        const normalized = products.map(normalizeThumbs);
        await Product.insertMany(normalized);

        console.log(`Seed OK. Insertados ${normalized.length} productos.`);
        process.exit(0);
    } catch (err) {
        console.error("Seed error:", err.message);
        process.exit(1);
    }
})();
