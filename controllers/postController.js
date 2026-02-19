const Post = require("../models/post");
const Item = require("../models/item");
const PaymentMethod = require("../models/paymentMethod");
const Category = require("../models/category");
const SubCategory = require("../models/subCategory");
const fs = require("fs");
const path = require("path");
const BASE_URL = process.env.BASE_URL || "http://localhost:5000";


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
      return res.status(400).json({ message: "Pricing must be valid JSON" });
    }

    if (!Array.isArray(pricingArray) || pricingArray.length === 0) {
      return res.status(400).json({ message: "Pricing must be a non-empty array" });
    }

    // 🔹 Validate structure
    const ids = [];
    for (const entry of pricingArray) {
      if (!entry.paymentMethodId || entry.value === undefined || entry.value === null) {
        return res.status(400).json({
          message: "Each pricing entry must contain paymentMethodId and value",
        });
      }

      if (isNaN(entry.value)) {
        return res.status(400).json({ message: "Pricing value must be numeric" });
      }

      ids.push(entry.paymentMethodId);
    }

    // 🔹 Prevent duplicates
    if (new Set(ids).size !== ids.length) {
      return res.status(400).json({ message: "Duplicate paymentMethodId detected" });
    }

    // 🔹 Validate payment methods in ONE query
    const validMethods = await PaymentMethod.findAll({
      where: { id: ids, status: "active" },
    });

    if (validMethods.length !== ids.length) {
      return res.status(400).json({
        message: "One or more payment methods are invalid or inactive",
      });
    }

    // 🔹 Handle images: move to uploads/post
    let images = [];
    if (req.files && req.files.length > 0) {
      const postFolder = path.join(__dirname, "../uploads/post");
      if (!fs.existsSync(postFolder)) fs.mkdirSync(postFolder, { recursive: true });

      images = req.files.map(file => {
        const oldPath = file.path; // uploaded by multer to uploads/
        const newPath = path.join(postFolder, file.filename);
        fs.renameSync(oldPath, newPath); // move file to uploads/post
        return `uploads/post/${file.filename}`; // store path in DB
      });
    }

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

