const PaymentMethod = require("../models/paymentMethod");

/**
 * Create a new payment method
 */
exports.createPaymentMethod = async (req, res) => {
  try {
    const { name, status } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Name is required" });
    }

    const paymentMethod = await PaymentMethod.create({
      name,
      status,
    });

    return res.status(201).json(paymentMethod);
  } catch (error) {
    console.error("Create PaymentMethod Error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * Get all payment methods
 */
exports.getAllPaymentMethods = async (req, res) => {
  try {
    const paymentMethods = await PaymentMethod.findAll({
      order: [["createdAt", "DESC"]],
    });

    return res.status(200).json(paymentMethods);
  } catch (error) {
    console.error("Get All PaymentMethods Error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * Get payment method by ID
 */
exports.getPaymentMethodById = async (req, res) => {
  try {
    const { id } = req.params;

    const paymentMethod = await PaymentMethod.findByPk(id);

    if (!paymentMethod) {
      return res.status(404).json({ message: "Payment method not found" });
    }

    return res.status(200).json(paymentMethod);
  } catch (error) {
    console.error("Get PaymentMethod By ID Error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * Update payment method
 */
exports.updatePaymentMethod = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, status } = req.body;

    const paymentMethod = await PaymentMethod.findByPk(id);

    if (!paymentMethod) {
      return res.status(404).json({ message: "Payment method not found" });
    }

    await paymentMethod.update({
      name: name ?? paymentMethod.name,
      status: status ?? paymentMethod.status,
    });

    return res.status(200).json(paymentMethod);
  } catch (error) {
    console.error("Update PaymentMethod Error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * Delete payment method
 */
exports.deletePaymentMethod = async (req, res) => {
  try {
    const { id } = req.params;

    const paymentMethod = await PaymentMethod.findByPk(id);

    if (!paymentMethod) {
      return res.status(404).json({ message: "Payment method not found" });
    }

    await paymentMethod.destroy();

    return res.status(200).json({ message: "Payment method deleted successfully" });
  } catch (error) {
    console.error("Delete PaymentMethod Error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
