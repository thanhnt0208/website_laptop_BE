const express = require('express');
const router = express.Router();
const postController = require('../controllers/baiviet.controller');

// Route cho admin
router.get('/admin', postController.adminGetAllPosts);
router.put('/admin/:id/visibility', postController.toggleVisibility);
router.post('/admin', postController.createPost);            
router.put('/admin/:id', postController.updatePost); 

module.exports = router;
