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
      const { id } = await blogService.createPost(req.body, req.user.id);
      res.status(201).json({ id, message: "Post created successfully" });
    } catch (err) {
      console.error(`Error during post creation:`, err.message);
      res.status(err.statusCode || 500).json({ message: err.message });
    }
  }
);

router.delete(
  "/post/:id",
  [authenticateToken, verifyAdminRole],
  async function (req, res) {
    try {
      await blogService.deletePost(req.params.id);
      res.status(204).end();
    } catch (err) {
      console.error(`Error during post deletion:`, err.message);
      res.status(err.statusCode || 500).json({ message: err.message });
    }
  }
);

router.put(
  "/post/:id",
  [authenticateToken, verifyAdminRole],
  async function (req, res) {
    try {
      const { id } = await blogService.editPost(req.params.id, req.body);
      res.status(200).json({ id, message: "Post updated successfully" });
    } catch (err) {
      console.error(`Error during post edit:`, err.message);
      res.status(err.statusCode || 500).json({ message: err.message });
    }
  }
);

router.get("/posts", async function (req, res) {
  try {
    const posts = await blogService.listPosts();
    res.status(200).json(posts);
  } catch (err) {
    console.error(`Error during posts retrieval:`, err.message);
    res.status(err.statusCode || 500).json({ message: err.message });
  }
});

router.get("/post/:id", async function (req, res) {
  try {
    const post = await blogService.showPostDetails(req.params.id);
    res.status(200).json(post);
  } catch (err) {
    console.error(`Error during post retrieval:`, err.message);
    res.status(err.statusCode || 500).json({ message: err.message });
  }
});

module.exports = router;
