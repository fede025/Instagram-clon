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
      res.render("recipe.ejs", { recipe: recipe, user: req.user});
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


  likeRecipe: async (req, res) => {
    try {
      const userId = req.user._id; // Assuming you have user information stored in req.user
  
      // Check if the user has already liked the recipe
      const recipe = await Recipe.findOne({ _id: req.params.id, likedBy: userId });
  
      if (!recipe) {
        // If the user hasn't already liked the recipe, increment the likes count and mark the user as liked
        await Recipe.findOneAndUpdate(
          { _id: req.params.id },
          {
            $inc: { likes: 1 },
            $push: { likedBy: userId }, // Assuming there's a field 'likedBy' to track users who liked the recipe
          }
        );
        console.log("Likes +1");
      } else {
        console.log("User already liked this recipe");
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



  // deleteFavorite: async (req, res) => {
  //   try {
  //     // Find post by id
  //     let Favorite = await Favorite.findById({ _id: req.params.id });
  //     // Delete post from db
  //     await Favorite.deleteOne({ _id: req.params.id });
  //     console.log("Deleted Favorite");
  //     res.redirect("/profile");
  //   } catch (err) {
  //     res.redirect("/profile");
  //   }
  // },


  getFeed: async (req, res) => {
    try {
      const recipe = await Recipe.find().sort({ createdAt: "desc" }).lean();
      res.render("feed.ejs", { recipes: recipe });
    } catch (err) {
      console.log(err);
    }
  }
};







/////////////TO DO THINGS:

// ///////// Having problems with deleting the favorites.

// We could add in the model the option to be deleted in true or false, by default it is false, but when we delete a recipe, we need to set it to true. And if it is true the getFavorite function will not show it.


/// well a few problems, we are not activating the deleteFavorite i think. We need a button to delete the favorite.

// and then, if they delete the recipe, it should activate the deleteFavorite too.








////////////////ALREADY FIXED:
/// LIKES PROBLEM: the problem here is in the backend i guess, because we need to not be able to like it twice, or fav it twice. 
/// so we could teoretically fix it by not showing it in the front, but the real problem is in the backend. If we fix that, everything goes well after.
/// ADD: make sure the same user cant like the same recipe twice, or fav the same recipe twice.

//////////////////////////////////////////////////// FIXED








// // Example function to toggle isFavorited field for a recipe
// async function toggleFavorite(recipeId, isCurrentlyFavorited) {
//   try {
//     const recipe = await Recipe.findById(recipeId);
//     if (!recipe) {
//       throw new Error('Recipe not found');
//     }

//     // Toggle isFavorited field based on its current state
//     recipe.isFavorited = !isCurrentlyFavorited;

//     // Save the updated recipe to the database
//     await recipe.save();
//     console.log(`Recipe ${recipeId} favorited status updated`);
//   } catch (error) {
//     console.error(error.message);
//   }
// }