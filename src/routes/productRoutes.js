const express = require('express');
const c = require('../controllers/productController');
const { validateId, validateCreate, validateUpdate, validateStockChange } = require('../middleware/validate');

const router = express.Router();

router.param('id', validateId);

// Static routes must come BEFORE "/:id" so they are not treated as ids
router.get('/low-stock', c.getLowStock);
router.get('/summary', c.getCategorySummary);

router.route('/').get(c.getProducts).post(validateCreate, c.createProduct);

router
  .route('/:id')
  .get(c.getProductById)
  .put(validateUpdate, c.updateProduct)
  .delete(c.deleteProduct);

router.patch('/:id/stock', validateStockChange, c.adjustStock);

module.exports = router;
