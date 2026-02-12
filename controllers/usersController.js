const User = require("../models/user");
const bcrypt = require("bcrypt");

// Create a new user
exports.createUser = async (req, res) => {
  try {
    const { name, username, password, phoneNo, email } = req.body;

    // Hash password before saving
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      name,
      username,
      password: hashedPassword,
      phoneNo,
      email,
    });

    res.status(201).json(newUser);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error creating user", error: error.message });
  }
};

// Get all users
exports.getUsers = async (req, res) => {
  try {
    const users = await User.findAll();
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Error fetching users", error: error.message });
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
    res.status(500).json({ message: "Error fetching user", error: error.message });
  }
};

// Update user by ID
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, username, password, phoneNo, email } = req.body;

    const user = await User.findByPk(id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Hash new password if provided
    const updatedData = {
      name: name || user.name,
      username: username || user.username,
      phoneNo: phoneNo || user.phoneNo,
      email: email || user.email,
    };
    if (password) {
      updatedData.password = await bcrypt.hash(password, 10);
    }

    await user.update(updatedData);
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Error updating user", error: error.message });
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
    res.status(500).json({ message: "Error deleting user", error: error.message });
  }
};
