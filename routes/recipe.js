const express = require("express");
const router = express.Router();
const upload = require("../middleware/multer");
const recipesController = require("../controllers/recipe");
const { ensureAuth } = require("../middleware/auth");

//Post Routes
//Since linked from server js treat each path as:
//post/:id, post/createPost, post/likePost/:id, post/deletePost/:id
router.get("/:id", ensureAuth, recipesController.getRecipe);

//Enables user to create post w/ cloudinary for media uploads
router.post("/createRecipe", upload.single("file"), recipesController.createRecipe);


//Enables user to favorite the post. If its pressed again, it removes the favorite.
router.put("/toggleFavorite/:id", recipesController.toggleFavorite);


//Enables user to like post. If its liked again, it removes the like.
router.put("/toggleLike/:id", recipesController.toggleLike);


//Enables user to delete post. In controller, uses POST model to delete post from MongoDB collection.
router.delete("/deleteRecipe/:id", recipesController.deleteRecipe);


module.exports = router;