exports.getPosts = async (req, res) => {
  try {
    const posts = await Post.findAll({
      order: [["createdAt", "DESC"]],
      attributes: { exclude: ["itemId", "updatedAt"] },
      include: [{
          model: Item,
          attributes: {
            exclude: [
              "createdAt",
              "updatedAt",
              "categoryId",
              "subCategoryId",
              "status",
              "minQuantity",
              "featured",
              "featuredUntil",
            ],
          },
          include: [
            {
              model: Category,
              attributes: { exclude: ["createdAt", "updatedAt"] },
            },
            {
              model: SubCategory,
              attributes: { exclude: ["createdAt", "updatedAt", "categoryId"] },
            },
          ],
        },]
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

      // 🔹 Parse pricing if stored as string
      if (typeof data.pricing === "string") {
        data.pricing = JSON.parse(data.pricing);
      }

      // 🔹 Parse images if stored as string
      if (typeof data.images === "string") {
        data.images = JSON.parse(data.images);
      }

      // 🔹 Convert image paths to full URLs
      if (Array.isArray(data.images)) {
        data.images = data.images.map(img => {
          // Handle if img is already a full URL
          if (img.startsWith("http://") || img.startsWith("https://")) return img;
          return `${BASE_URL}/${img}`; // adjust /uploads/ if your folder is different
        });
      }

      // 🔹 Expand pricing with payment method name
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

exports.getPostById = async (req, res) => {
  try {
    const { id } = req.params;

    // Fetch post
    const post = await Post.findByPk(id,{
      attributes: { exclude: ["itemId", "updatedAt"] },
         include: [{
          model: Item,
          attributes: {
            exclude: [
              "createdAt",
              "updatedAt",
              "categoryId",
              "subCategoryId",
              "status",
              "minQuantity",
              "featured",
              "featuredUntil",
            ],
          },
          include: [
            {
              model: Category,
              attributes: { exclude: ["createdAt", "updatedAt"] },
            },
            {
              model: SubCategory,
              attributes: { exclude: ["createdAt", "updatedAt", "categoryId"] },
            },
          ],
        },]
    });
    if (!post) return res.status(404).json({ message: "Post not found" });

    const data = post.toJSON();

    // Parse pricing if stored as string
    if (typeof data.pricing === "string") {
      data.pricing = JSON.parse(data.pricing);
    }

    // Parse images if stored as string
    if (typeof data.images === "string") {
      data.images = JSON.parse(data.images);
    }

    // Convert image paths to full URLs
    if (Array.isArray(data.images)) {
      data.images = data.images.map(img => {
        if (img.startsWith("http://") || img.startsWith("https://")) return img;
        return `${BASE_URL}/${img}`; 
      });
    }

    // Fetch payment methods to expand pricing
    const paymentMethods = await PaymentMethod.findAll({
      where: { status: "active" },
    });

    const paymentMap = {};
    paymentMethods.forEach(pm => {
      paymentMap[pm.id] = pm.name;
    });

    // Expand pricing with payment method name
    if (Array.isArray(data.pricing)) {
      data.pricing = data.pricing.map(p => ({
        paymentMethodId: p.paymentMethodId,
        name: paymentMap[p.paymentMethodId] || null,
        value: p.value,
      }));
    }

    res.json(data);
    
  } catch (error) {
    res.status(500).json({ message: "Error fetching post", error: error.message });
  }
};

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
    if (!post) return res.status(404).json({ message: "Post not found" });

    // -------------------------
    // Safe parse stored arrays
    // -------------------------
    let images = Array.isArray(post.images)
      ? post.images
      : JSON.parse(post.images || "[]");

    let pricing = Array.isArray(post.pricing)
      ? post.pricing
      : JSON.parse(post.pricing || "[]");

    // =============================
    // REMOVE IMAGES
    // =============================
    if (removeImages) {
      const toRemove = JSON.parse(removeImages);
      images = images.filter(img => !toRemove.includes(img));
      deleteImages(toRemove);
    }

    // =============================
    // ADD NEW IMAGES
    // =============================
    if (req.files && req.files.length > 0) {
      const postFolder = path.join(__dirname, "../uploads/post");
      if (!fs.existsSync(postFolder))
        fs.mkdirSync(postFolder, { recursive: true });

      const newImages = req.files.map(file => {
        const oldPath = file.path;
        const newPath = path.join(postFolder, file.filename);
        fs.renameSync(oldPath, newPath);
        return `uploads/post/${file.filename}`;
      });

      images = [...images, ...newImages];
    }

    // Store (still as array — Sequelize will stringify if TEXT)
    post.images = images;
    post.pricing = pricing;

    if (detail !== undefined) post.detail = detail;
    if (status) post.status = status;

    await post.save();

    // =============================
    // 🔥 RE-FETCH LIKE GET
    // =============================
    const updatedPost = await Post.findByPk(id, {
      attributes: { exclude: ["itemId", "updatedAt"] },
      include: [
        {
          model: Item,
          attributes: {
            exclude: [
              "createdAt",
              "updatedAt",
              "categoryId",
              "subCategoryId",
              "status",
              "minQuantity",
              "featured",
              "featuredUntil",
            ],
          },
          include: [
            {
              model: Category,
              attributes: { exclude: ["createdAt", "updatedAt"] },
            },
            {
              model: SubCategory,
              attributes: { exclude: ["createdAt", "updatedAt", "categoryId"] },
            },
          ],
        },
      ],
    });

    const data = updatedPost.toJSON();

    // =============================
    // 🔥 THIS FIXES YOUR ISSUE
    // =============================
    if (typeof data.images === "string") {
      data.images = JSON.parse(data.images);
    }

    if (typeof data.pricing === "string") {
      data.pricing = JSON.parse(data.pricing);
    }

    // Convert images to full URLs
    if (Array.isArray(data.images)) {
      data.images = data.images.map(img => {
        if (img.startsWith("http")) return img;
        return `${BASE_URL}/${img}`;
      });
    }

    // Expand pricing with payment name
    const paymentMethods = await PaymentMethod.findAll({
      where: { status: "active" },
    });

    const paymentMap = {};
    paymentMethods.forEach(pm => {
      paymentMap[pm.id] = pm.name;
    });

    if (Array.isArray(data.pricing)) {
      data.pricing = data.pricing.map(p => ({
        paymentMethodId: p.paymentMethodId,
        name: paymentMap[p.paymentMethodId] || null,
        value: p.value,
      }));
    }

    res.json(data);

  } catch (error) {
    res.status(500).json({
      message: "Error updating post",
      error: error.message,
    });
  }
};

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
        status,
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

exports.filterPosts = async (req, res) => {
  try {
    const { itemId, status, categoryId, subCategoryId } = req.query;

    // 🔹 Post-level filter
    const postWhere = {};
    if (itemId) postWhere.itemId = itemId;
    if (status) postWhere.status = status;

    // 🔹 Item-level filter (nested)
    const itemWhere = {};
    if (categoryId) itemWhere.categoryId = categoryId;
    if (subCategoryId) itemWhere.subCategoryId = subCategoryId;

    const posts = await Post.findAll({
      where: postWhere,
      order: [["createdAt", "DESC"]],
      attributes: { exclude: ["itemId", "updatedAt"] },
      include: [
        {
          model: Item,
          where: Object.keys(itemWhere).length ? itemWhere : undefined,
          attributes: {
            exclude: [
              "createdAt",
              "updatedAt",
              "categoryId",
              "subCategoryId",
              "status",
              "minQuantity",
              "featured",
              "featuredUntil",
            ],
          },
          include: [
            {
              model: Category,
              attributes: { exclude: ["createdAt", "updatedAt"] },
            },
            {
              model: SubCategory,
              attributes: { exclude: ["createdAt", "updatedAt", "categoryId"] },
            },
          ],
        },
      ],
    });

    // 🔹 Get active payment methods
    const paymentMethods = await PaymentMethod.findAll({
      where: { status: "active" },
    });

    const paymentMap = {};
    paymentMethods.forEach((pm) => {
      paymentMap[pm.id] = pm.name;
    });

    // 🔹 Format response (same logic as your getPosts)
    const formattedPosts = posts.map((post) => {
      const data = post.toJSON();

      // Parse pricing
      if (typeof data.pricing === "string") {
        data.pricing = JSON.parse(data.pricing);
      }

      // Parse images
      if (typeof data.images === "string") {
        data.images = JSON.parse(data.images);
      }

      // Convert image paths to full URLs
      if (Array.isArray(data.images)) {
        data.images = data.images.map((img) => {
          if (img.startsWith("http://") || img.startsWith("https://"))
            return img;
          return `${BASE_URL}/${img}`;
        });
      }

      // Expand pricing
      if (Array.isArray(data.pricing)) {
        data.pricing = data.pricing.map((p) => ({
          paymentMethodId: p.paymentMethodId,
          name: paymentMap[p.paymentMethodId] || null,
          value: p.value,
        }));
      }

      return data;
    });

    return res.status(200).json(formattedPosts);

  } catch (error) {
    return res.status(500).json({
      message: "Error filtering posts",
      error: error.message,
    });
  }
};

const { Op, literal } = require("sequelize");

exports.searchPosts = async (req, res) => {
  try {
    const {
      name,
      minPrice,
      maxPrice,
      categoryId,
      subCategoryId,
      paymentMethodId,
    } = req.query;

    const itemWhere = {};
    let matchCountLiteral = null;

    // ✅ Flexible multi-word search with match count
    if (name) {
      const words = name
        .trim()
        .split(/\s+/)
        .filter(Boolean);

      // OR condition for filtering
      itemWhere[Op.or] = words.map((word) => ({
        name: { [Op.like]: `%${word}%` },
      }));

      // For sorting: count how many words match
      // MySQL: sum of matches using CASE
      const cases = words
        .map(
          (word) => `CASE WHEN Item.name LIKE '%${word}%' THEN 1 ELSE 0 END`
        )
        .join(" + ");

      matchCountLiteral = literal(`(${cases})`);
    }

    if (categoryId) {
      itemWhere.categoryId = categoryId;
    }

    if (subCategoryId) {
      itemWhere.subCategoryId = subCategoryId;
    }

    // Fetch posts with associated items
    const posts = await Post.findAll({
      attributes: { exclude: ["itemId", "updatedAt"] },
      include: [
        {
          model: Item,
          where: itemWhere,
          attributes: {
            exclude: [
              "createdAt",
              "updatedAt",
              "categoryId",
              "subCategoryId",
              "status",
              "minQuantity",
              "featured",
              "featuredUntil",
            ],
          },
          include: [
            { model: Category, attributes: { exclude: ["createdAt", "updatedAt"] } },
            { model: SubCategory, attributes: { exclude: ["createdAt", "updatedAt", "categoryId"] } },
          ],
        },
      ],
      // ✅ Order by match count if available
      order: matchCountLiteral
        ? [[matchCountLiteral, "DESC"], ["createdAt", "DESC"]]
        : [["createdAt", "DESC"]],
    });

    // Get active payment methods
    const paymentMethods = await PaymentMethod.findAll({
      where: { status: "active" },
    });

    const paymentMap = {};
    paymentMethods.forEach((pm) => (paymentMap[pm.id] = pm.name));

    // Format posts
    const formattedPosts = posts
      .map((post) => {
        const data = post.toJSON();

        if (typeof data.pricing === "string") {
          try {
            data.pricing = JSON.parse(data.pricing);
          } catch {
            data.pricing = [];
          }
        }

        if (!Array.isArray(data.pricing)) data.pricing = [];

        if (typeof data.images === "string") {
          try {
            data.images = JSON.parse(data.images);
          } catch {
            data.images = [];
          }
        }

        if (Array.isArray(data.images)) {
          data.images = data.images
            .map((img) => {
              if (!img) return null;
              if (img.startsWith("http://") || img.startsWith("https://"))
                return img;
              return `${BASE_URL}/${img}`;
            })
            .filter(Boolean);
        }

        // Filter pricing by min/max/paymentMethod
        let pricing = data.pricing;

        if (minPrice) {
          pricing = pricing.filter((p) => Number(p.value) >= Number(minPrice));
        }

        if (maxPrice) {
          pricing = pricing.filter((p) => Number(p.value) <= Number(maxPrice));
        }

        if (paymentMethodId) {
          pricing = pricing.filter((p) => p.paymentMethodId == paymentMethodId);
        }

        // Attach payment name
        pricing = pricing.map((p) => ({
          paymentMethodId: p.paymentMethodId,
          name: paymentMap[p.paymentMethodId] || null,
          value: p.value,
        }));

        data.pricing = pricing;

        return data;
      })
      .filter((post) => post.pricing.length > 0);

    res.json(formattedPosts);
  } catch (error) {
    res.status(500).json({
      message: "Error searching posts",
      error: error.message,
    });
  }
};


