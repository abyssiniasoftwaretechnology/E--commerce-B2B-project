const Post = require("../models/post");
const Item = require("../models/item");
const PaymentMethod = require("../models/paymentMethod");
const fs = require("fs");
const path = require("path");

// Helper: delete old images from server
const deleteImages = (images) => {
  if (!images) return;

  // If it's a string, try parsing it
  if (typeof images === "string") {
    try {
      images = JSON.parse(images);
    } catch (err) {
      return; // stop if invalid
    }
  }

  if (!Array.isArray(images) || images.length === 0) return;

  images.forEach((img) => {
    const filePath = path.join(__dirname, "../uploads", img);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  });
};

// CREATE POST
exports.createPost = async (req, res) => {
  try {
    const { itemId, pricing, detail } = req.body;

    if (!itemId || !pricing) {
      return res.status(400).json({
        message: "itemId and pricing are required",
      });
    }

    // 🔹 Validate item
    const item = await Item.findByPk(itemId);
    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }

    // 🔹 Parse pricing safely (since it's form-data)
    let pricingArray;
    try {
      pricingArray = JSON.parse(pricing);
    } catch (err) {
      return res.status(400).json({
        message: "Pricing must be valid JSON",
      });
    }

    if (!Array.isArray(pricingArray) || pricingArray.length === 0) {
      return res.status(400).json({
        message: "Pricing must be a non-empty array",
      });
    }

    // 🔹 Validate structure
    const ids = [];
    for (const entry of pricingArray) {
      if (
        !entry.paymentMethodId ||
        entry.value === undefined ||
        entry.value === null
      ) {
        return res.status(400).json({
          message:
            "Each pricing entry must contain paymentMethodId and value",
        });
      }

      if (isNaN(entry.value)) {
        return res.status(400).json({
          message: "Pricing value must be numeric",
        });
      }

      ids.push(entry.paymentMethodId);
    }

    // 🔹 Prevent duplicates
    if (new Set(ids).size !== ids.length) {
      return res.status(400).json({
        message: "Duplicate paymentMethodId detected",
      });
    }

    // 🔹 Validate payment methods in ONE query
    const validMethods = await PaymentMethod.findAll({
      where: {
        id: ids,
        status: "active",
      },
    });

    if (validMethods.length !== ids.length) {
      return res.status(400).json({
        message: "One or more payment methods are invalid or inactive",
      });
    }

    // 🔹 Handle images
    const images = req.files ? req.files.map((f) => f.filename) : [];

    // 🔹 Create post
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
    res.status(500).json({
      message: "Error creating post",
      error: error.message,
    });
  }
};

// GET ALL POSTS
exports.getPosts = async (req, res) => {
  try {
    const posts = await Post.findAll({
      order: [["createdAt", "DESC"]],
    });

    const paymentMethods = await PaymentMethod.findAll({
      where: { status: "active" },
    });

    const paymentMap = {};
    paymentMethods.forEach(pm => {
      paymentMap[pm.id] = pm.name;
    });

    const formattedPosts = posts.map(post => {
      const data = post.toJSON();

      // 🔹 Parse if stored as string (temporary fix)
      if (typeof data.pricing === "string") {
        data.pricing = JSON.parse(data.pricing);
      }

      if (typeof data.images === "string") {
        data.images = JSON.parse(data.images);
      }

      // 🔹 Expand pricing with name
      data.pricing = data.pricing.map(p => ({
        paymentMethodId: p.paymentMethodId,
        name: paymentMap[p.paymentMethodId] || null,
        value: p.value,
      }));

      return data;
    });

    res.json(formattedPosts);

  } catch (error) {
    res.status(500).json({
      message: "Error fetching posts",
      error: error.message,
    });
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
    const {
      removeImages,
      addPricing,
      removePricingIds,
      updatePricing,
      detail,
      status,
    } = req.body;

    const post = await Post.findByPk(id);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // -------------------------
    // Ensure arrays (safe parsing)
    // -------------------------
    let images = Array.isArray(post.images)
      ? post.images
      : JSON.parse(post.images || "[]");

    let pricing = Array.isArray(post.pricing)
      ? post.pricing
      : JSON.parse(post.pricing || "[]");

    // =====================================================
    // 🖼 REMOVE IMAGES
    // =====================================================
    if (removeImages) {
      const toRemove = JSON.parse(removeImages);

      images = images.filter((img) => !toRemove.includes(img));

      deleteImages(toRemove);
    }

    // =====================================================
    // 🖼 ADD NEW IMAGES
    // =====================================================
    if (req.files && req.files.length > 0) {
      const newImages = req.files.map((f) => f.filename);
      images = [...images, ...newImages];
    }

    post.images = images;

    // =====================================================
    // 💰 REMOVE PRICING
    // =====================================================
    if (removePricingIds) {
      const ids = JSON.parse(removePricingIds);

      pricing = pricing.filter(
        (p) => !ids.includes(p.paymentMethodId)
      );
    }

    // =====================================================
    // 💰 UPDATE PRICING VALUE
    // =====================================================
    if (updatePricing) {
      const updates = JSON.parse(updatePricing);

      pricing = pricing.map((p) => {
        const found = updates.find(
          (u) => u.paymentMethodId === p.paymentMethodId
        );
        return found ? { ...p, value: found.value } : p;
      });
    }

    // =====================================================
    // 💰 ADD PRICING (NO DUPLICATES — STRONG VERSION)
    // =====================================================
    if (addPricing) {
      const newPricing = JSON.parse(addPricing);

      // Remove duplicates inside newPricing itself
      const uniqueNewPricing = [];
      const seen = new Set();

      for (const p of newPricing) {
        if (
          p.paymentMethodId &&
          p.value !== undefined &&
          !isNaN(p.value) &&
          !seen.has(p.paymentMethodId)
        ) {
          seen.add(p.paymentMethodId);
          uniqueNewPricing.push(p);
        }
      }

      // Prevent duplicates against existing pricing
      const existingIds = pricing.map(p => p.paymentMethodId);

      const filteredNewPricing = uniqueNewPricing.filter(
        p => !existingIds.includes(p.paymentMethodId)
      );

      pricing = [...pricing, ...filteredNewPricing];
    }

    post.pricing = pricing;

    // =====================================================
    // Other fields
    // =====================================================
    if (detail !== undefined) post.detail = detail;
    if (status) post.status = status;

    await post.save();

    res.json(post);

  } catch (error) {
    res.status(500).json({
      message: "Error updating post",
      error: error.message,
    });
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

const safeParse = (value) => {
  try {
    return value ? JSON.parse(value) : [];
  } catch {
    return [];
  }
};

exports.getPostsByItem = async (req, res) => {
  try {
    const { itemId } = req.params;

    const posts = await Post.findAll({
      where: {
        itemId,
        // status: "post",
      },
      order: [["createdAt", "DESC"]],
    });

    // 🔹 Normalize JSON fields
    const formattedPosts = posts.map((post) => {
      const postData = post.toJSON();

      return {
        ...postData,
        pricing: Array.isArray(postData.pricing)
          ? postData.pricing
          : safeParse(postData.pricing),

        images: Array.isArray(postData.images)
          ? postData.images
          : safeParse(postData.images),
      };
    });

    res.json(formattedPosts);

  } catch (error) {
    res.status(500).json({
      message: "Error fetching posts by item",
      error: error.message,
    });
  }
};


