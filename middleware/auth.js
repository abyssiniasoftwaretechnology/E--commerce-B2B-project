const jwt = require("jsonwebtoken");
const Customer = require("../models/customer");

// ================= USER AUTH (Admin/System) =================
const userAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "your_secret_key"
    );

    // Attach the decoded user info to req.user
    req.user = decoded;

    next();
  } catch (err) {
    console.error("JWT Error:", err);
    return res.status(401).json({ message: "Invalid token" });
  }
};

// ================= CUSTOMER AUTH =================
const customerAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "your_secret_key"
    );

    const customer = await Customer.findByPk(decoded.id);

    if (!customer) {
      return res.status(401).json({ message: "Customer not found" });
    }

    if (customer.status !== "approved") {
      return res.status(403).json({ message: "Account not active" });
    }

    req.customer = customer;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
};

// ================= COMBINED AUTH =================
const userOrCustomerAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "your_secret_key"
    );

    // First, try to treat it as a system/user token
    if (decoded.id && !decoded.customer) {
      req.user = decoded;
      return next();
    }

    // Otherwise, try as a customer token
    const customer = await Customer.findByPk(decoded.id);
    if (customer) {
      if (customer.status !== "approved") {
        return res.status(403).json({ message: "Account not active" });
      }
      req.customer = customer;
      return next();
    }

    // If neither, reject
    return res.status(401).json({ message: "Unauthorized" });
  } catch (err) {
    console.error("JWT Error:", err);
    return res.status(401).json({ message: "Invalid token" });
  }
};



module.exports = {
  userAuth,
  customerAuth,
  userOrCustomerAuth,
};
