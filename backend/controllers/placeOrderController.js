const orderModel = require('../models/orderModel');
const orderProductModel = require('../models/orderProductModel');
const productModel = require('../models/productModel');

async function viewProduct(req, res) {
  try {
    res.json(await productModel.findAvailable());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// Business logic: create order, insert line items, decrement stock
async function placeOrder(req, res) {
  try {
    const { userId, items } = req.body; // items = [{ productId, quantity }]
    const orderNumber = 'ORD-' + Date.now();

    const order = await orderModel.insert({ orderNumber, userId });

    for (const item of items) {
      const product = await productModel.findById(item.productId);
      if (!product) throw new Error(`Product ${item.productId} not found`);
      if (product.handInStock < item.quantity) {
        throw new Error(`Insufficient stock for product ${item.productId}`);
      }

      await orderProductModel.insert({
        orderId: order.orderID,
        productId: item.productId,
        orderProductQuantity: item.quantity,
      });

      await productModel.update(item.productId, {
        ...product,
        handInStock: product.handInStock - item.quantity,
      });
    }

    res.status(201).json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { viewProduct, placeOrder };