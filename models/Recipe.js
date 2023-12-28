const mongoose = require("mongoose");

const RecipeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  image: {
    type: String,
    require: true,
  },
  cloudinaryId: {
    type: String,
    require: true,
  },
  ingredients: {
    type: String,
    required: true,
  },
  directions: {
    type: String,
    required: true,
  },
  likes: {
    type: Number,
    default: 0  
  },
  isDeleted: {
    type: Boolean,
    default: false,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  
  likedBy: [{ 
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User' 
  }] 
});

//MongoDB Collection named here - will give lowercase plural of name 
module.exports = mongoose.model("Recipe", RecipeSchema);
