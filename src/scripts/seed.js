// Optional: fills the DB with 12 sample products so GET/summary/low-stock have data
// Run with:  npm run seed
require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../src/models/Product');

const data = [
  { name: 'Wireless Mouse', sku: 'ELEC-MS-101', category: 'Electronics', price: 799, quantity: 45, reorderLevel: 10, supplier: 'Logitech' },
  { name: 'Mechanical Keyboard', sku: 'ELEC-KB-102', category: 'Electronics', price: 3499, quantity: 8, reorderLevel: 10, supplier: 'Redragon' },
  { name: 'Bluetooth Speaker', sku: 'ELEC-SP-103', category: 'Electronics', price: 2499, quantity: 30, reorderLevel: 8, supplier: 'boAt' },
  { name: 'Laptop 15.6 inch', sku: 'ELEC-LT-104', category: 'Electronics', price: 55000, quantity: 3, reorderLevel: 5, supplier: 'HP India' },
  { name: 'Cotton T-Shirt', sku: 'APRL-TS-201', category: 'Apparel', price: 499, quantity: 60, reorderLevel: 15, supplier: 'Allen Solly' },
  { name: 'Denim Jacket', sku: 'APRL-JK-202', category: 'Apparel', price: 2299, quantity: 18, reorderLevel: 6, supplier: 'Levis' },
  { name: 'Study Table', sku: 'FURN-TB-812', category: 'Furniture', price: 3999, quantity: 2, reorderLevel: 4, supplier: 'IKEA India' },
  { name: 'Office Chair', sku: 'FURN-CH-813', category: 'Furniture', price: 5499, quantity: 12, reorderLevel: 5, supplier: 'Godrej Interio' },
  { name: 'Gel Pen Pack of 10', sku: 'STNY-PN-711', category: 'Stationery', price: 120, quantity: 5, reorderLevel: 20, supplier: 'Cello Pens' },
  { name: 'A4 Notebook', sku: 'STNY-NB-712', category: 'Stationery', price: 90, quantity: 100, reorderLevel: 25, supplier: 'Classmate' },
  { name: 'Non-stick Pan', sku: 'HOME-PN-301', category: 'Home & Kitchen', price: 899, quantity: 20, reorderLevel: 8, supplier: 'Prestige' },
  { name: 'Water Bottle 1L', sku: 'HOME-WB-302', category: 'Home & Kitchen', price: 349, quantity: 4, reorderLevel: 10, supplier: 'Milton' },
];

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    await Product.deleteMany({});
    await Product.insertMany(data);
    console.log(`Seeded ${data.length} products`);
  } catch (err) {
    console.error(err.message);
  } finally {
    await mongoose.disconnect();
  }
})();
