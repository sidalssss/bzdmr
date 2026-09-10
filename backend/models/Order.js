const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Order = sequelize.define('Order', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  guest_email: {
    type: DataTypes.STRING,
    allowNull: true // Only for guest checkout
  },
  guest_name: {
    type: DataTypes.STRING,
    allowNull: true
  },
  shipping_address: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  total_amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  payment_status: {
    type: DataTypes.ENUM('pending', 'authorized', 'paid', 'failed', 'refunded'),
    defaultValue: 'pending'
  },
  order_status: {
    type: DataTypes.ENUM('created', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'),
    defaultValue: 'created'
  },
  tracking_number: {
    type: DataTypes.STRING,
    allowNull: true
  },
  is_guest: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
});

module.exports = Order;
