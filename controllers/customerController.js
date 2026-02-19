const Customer = require("../models/customer");
const bcrypt = require("bcryptjs");
const { generateToken } = require("../config/jwt");
const { UniqueConstraintError, Op } = require("sequelize");
const { registerCustomerSchema, updateCustomerSchema } = require("../helper/schema");
const upload = require("../middleware/uploads"); 
const fs = require("fs");
const path = require("path");

// ------------------- REGISTER CUSTOMER -------------------
// Use upload.single("legalDoc") in route to handle file
exports.registerCustomer = async (req, res) => {
  try {
    // Multer files
    const legalDocs = req.files ? req.files.map(f => f.filename) : [];

    // Validate input (without legalDocs)
    const { error, value } = registerCustomerSchema.validate(req.body);
    if (error) {
      // cleanup uploaded files on error
      legalDocs.forEach(f => fs.unlinkSync(path.join(__dirname, "../uploads", f)));
      return res.status(400).json({ message: error.details[0].message });
    }
    const { name, phoneNo, password, type, email, licenseNo, tin } = value;

    // Check for duplicate phone/email
    const existingCustomer = await Customer.findOne({
      where: {
        [Op.or]: [{ phoneNo }, { email }],
      },
    });
    if (existingCustomer) {
      legalDocs.forEach(f => fs.unlinkSync(path.join(__dirname, "../uploads", f)));
      return res.status(409).json({ message: "Phone number or email already exists." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const status = type === "buyer" ? "approved" : "pending";

    // Create customer
    const customer = await Customer.create({
      name,
      phoneNo,
      password: hashedPassword,
      type,
      email,
      licenseNo,
      legalDoc: legalDocs, 
      tin,
      status,
    });

    const token = generateToken({ id: customer.id, type: customer.type });

    res.status(201).json({
      message: "Registration successful",
      customer,
      token,
    });
  } catch (err) {
    if (req.files) {
      req.files.forEach(f => fs.unlinkSync(path.join(__dirname, "../uploads", f.filename)));
    }
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
      return res.status(400).json({
        message: "Identifier and password are required.",
      });
    }

    // Find by phoneNo or email
    const customer = await Customer.findOne({
      where: {
        [Op.or]: [{ phoneNo: identifier }, { email: identifier }],
      },
    });

    if (!customer) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    if (customer.status !== "approved") {
      return res.status(403).json({
        message: "Your account is not active yet.",
      });
    }

    const isMatch = await bcrypt.compare(password, customer.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = generateToken({
      id: customer.id,
      type: customer.type,
    });

    // ✅ Only return token
    return res.status(200).json({ token });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
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
      attributes: { exclude: ["password", "updatedAt"] },
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
    const customer = await Customer.findByPk(req.params.id,{
      attributes: { exclude: ["password", "updatedAt"] },
    });
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
    if (error) {
      if (req.files) {
        req.files.forEach(f =>
          fs.unlinkSync(path.join(__dirname, "../uploads", f.filename))
        );
      }
      return res.status(400).json({ message: error.details[0].message });
    }

    const customer = await Customer.findByPk(req.params.id);
    if (!customer) return res.status(404).json({ message: "Customer not found" });

    const {
      name,
      phoneNo,
      password,
      type,
      email,
      licenseNo,
      tin,
    } = value || {}; 

    // Handle multiple legal docs
    const legalDocs = req.files?.length
      ? req.files.map(f => f.filename)
      : customer.legalDoc;

    const updatedPassword = password
      ? await bcrypt.hash(password, 10)
      : customer.password;

    await customer.update({
      name: name ?? customer.name,
      phoneNo: phoneNo ?? customer.phoneNo,
      password: updatedPassword,
      type: type ?? customer.type,
      email: email ?? customer.email,
      licenseNo: licenseNo ?? customer.licenseNo,
      legalDoc: legalDocs,
      tin: tin ?? customer.tin,
    });

    const customerData = customer.toJSON(); 
    delete customerData.password; 

    const updatedCustomer = customer.toJSON(); // convert to plain object
    delete updatedCustomer.password; // remove password field

    res.json({
      message: "Customer updated successfully",
      customer: updatedCustomer,
    });


  } catch (err) {
    if (req.files) {
      req.files.forEach(f =>
        fs.unlinkSync(path.join(__dirname, "../uploads", f.filename))
      );
    }
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// ------------------- UPDATE CUSTOMER STATUS (ADMIN ONLY FOR SELLERS) -------------------
exports.updateCustomerStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const allowedStatuses = ["pending", "approved", "rejected"];

    if (!status || !allowedStatuses.includes(status)) {
      return res.status(400).json({
        message: "Invalid status value",
      });
    }

    const customer = await Customer.findByPk(req.params.id);
    if (!customer) {
      return res.status(404).json({
        message: "Customer not found",
      });
    }

    if (customer.type !== "seller") {
      return res.status(403).json({
        message: "Status update allowed only for sellers",
      });
    }

  
    if (customer.status === status) {
      return res.status(400).json({
        message: `Customer is already ${status}`,
      });
    }

    if (customer.status === "approved" && status === "pending") {
      return res.status(400).json({
        message: "Cannot revert approved customer back to pending",
      });
    }

    await customer.update({ status });

    const customerData = customer.toJSON();
    delete customerData.password;

    return res.json({
      message: "Customer status updated successfully",
      customer: customerData,
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({
      message: "Server error",
    });
  }
};


// ------------------- DELETE CUSTOMER -------------------
exports.deleteCustomer = async (req, res) => {
  try {
    const customer = await Customer.findByPk(req.params.id);
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    // delete uploaded legal documents
    if (Array.isArray(customer.legalDoc)) {
      customer.legalDoc.forEach((file) => {
        const filePath = path.join(__dirname, "../uploads", file);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      });
    }

    await customer.destroy();

    res.json({ message: "Customer deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

