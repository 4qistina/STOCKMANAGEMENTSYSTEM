const express = require('express');
const cors = require('cors');

const registerAccountController = require('./controllers/registerAccountController');
const logInController = require('./controllers/logInController');
const viewProductDetailsController = require('./controllers/viewProductDetailsController');
const placeOrderController = require('./controllers/placeOrderController');
const viewOrderDetailsController = require('./controllers/viewOrderDetailsController');
const updateProductStockController = require('./controllers/updateProductStockController');
const maintainProductController = require('./controllers/maintainProductController');
const updateOrderStatusController = require('./controllers/updateOrderStatusController');
const manageDriverInformationController = require('./controllers/manageDriverInformationController');
const updateDeliveryInformationController = require('./controllers/updateDeliveryInformationController');
const manageProductCategoryController = require('./controllers/manageProductCategoryController');
const manageProductBrandController = require('./controllers/manageProductBrandController');
const { requireRole } = require('./middleware/roleCheck');

const app = express();
app.use(cors({ origin: 'http://localhost:3000' }));
// Product images are sent as base64 data URLs (see maintain-products page).
// Express's default json() body limit is 100kb, which a compressed photo can
// easily exceed even though the "productImage" column itself is TEXT
// (unlimited) in schema.sql. Raise the limit so uploads aren't rejected at
// the HTTP layer before they ever reach the database.
app.use(express.json({ limit: '10mb' }));

app.get('/', (req, res) => res.send('Utzshop Stock Management System API is running'));

// Shared use cases (Supervisor + Warehouse Staff)
app.use('/api', registerAccountController);
app.use('/api', logInController);
app.use('/api', viewProductDetailsController);
app.use('/api', placeOrderController);
app.use('/api', viewOrderDetailsController);
app.use('/api', updateProductStockController);

// Warehouse Staff-only use cases
app.use('/api', requireRole('warehouse_staff'), maintainProductController);
app.use('/api', requireRole('warehouse_staff'), updateOrderStatusController);
app.use('/api', requireRole('warehouse_staff'), manageDriverInformationController);
app.use('/api', requireRole('warehouse_staff'), updateDeliveryInformationController);
app.use('/api', requireRole('warehouse_staff'), manageProductCategoryController);
app.use('/api', requireRole('warehouse_staff'), manageProductBrandController);

module.exports = app;