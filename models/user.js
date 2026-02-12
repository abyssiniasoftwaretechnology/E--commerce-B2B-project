const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const User = sequelize.define("User", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  phoneNo: {
    type: DataTypes.STRING,
  },
  email: {
    type: DataTypes.STRING,
    unique: true,
  },
}, {
  timestamps: true,
    charset: "utf8",
    collate: "utf8_general_ci",
});

module.exports = User;
