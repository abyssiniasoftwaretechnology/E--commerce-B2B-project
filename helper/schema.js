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

module.exports = {
  registerUserSchema,
  updateUserSchema,
};
