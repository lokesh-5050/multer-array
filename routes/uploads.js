const mongoose = require("mongoose");
mongoose.connect("mongodb://localhost/ppst");

const imageSchema = new mongoose.Schema({
  imageName: String,
});

module.exports = mongoose.model("uploads", imageSchema);
