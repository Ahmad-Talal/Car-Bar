const mongoose = require("mongoose");

const carBrandSchema = new mongoose.Schema({
  name: String,
});

const CarBrand = mongoose.model("CarBrand", carBrandSchema);

module.exports = CarBrand;
