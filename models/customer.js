const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const Customer = sequelize.define(
  "Customer",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    phoneNo: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      unique: true,
    },
    type: {
      type: DataTypes.ENUM("seller", "buyer"),
      allowNull: false,
    },
    licenseNo: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    legalDoc: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    tin: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM("pending", "approved", "rejected"),
      defaultValue: "pending",
    },
  },
  {
    timestamps: true,
    charset: "utf8",
    collate: "utf8_general_ci",
  },
);

module.exports = Customer;
