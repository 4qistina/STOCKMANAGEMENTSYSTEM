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

const app = express();
app.use(cors({ origin: 'http://localhost:3000' }));
app.use(express.json());

app.get('/', (req, res) => res.send('Utzshop Stock Management System API is running'));

// Shared use cases (Supervisor + Warehouse Staff)
app.use('/api', registerAccountController);
app.use('/api', logInController);
app.use('/api', viewProductDetailsController);
app.use('/api', placeOrderController);
app.use('/api', viewOrderDetailsController);
app.use('/api', updateProductStockController);

// Warehouse Staff-only use cases
app.use('/api', maintainProductController);
app.use('/api', updateOrderStatusController);
app.use('/api', manageDriverInformationController);
app.use('/api', updateDeliveryInformationController);
app.use('/api', manageProductCategoryController);
app.use('/api', manageProductBrandController);

module.exports = app;
