const express = require('express');
const cors = require('cors');

const registerAccountRoutes = require('./routes/registerAccountRoutes');
const logInRoutes = require('./routes/logInRoutes');
const viewProductDetailsRoutes = require('./routes/viewProductDetailsRoutes');
const placeOrderRoutes = require('./routes/placeOrderRoutes');
const viewOrderDetailsRoutes = require('./routes/viewOrderDetailsRoutes');
const updateProductStockRoutes = require('./routes/updateProductStockRoutes');
const maintainProductRoutes = require('./routes/maintainProductRoutes');
const updateOrderStatusRoutes = require('./routes/updateOrderStatusRoutes');
const manageDriverInformationRoutes = require('./routes/manageDriverInformationRoutes');
const updateDeliveryInformationRoutes = require('./routes/updateDeliveryInformationRoutes');
const manageProductCategoryRoutes = require('./routes/manageProductCategoryRoutes');
const manageProductBrandRoutes = require('./routes/manageProductBrandRoutes');

const app = express();
app.use(cors({ origin: 'http://localhost:3000' }));
app.use(express.json());

app.get('/', (req, res) => res.send('Utzshop Stock Management System API is running'));

// Shared use cases (Supervisor + Warehouse Staff)
app.use('/api', registerAccountRoutes);
app.use('/api', logInRoutes);
app.use('/api', viewProductDetailsRoutes);
app.use('/api', placeOrderRoutes);
app.use('/api', viewOrderDetailsRoutes);
app.use('/api', updateProductStockRoutes);

// Warehouse Staff-only use cases
app.use('/api', maintainProductRoutes);
app.use('/api', updateOrderStatusRoutes);
app.use('/api', manageDriverInformationRoutes);
app.use('/api', updateDeliveryInformationRoutes);
app.use('/api', manageProductCategoryRoutes);
app.use('/api', manageProductBrandRoutes);

module.exports = app;