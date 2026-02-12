const Post = require("../models/post");
const Item = require("../models/item");
const fs = require("fs");
const path = require("path");

// Helper: delete old images from server
const deleteImages = (images) => {
  if (!images || images.length === 0) return;
  images.forEach((img) => {
    const filePath = path.join(__dirname, "../uploads", img);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  });
};

// CREATE POST
exports.createPost = async (req, res) => {
  try {
    const { itemId, pricing, detail } = req.body;

    if (!itemId || !pricing) {
      return res.status(400).json({ message: "itemId and pricing are required" });
    }

    const item = await Item.findByPk(itemId);
    if (!item) return res.status(404).json({ message: "Item not found" });

    const images = req.files ? req.files.map((f) => f.filename) : [];
    const pricingArray = JSON.parse(pricing);

    const post = await Post.create({
      itemId,
      pricing: pricingArray,
      images,
      detail: detail || null,
      status: "pending",
    });

    res.status(201).json(post);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error creating post", error: error.message });
  }
};

// GET ALL POSTS
exports.getPosts = async (req, res) => {
  try {
    const posts = await Post.findAll({ order: [["createdAt", "DESC"]] });
    res.json(posts);
  } catch (error) {
    res.status(500).json({ message: "Error fetching posts", error: error.message });
  }
};

// GET POST BY ID
exports.getPostById = async (req, res) => {
  try {
    const { id } = req.params;
    const post = await Post.findByPk(id);
    if (!post) return res.status(404).json({ message: "Post not found" });
    res.json(post);
  } catch (error) {
    res.status(500).json({ message: "Error fetching post", error: error.message });
  }
};

// UPDATE POST
exports.updatePost = async (req, res) => {
  try {
    const { id } = req.params;
    const { itemId, pricing, detail, status } = req.body;

    const post = await Post.findByPk(id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    // Update images: if new files uploaded, replace old ones
    if (req.files && req.files.length > 0) {
      deleteImages(post.images); // delete old files
      post.images = req.files.map((f) => f.filename);
    }

    // Update other fields
    if (itemId) {
      const item = await Item.findByPk(itemId);
      if (!item) return res.status(404).json({ message: "Item not found" });
      post.itemId = itemId;
    }

    if (pricing) post.pricing = JSON.parse(pricing);
    if (detail !== undefined) post.detail = detail;
    if (status) post.status = status;

    await post.save();
    res.json(post);
  } catch (error) {
    res.status(500).json({ message: "Error updating post", error: error.message });
  }
};

// DELETE POST
exports.deletePost = async (req, res) => {
  try {
    const { id } = req.params;
    const post = await Post.findByPk(id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    // Delete images from server
    deleteImages(post.images);

    await post.destroy();
    res.json({ message: "Post deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting post", error: error.message });
  }
};
