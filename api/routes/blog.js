const express = require("express");
const router = express.Router();
const {
  authenticateToken,
  verifyAdminRole,
} = require("../middlewares/authenticateToken");
const blogService = require("../services/blog");

router.post(
  "/post",
  [authenticateToken, verifyAdminRole],
  async function (req, res) {
    try {
      const { title, content } = req.body;
      const { id } = await blogService.createPost(title, content, req.user.id);
      res.status(201).json({ id, message: "Post created successfully" });
    } catch (err) {
      console.error(`Error during post creation:`, err.message);
      res.status(err.statusCode || 500).json({ message: err.message });
    }
  }
);

module.exports = router;
