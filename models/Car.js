const mongoose = require("mongoose");

const carSchema = new mongoose.Schema({
  userId: String,
  model: String,
  modelYear: String,
  make: String,
  description: String,
  price: Number,
  contact: String,
  engine: String,
  milage: String,
  address: String,
  city: String,
  registeredCity: String,
  color: String,
  isFeatured: Boolean,
  createdAt: Date,
  carImages: [String],
});

const Car = mongoose.model("Car", carSchema);

module.exports = Car;
