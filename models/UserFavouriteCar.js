const mongoose = require("mongoose");

const userFavCarSchema = new mongoose.Schema({
  carId: String,
  userId: String,
});

const UserFavouriteCar = mongoose.model("UserFavouriteCar", userFavCarSchema);

module.exports = UserFavouriteCar;
