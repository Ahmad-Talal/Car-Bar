const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  email: String,
  contactNumber: String,
  password: String,
  salt: String,
});

const User = mongoose.model("User", userSchema);

module.exports = User;
