const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const { connectDB } = require("./config/database");
const models = require("./models");
const routes = require("./routes"); 
const path = require("path");



const app = express();

app.use(
  helmet({
    crossOriginResourcePolicy: false,
  })
);

app.use(cors());
app.use(express.json());

// Serve static files from the "uploads" directory
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.get("/", (req, res) => res.json({ message: "Ecommerce API" }));

app.use("/api", routes);  



const start = async () => {
  try {
    await connectDB();

    await models.sequelize.sync({ alter: false });
    console.log("✅ Database synced with alter:true");

    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
  } catch (err) {
    console.error("❌ Failed to start server:", err);
    process.exit(1);
  }
};

if (require.main === module) start();

module.exports = app;
