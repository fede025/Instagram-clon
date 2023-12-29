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
      //id parameter comes from the post routes
      //router.get("/:id", ensureAuth, postsController.getPost);
      //http://localhost:2121/post/631a7f59a3e56acfc7da286f
      //id === 631a7f59a3e56acfc7da286f
      const recipe = await Recipe.findById(req.params.id);
      let heartIconClass = "far fa-heart"; // Initial heart icon class (void)
      let likeTextContent = "Like"; // Initial like text content
      
    // Assuming this code is inside the getRecipe function of your recipesController
    res.render("recipe.ejs",
    {
      recipe: recipe,
      user: req.user,
      heartIconClass: 'far fa-heart', // Initial heart icon class (void)
      likeTextContent: 'Like' // Initial like text content
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
 


  ////////////// need to change this to toggleFavorite /////////////
  favoriteRecipe: async (req, res) => {
    try {
      const userId = req.user.id; // Assuming you have user information stored in req.user

      // Check if the user has already favorited the recipe
      const existingFavorite = await Favorite.findOne({ user: userId, recipe: req.params.id });

      if (!existingFavorite) {
        // If the user hasn't already favorited the recipe, add it to favorites
        await Favorite.create({
          user: userId,
          recipe: req.params.id,
        });
        console.log("Favorite has been added!");
      } else {
        console.log("Recipe is already in favorites");
        // You can send a message or perform an action to inform the user that the recipe is already in their favorites
      }

      res.redirect(`/recipe/${req.params.id}`);
    } catch (err) {
      console.error(err);
      res.status(500).send("Internal server error");
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
  

  deleteFavorite: async (req, res) => {
    try {
      // Find favorite by id
      let foundFavorite = await Favorite.findById(req.params.id);
  
      if (!foundFavorite) {
        // If the favorite doesn't exist, handle the case accordingly
        return res.redirect("/profile");
      }
  
      // Delete favorite from db
      await Favorite.deleteOne({ _id: req.params.id });
      console.log("Deleted Favorite");
  
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
