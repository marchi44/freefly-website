const jwt = require("jsonwebtoken");
const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");
const User = require("./User");

const router = express.Router();


router.use(cors());
router.use(bodyParser.urlencoded({ extended: true }));
router.use(bodyParser.json());

mongoose
  .connect("mongodb+srv://arturvascuk_db_user:MUNG8BZPjcWModiq@pirmas.x8uek3d.mongodb.net/")
  .then(() => console.log("Mongo veikia"))
  .catch((err) => console.error("Mongo neveikia", err));

router.post("/register", async (req, res) => {
  try {
    const { name, surname, dob, email, password } = req.body;

    if (!name || !surname || !dob || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Check if email already exists
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: "Email already in use" });
    }

    const newUser = new User({
      name,
      surname,
      dob,          // frontend will send e.g. "2005-12-31"
      email,
      password      // (for a real app you should hash this)
    });

    await newUser.save();
    return res.json({ message: "User registered successfully" });
  } catch (err) {
    console.error("Error in /register:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email, password });
    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const token = jwt.sign(
        { id: user._id },
        "secretkey",   // MUST match auth middleware
        { expiresIn: "2h" }
    );

    res.json({
      message: "Login successful",
      token
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
