require("dotenv").config();
const express = require("express");
const cors = require("cors");

const { connectDB } = require("./config/database");
const models = require("./models");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => res.json({ message: "Ecommerce API" }));
 
const start = async () => {
  try {
    await connectDB();
    await models.sequelize.sync();
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
  } catch (err) {
    console.error("❌ Failed to start server:", err);
    process.exit(1);
  }
};

if (require.main === module) start();

module.exports = app;
