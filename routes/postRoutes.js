const express = require("express");
const router = express.Router();
const postController = require("../controllers/postController");
const upload = require("../middleware/uploads");

// CRUD routes with image upload
router.post("/", upload.array("images", 10), postController.createPost);
router.put("/:id", upload.array("images", 10), postController.updatePost);

router.get("/", postController.getPosts);
router.get("/:id", postController.getPostById);
router.delete("/:id", postController.deletePost);
router.get("/item/:itemId", postController.getPostsByItem);
// router.get("/search", postController.searchPosts);


module.exports = router;
