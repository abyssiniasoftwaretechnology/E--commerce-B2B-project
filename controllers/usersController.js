const User = require("../models/user");
const bcrypt = require("bcrypt");
const { UniqueConstraintError } = require("sequelize");
const { registerUserSchema, updateUserSchema } = require("../helper/schema");
const { generateToken } = require("../helper/jwt");

// Create a new user
exports.createUser = async (req, res) => {
  try {
    const { error, value } = registerUserSchema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      return res.status(400).json({
        errors: error.details.map((err) => err.message),
      });
    }

    const { name, username, password, phoneNo, email } = value;

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      name,
      username,
      password: hashedPassword,
      phoneNo,
      email,
    });

    const userResponse = newUser.toJSON();
    delete userResponse.password;

    res.status(201).json(userResponse);
  } catch (error) {
    console.error(error);

    // 🔹 Handle duplicate fields properly
    if (error instanceof UniqueConstraintError) {
      return res.status(400).json({
        message: `${error.errors[0].path} already exists`,
      });
    }

    res.status(500).json({
      message: "Internal server error",
    });
  }
};

// Get all users
exports.getUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      order: [["createdAt", "DESC"]],
      attributes: { exclude: ["password"] },
    });
    res.json(users);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching users", error: error.message });
  }
};

// Get user by ID
exports.getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByPk(id);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching user", error: error.message });
  }
};

// Update user by ID
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;

    // 🔹 Validate request body
    const { error, value } = updateUserSchema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      return res.status(400).json({
        errors: error.details.map(err => err.message),
      });
    }

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // 🔹 If password exists, hash it
    if (value.password) {
      value.password = await bcrypt.hash(value.password, 10);
    }

    // 🔹 Update only validated fields
    await user.update(value);

    // 🔹 Remove password from response
    const userResponse = user.toJSON();
    delete userResponse.password;

    res.json(userResponse);

  } catch (error) {
    console.error(error);

    if (error instanceof UniqueConstraintError) {
      return res.status(400).json({
        message: `${error.errors[0].path} already exists`,
      });
    }

    res.status(500).json({
      message: "Internal server error",
    });
  }
};

// Delete user by ID
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByPk(id);
    if (!user) return res.status(404).json({ message: "User not found" });

    await user.destroy();
    res.json({ message: "User deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error deleting user", error: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({ where: { username } });
    if (!user) return res.status(401).json({ message: "Invalid username or password" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: "Invalid username or password" });

 
    const token = generateToken({
      id: user.id,
      username: user.username,
      role: user.role || "Admin",
    });

    const { password: _, ...userData } = user.toJSON();

    res.json({
      message: "Login successful",
    //   user: userData,
      token,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};
