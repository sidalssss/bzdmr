const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Category = require('./Category');

const Product = sequelize.define('Product', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  brand: {
    type: DataTypes.STRING,
    allowNull: false
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT
  },
  image_url: {
    type: DataTypes.STRING,
    defaultValue: 'https://via.placeholder.com/300'
  },
  specs: {
    type: DataTypes.JSON
  },
  variations: {
    type: DataTypes.JSON // { colors: [], sizes: [], etc. }
  },
  stock_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  in_stock: {
    type: DataTypes.VIRTUAL,
    get() {
      return this.stock_count > 0;
    }
  },
  rating: {
    type: DataTypes.FLOAT,
    defaultValue: 0
  },
  reviews_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
});

Product.belongsTo(Category);
Category.hasMany(Product);

module.exports = Product;
