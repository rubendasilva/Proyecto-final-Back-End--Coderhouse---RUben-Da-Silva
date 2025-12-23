const fs = require('fs');
const path = require('path');
const { connectDB } = require('../config/db');
const Product = require('../models/Product');

async function run() {
  await connectDB();
  const file = path.join(__dirname, '..', 'data', 'products.json');
  const raw = fs.readFileSync(file, 'utf8');
  const products = JSON.parse(raw);
  await Product.deleteMany({});
  await Product.insertMany(products);
  console.log(`Seeded ${products.length} products`);
  process.exit(0);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
