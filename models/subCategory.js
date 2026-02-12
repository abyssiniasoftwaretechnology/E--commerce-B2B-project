// src/models/subcategory.model.js
const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");
const Category = require("./category");

const SubCategory = sequelize.define("SubCategory", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  categoryId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
        model: Category,
        key: 'id'
    }
  },
}, {
  timestamps: true,
  charset: "utf8",
  collate: "utf8_general_ci",
});

module.exports = SubCategory;
