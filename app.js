const express = require("express");
const path = require("path");
const session = require("express-session");
const mongoose = require("mongoose");
require("dotenv").config();

mongoose.connect(process.env.MONGO_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log("✅ Connected to MongoDB")
}).catch((err) => {
  console.error("❌ MongoDB connection error:", err);
});

const app = express();
const PORT = process.env.PORT || 3000;

// --- View engine ---
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// --- Middleware ---
app.use(express.urlencoded({extended: true}));
app.use(express.static("public"));
app.use(session({
    secret: "mySecretKey",
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 1000 * 60 * 60,
    },
  }));

// ---Admin Routes ---
const adminRoutes = require("./routes/adminRoutes");

app.use("/admin", adminRoutes);

// --- User Routes ---
const userRoutes = require("./routes/userRoutes");
app.use("/", userRoutes);


app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

