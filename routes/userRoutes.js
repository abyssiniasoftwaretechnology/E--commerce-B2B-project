const express = require("express");
const router = express.Router();
const userController = require("../controllers/usersController");
const authMiddleware = require("../middleware/auth");

// CRUD routes
router.post("/",  userController.createUser);         
router.get("/", userController.getUsers);            
router.get("/:id", userController.getUserById);      
router.put("/:id", authMiddleware, userController.updateUser);       
router.delete("/:id", authMiddleware, userController.deleteUser);   
router.post("/login", userController.login); 

module.exports = router;
