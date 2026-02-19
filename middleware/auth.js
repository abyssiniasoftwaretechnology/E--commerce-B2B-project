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

    // Example: allow only admin users
    if (decoded.type !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    req.user = decoded;
    next();
  } catch (err) {
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


module.exports = {
  userAuth,
  customerAuth,
};
