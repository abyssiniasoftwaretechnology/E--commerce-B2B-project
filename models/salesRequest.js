const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");
const Item = require("./item");
const PaymentMethod = require("./paymentMethod");

const salesRequest = sequelize.define(
  "salesRequest",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    itemId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Item,
        key: "id",
      },
    },

    price: {
      type: DataTypes.DECIMAL(12, 4),
      allowNull: false,
    },

    unit: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    quantity: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },

    paymentMethodId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: PaymentMethod,
        key: "id",
      },
    },

    images: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: [],
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

module.exports = salesRequest;
