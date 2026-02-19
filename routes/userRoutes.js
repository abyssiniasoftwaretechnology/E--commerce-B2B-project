const express = require("express");
const router = express.Router();
const userController = require("../controllers/usersController");
const { userAuth} = require("../middleware/auth");

// CRUD routes
router.post("/",  userController.createUser);         
router.get("/", userController.getUsers);            
router.get("/:id", userAuth, userController.getUserById);      
router.put("/:id", userAuth, userController.updateUser);       
router.delete("/:id", userAuth, userController.deleteUser);   
router.post("/login", userController.login); 

module.exports = router;
