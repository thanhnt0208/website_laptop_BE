const express = require('express');
const router = express.Router();
const postsController = require('../controllers/posts.controller');

// Danh sách bài viết: /api/posts/posts
router.get('/posts', postsController.getAllPosts);

// Chi tiết bài viết: /api/posts/:id
router.get('/:id', postsController.getPostById);

module.exports = router;
