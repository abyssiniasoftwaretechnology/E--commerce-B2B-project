// models/sales.model.js
const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");
const Item = require("./item");

const Post = sequelize.define(
  "Post",
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

    pricing: {
      type: DataTypes.JSON,
      allowNull: false,
    },

    images: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: [],
    },

    status: {
      type: DataTypes.ENUM("pending", "post", "cancel"),
      defaultValue: "pending",
    },

    detail: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    count: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
  },
  {
    timestamps: true,
    charset: "utf8",
    collate: "utf8_general_ci",
  },
);

module.exports = Post;
