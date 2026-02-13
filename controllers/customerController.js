const Customer = require("../models/customer");
const bcrypt = require("bcryptjs");
const { generateToken } = require("../config/jwt");
const { UniqueConstraintError, Op } = require("sequelize");
const { registerCustomerSchema, updateCustomerSchema } = require("../validation/customerValidation");

// ------------------- REGISTER CUSTOMER -------------------
exports.registerCustomer = async (req, res) => {
  try {
    // Validate input
    const { error, value } = registerCustomerSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });

    const { name, phoneNo, password, type, email, licenseNo, legalDoc, tin } = value;

    // Check if phoneNo or email already exists
    const existingCustomer = await Customer.findOne({
      where: {
        [Op.or]: [{ phoneNo }, { email }],
      },
    });
    if (existingCustomer) {
      return res.status(409).json({ message: "Phone number or email already exists." });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create customer
    const customer = await Customer.create({
      name,
      phoneNo,
      password: hashedPassword,
      type,
      email,
      licenseNo,
      legalDoc,
      tin,
    });

    // Generate JWT token
    const token = generateToken({ id: customer.id, type: customer.type });

    res.status(201).json({ customer, token });
  } catch (err) {
    if (err instanceof UniqueConstraintError) {
      return res.status(409).json({ message: "Duplicate field value exists." });
    }
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// ------------------- LOGIN CUSTOMER -------------------
exports.loginCustomer = async (req, res) => {
  try {
    const { identifier, password } = req.body;
    if (!identifier || !password) {
      return res.status(400).json({ message: "Identifier and password are required." });
    }

    // Find customer by phoneNo or email
    const customer = await Customer.findOne({
      where: {
        [Op.or]: [{ phoneNo: identifier }, { email: identifier }],
      },
    });

    if (!customer) return res.status(401).json({ message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, customer.password);
    if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });

    const token = generateToken({ id: customer.id, type: customer.type });
    res.json({ customer, token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// ------------------- LOGOUT CUSTOMER -------------------
exports.logoutCustomer = async (req, res) => {
  res.json({ message: "Logged out successfully" });
};

// ------------------- GET CUSTOMERS (PAGINATION) -------------------
exports.getCustomers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const { count, rows } = await Customer.findAndCountAll({
      limit,
      offset,
      order: [["createdAt", "DESC"]],
    });

    res.json({
      total: count,
      page,
      totalPages: Math.ceil(count / limit),
      customers: rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// ------------------- GET SINGLE CUSTOMER -------------------
exports.getCustomerById = async (req, res) => {
  try {
    const customer = await Customer.findByPk(req.params.id);
    if (!customer) return res.status(404).json({ message: "Customer not found" });
    res.json(customer);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// ------------------- UPDATE CUSTOMER -------------------
exports.updateCustomer = async (req, res) => {
  try {
    const { error, value } = updateCustomerSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });

    const customer = await Customer.findByPk(req.params.id);
    if (!customer) return res.status(404).json({ message: "Customer not found" });

    const { name, phoneNo, password, type, email, licenseNo, legalDoc, tin } = value;

    // Hash password if updated
    const updatedPassword = password ? await bcrypt.hash(password, 10) : customer.password;

    await customer.update({
      name: name || customer.name,
      phoneNo: phoneNo || customer.phoneNo,
      password: updatedPassword,
      type: type || customer.type,
      email: email || customer.email,
      licenseNo: licenseNo || customer.licenseNo,
      legalDoc: legalDoc || customer.legalDoc,
      tin: tin || customer.tin,
    });

    res.json(customer);
  } catch (err) {
    if (err instanceof UniqueConstraintError) {
      return res.status(409).json({ message: "Duplicate field value exists." });
    }
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// ------------------- UPDATE CUSTOMER STATUS (ADMIN) -------------------
exports.updateCustomerStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const allowedStatuses = ["pending", "approved", "rejected"];

    if (!status || !allowedStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    const customer = await Customer.findByPk(req.params.id);
    if (!customer) return res.status(404).json({ message: "Customer not found" });

    await customer.update({ status });
    res.json({ message: "Customer status updated successfully", customer });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// ------------------- DELETE CUSTOMER -------------------
exports.deleteCustomer = async (req, res) => {
  try {
    const customer = await Customer.findByPk(req.params.id);
    if (!customer) return res.status(404).json({ message: "Customer not found" });

    await customer.destroy();
    res.json({ message: "Customer deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
