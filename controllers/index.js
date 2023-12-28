module.exports = {
  getIndex: (req, res) => {
    res.render("index.ejs");
  },
};

// module.exports = {
//   getIndex: (req, res) => {
//     try {
//       res.render("index.ejs");
//     } catch (error) {
//       console.error(error);
//       res.status(500).send("Internal Server Error");
//     }
//   },
// };


