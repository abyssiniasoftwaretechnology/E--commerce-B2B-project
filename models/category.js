// src/models/category.model.js
const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const Category = sequelize.define("Category", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
}, {
  timestamps: true,
    charset: "utf8",
    collate: "utf8_general_ci",
});

module.exports = Category;
