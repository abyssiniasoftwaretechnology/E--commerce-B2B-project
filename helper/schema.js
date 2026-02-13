const Joi = require("joi");

const registerUserSchema = Joi.object({
  name: Joi.string().min(3).max(100).required(),
  username: Joi.string().alphanum().min(3).max(30).required(),
  password: Joi.string().min(6).required(),
  phoneNo: Joi.string().optional().allow("", null),
  email: Joi.string().email().optional().allow("", null),
});

const updateUserSchema = Joi.object({
  name: Joi.string().min(3).max(100).optional(),
  username: Joi.string().alphanum().min(3).max(30).optional(),
  password: Joi.string().min(6).optional(),
  phoneNo: Joi.string().optional().allow("", null),
  email: Joi.string().email().optional().allow("", null),
});

// Schema for creating a new customer
const registerCustomerSchema = Joi.object({
  name: Joi.string().min(3).max(100).required(),
  phoneNo: Joi.string().optional().allow("", null),
  password: Joi.string().min(6).required(),
  email: Joi.string().email().optional().allow("", null),
  type: Joi.string().valid("seller", "buyer").required(),
  licenseNo: Joi.string().optional().allow("", null),
  legalDoc: Joi.object().optional().allow(null),
  tin: Joi.string().optional().allow("", null),
  status: Joi.string().valid("pending", "approved", "rejected").optional(),
});

// Schema for updating an existing customer
const updateCustomerSchema = Joi.object({
  name: Joi.string().min(3).max(100).optional(),
  phoneNo: Joi.string().optional().allow("", null),
  password: Joi.string().min(6).optional(),
  email: Joi.string().email().optional().allow("", null),
  type: Joi.string().valid("seller", "buyer").optional(),
  licenseNo: Joi.string().optional().allow("", null),
  legalDoc: Joi.object().optional().allow(null),
  tin: Joi.string().optional().allow("", null),
  status: Joi.string().valid("pending", "approved", "rejected").optional(),
});

module.exports = {
  registerUserSchema,
  updateUserSchema,
  registerCustomerSchema,
  updateCustomerSchema,
};
