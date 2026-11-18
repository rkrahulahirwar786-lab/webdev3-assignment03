const Product = require('../models/Product');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');

const FIELDS = ['name', 'sku', 'category', 'price', 'quantity', 'reorderLevel', 'supplier'];
const SORTABLE = ['name', 'sku', 'category', 'price', 'quantity', 'createdAt', 'updatedAt'];

const pick = (obj, keys) =>
  keys.reduce((acc, k) => (obj[k] !== undefined ? { ...acc, [k]: obj[k] } : acc), {});

const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// POST /api/products
exports.createProduct = asyncHandler(async (req, res) => {
  const product = await Product.create(pick(req.body, FIELDS));
  res.status(201).json(product);
});

// GET /api/products?category=&supplier=&search=&minPrice=&maxPrice=&inStock=&sort=&page=&limit=
exports.getProducts = asyncHandler(async (req, res) => {
  const { category, supplier, search, minPrice, maxPrice, inStock, sort } = req.query;

  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 100);

  // ---- Filtering ----
  const filter = {};
  if (category) filter.category = new RegExp(`^${escapeRegex(category)}$`, 'i');
  if (supplier) filter.supplier = new RegExp(`^${escapeRegex(supplier)}$`, 'i');
  if (search) {
    const rx = new RegExp(escapeRegex(search), 'i');
    filter.$or = [{ name: rx }, { sku: rx }];
  }
  if (minPrice !== undefined || maxPrice !== undefined) {
    filter.price = {};
    if (minPrice !== undefined) {
      if (isNaN(minPrice)) throw new AppError('minPrice must be a number', 400);
      filter.price.$gte = Number(minPrice);
    }
    if (maxPrice !== undefined) {
      if (isNaN(maxPrice)) throw new AppError('maxPrice must be a number', 400);
      filter.price.$lte = Number(maxPrice);
    }
  }
  if (inStock === 'true') filter.quantity = { $gt: 0 };
  if (inStock === 'false') filter.quantity = 0;

  // ---- Sorting (e.g. sort=-price,name) ----
  let sortBy = '-createdAt';
  if (sort) {
    const tokens = sort.split(',').map((t) => t.trim()).filter(Boolean);
    const invalid = tokens.filter((t) => !SORTABLE.includes(t.replace(/^-/, '')));
    if (invalid.length) {
      throw new AppError(`Cannot sort by: ${invalid.join(', ')}. Allowed: ${SORTABLE.join(', ')}`, 400);
    }
    sortBy = tokens.join(' ');
  }

  // ---- Pagination ----
  const [total, products] = await Promise.all([
    Product.countDocuments(filter),
    Product.find(filter)
      .sort(`${sortBy} _id`)
      .skip((page - 1) * limit)
      .limit(limit),
  ]);

  res.json({
    total,
    page,
    totalPages: Math.ceil(total / limit),
    count: products.length,
    products,
  });
});

// GET /api/products/:id
exports.getProductById = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw new AppError('Product not found', 404);
  res.json(product);
});

// PUT /api/products/:id
exports.updateProduct = asyncHandler(async (req, res) => {
  const updates = pick(req.body, FIELDS);
  if (Object.keys(updates).length === 0) {
    throw new AppError(`Provide at least one of: ${FIELDS.join(', ')}`, 400);
  }
  const product = await Product.findByIdAndUpdate(req.params.id, updates, {
    new: true,
    runValidators: true,
  });
  if (!product) throw new AppError('Product not found', 404);
  res.json(product);
});

// PATCH /api/products/:id/stock   body: { "change": 10 }  (+ restock, - sale)
exports.adjustStock = asyncHandler(async (req, res) => {
  const { change } = req.body;

  // Single atomic update: for a sale, only matches if enough stock is available,
  // so concurrent requests can never push quantity below zero.
  const product = await Product.findOneAndUpdate(
    { _id: req.params.id, quantity: { $gte: change < 0 ? -change : 0 } },
    { $inc: { quantity: change } },
    { new: true, runValidators: true }
  );

  if (!product) {
    const exists = await Product.exists({ _id: req.params.id });
    if (!exists) throw new AppError('Product not found', 404);
    throw new AppError('Insufficient stock for this sale', 400);
  }

  res.json({ message: 'Stock updated', product });
});

// DELETE /api/products/:id
exports.deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndDelete(req.params.id);
  if (!product) throw new AppError('Product not found', 404);
  res.json({ message: 'Product deleted', id: product.id });
});

// GET /api/products/low-stock  -> quantity <= reorderLevel
exports.getLowStock = asyncHandler(async (req, res) => {
  const lowStockItems = await Product.find({
    $expr: { $lte: ['$quantity', '$reorderLevel'] },
  }).sort('quantity');
  res.json({ count: lowStockItems.length, lowStockItems });
});

// GET /api/products/summary  -> aggregation by category
exports.getCategorySummary = asyncHandler(async (req, res) => {
  const summary = await Product.aggregate([
    {
      $group: {
        _id: '$category',
        totalItems: { $sum: 1 },
        totalQuantity: { $sum: '$quantity' },
        totalStockValue: { $sum: { $multiply: ['$price', '$quantity'] } },
        avgPrice: { $avg: '$price' },
      },
    },
    { $addFields: { avgPrice: { $round: ['$avgPrice', 2] } } },
    { $sort: { totalStockValue: -1 } },
  ]);
  res.json({ categories: summary.length, summary });
});
