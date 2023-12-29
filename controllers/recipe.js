const cloudinary = require("../middleware/cloudinary");
const Recipe = require("../models/Recipe");
const Favorite = require("../models/Favorite");

module.exports = {

  getProfile: async (req, res) => { 
    console.log(req.user)
    try {
      //Since we have a session each request (req) contains the logged-in users info: req.user
      //console.log(req.user) to see everything
      //Grabbing just the posts of the logged-in user
      const recipes = await Recipe.find({ user: req.user.id });
      //Sending post data from mongodb and user data to ejs template
      res.render("profile.ejs", { recipes: recipes, user: req.user });
    } catch (err) {
      console.log(err);
    }
  },



  getFavorites: async (req, res) => { 
    console.log(req.user)
    try {
      //Since we have a session each request (req) contains the logged-in users info: req.user
      //console.log(req.user) to see everything
      //Grabbing just the posts of the logged-in user
      const recipes = await Favorite.find({ user: req.user.id }).populate('recipe');

      console.log(recipes)

      //Sending post data from mongodb and user data to ejs template
      res.render("favorites.ejs", { recipes: recipes, user: req.user });
    } catch (err) {
      console.log(err);
    }
  },



  getRecipe: async (req, res) => {
    try {
      const recipe = await Recipe.findById(req.params.id);
  

      if (!recipe) {
        // Handle the case when the recipe is not found
        return res.redirect("/feed");
      }
      
      // Assuming req.user contains the current user's information
      const userId = req.user.id;
  
      // Check if the current user has liked this recipe
      const isLiked = recipe.likedBy.includes(userId);

      // Check if the current user has favorited this recipe
      const isFavorited = await Favorite.exists({ user: userId, recipe: req.params.id });
  
      res.render("recipe.ejs", {
        recipe: recipe,
        user: req.user,
        isLiked: isLiked, // Pass the isLiked value to the template
        isFavorited: isFavorited, // Pass the isFavorited value to the template
      });
    } catch (err) {
      console.log(err);
    }
  },
  

 
  createRecipe: async (req, res) => {
    try {
      // Upload image to cloudinary
      const result = await cloudinary.uploader.upload(req.file.path);

      //media is stored on cloudainary - the above request responds with url to media and the media id that you will need when deleting content 
      await Recipe.create({
        name: req.body.name,
        image: result.secure_url,
        cloudinaryId: result.public_id,
        ingredients: req.body.ingredients,
        directions: req.body.directions,
        likes: 0,
        user: req.user.id,
      });
      console.log("Post has been added!");
      res.redirect("/profile");
    } catch (err) {
      console.log(err);
    }
  },
 
  
  
  deleteRecipe: async (req, res) => {
    try {
      // Find post by id
      let recipe = await Recipe.findById(req.params.id);
  
      if (!recipe) {
        // If the recipe doesn't exist, handle the case accordingly
        return res.redirect("/profile");
      }
  
      // Delete image from cloudinary
      await cloudinary.uploader.destroy(recipe.cloudinaryId);
      
      // Delete post from db
      await Recipe.deleteOne({ _id: req.params.id });
      console.log("Deleted Recipe");

      // Delete related favorites
      await Favorite.deleteMany({ recipeId: req.params.id }); // Assuming 'recipeId' is the field representing the recipe in favorites

      res.redirect("/profile");      
    } catch (err) {
      console.error(err);
      res.redirect("/profile");
    }
  },
  



  getFeed: async (req, res) => {
    try {
      const recipe = await Recipe.find().sort({ createdAt: "desc" }).lean();
      res.render("feed.ejs", { recipes: recipe });
    } catch (err) {
      console.log(err);
    }
  },



  
  toggleFavorite: async (req, res) => {
    try {
      const userId = req.user.id;
      const recipeId = req.params.id;
  
     // Check if the user has already favorited the recipe
      const existingFavorite = await Favorite.findOne({ user: userId, recipe: recipeId });
  
      // If the recipe is already favorited, remove it from favorites
      if (existingFavorite) {
        await Favorite.deleteOne({ _id: existingFavorite._id });
        console.log("Favorite has been removed!");
      } else {
        // If the recipe is not favorited, add it to favorites
        await Favorite.create({
          user: userId,
          recipe: recipeId,
        });
        console.log("Favorite has been added!");
      }
  
      res.redirect(`/recipe/${recipeId}`);
    } catch (err) {
      console.error(err);
      res.status(500).send("Internal server error");
    }
  },



  
  
  


  toggleLike: async (req, res) => {
    try {
      const userId = req.user._id; // Assuming you have user information stored in req.user
            
      const recipe = await Recipe.findById(req.params.id);

      if (!recipe) {
        console.log("Recipe not found");
        return res.redirect("/feed");
      }

      const alreadyLiked = recipe.likedBy.includes(userId);

      if (alreadyLiked) {
        // Remove the user's like
        await Recipe.findByIdAndUpdate(
          req.params.id,
          {
            $pull: { likedBy: userId },
            $inc: { likes: -1 },
          },
          { new: true }
        );
        console.log("Recipe unliked");
      } else {
        // Add the user's like
        await Recipe.findByIdAndUpdate(
          req.params.id,
          {
            $push: { likedBy: userId },
            $inc: { likes: 1 },
          },
          { new: true }
        );
        console.log("Recipe liked");
      }

      res.redirect(`/recipe/${req.params.id}`);
    
    } catch (err) {
      console.error(err);
      res.status(500).send("Internal server error");
    }
  },
}



/////////////////////////////////// when deleting a recipe, delete the favorites as well as the recipe.