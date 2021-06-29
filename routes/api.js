const express = require("express");
const Car = require("../models/Car");
const CarBrand = require("../models/CarBrands");
const User = require("../models/User");
const bcrypt = require("bcrypt");
const authGuard = require("../helpers/auth-guard");
const assignToken = require("../helpers/jwt-helper");
const multer = require("multer");
const path = require("path");
const UserFavouriteCar = require("../models/UserFavouriteCar");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");


const options = multer.diskStorage({
  destination: "./public/data/uploads/",
  filename: function (req, file, cb) {
    cb(
      null,
      (Math.random().toString(36) + "00000000000000000").slice(2, 10) +
      Date.now() +
      path.extname(file.originalname)
    );
  },
});
const upload = multer({ storage: options });

const router = express.Router();
/* GET users listing. */
router.post("/signin", async function (req, res) {
  try {
    const { email, password } = req.body;
    if (!email && !password) {
      return res.status(403).send({
        message: "Invalid params",
      });
    }

    const user = await User.findOne({ email: email });
    if (!user) {
      return res.status(403).send({
        message: "Invalid email and password combination.",
      });
    }
    const hashedPassword = await bcrypt.hash(password, user.salt);

    if (hashedPassword === user.password) {
      const token = assignToken({ email: user.email, _id: user._id });
      res.status(200).send({
        message: "Singed in successfully!",
        token,
      });
    } else {
      return res.status(403).send({
        message: "Invalid email and password combination.",
      });
    }
  } catch (error) {
    return res.status(500).send(error);
  }
});

/* GET users listing. */
router.post("/signup", async function (req, res, next) {
  try {
    const payload = req.body;
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(payload.password, salt);
    const user = await User.create({ ...payload, password: hash, salt });
    const token = assignToken({ email: user.email, _id: user._id });
    res.status(200).send({
      message: "User registerd Successfully",
      token: token,
    });
  } catch (error) {
    return res.status(500).send(error);
  }
});

/* GET users listing. */
router.get("/me", authGuard, async function (req, res) {
  try {
    const { _id } = req.user;
    const user = await User.findById(_id);
    res.status(200).send({
      user,
    });
  } catch (error) {
    return res.status(500).send(error);
  }
});

/* GET users listing. */
router.get("/cars", async function (req, res, next) {
  const cars = await Car.find().sort({ _id: -1 }).lean();
  const authorization = req.headers.authorization;

  const [, token] = authorization.split("Bearer ");
  if (authorization && !authorization.includes("undefined")) {

    const decode = jwt.verify(token, process.env.JWT_SECRET, {});
    if (decode) {
      const userFavCars = await UserFavouriteCar.find({ userId: decode._id }).lean();
      if (!userFavCars.length) {
        return res.send({
          cars
        });
      }
      const carIds = userFavCars.map((item) =>
        mongoose.Types.ObjectId(item.carId)
      );
      const _favCars = await Car.find({
        _id: {
          $in: [...carIds],
        },
      }).lean();

      const _newCars = cars.map(item => {
        // const finded = _favCars.find(_item => item._id == _item._id) || {}

        const finded = _favCars.find((_item) => {
          if (_item._id.toString() == item._id.toString()) {
            return _item
          }
        }) || {}

        if (Object.keys(finded).length) {
          return {
            ...item,
            isFavourite: true
          }
        } else {

          return item
        }
      })

      return res.send({
        cars: _newCars
      })

    }
  }

  res.status(200).send({
    cars: cars,
  });
});

/* GET users listing. */
router.post(
  "/post/car",
  authGuard,
  upload.array("carImages", 12),
  async function (req, res, next) {
    try {
      const payload = req.body;
      const carImages = req.files.map((item) => {
        return item.filename;
      });
      await Car.create({ ...payload, carImages, userId: req.user._id });
      res.status(200).send({
        message: "Sigin route is working...",
      });
    } catch (error) {
      console.log(error);
    }
  }
);

router.put(
  "/post/car/:id",
  authGuard,
  upload.array("carImages", 12),
  async function (req, res, next) {
    try {
      const payload = req.body;
      const { id } = req.params;
      const carImages = req.files.map((item) => {
        return item.filename;
      });
      await Car.findByIdAndUpdate(id, {
        ...payload,
      });
      res.status(200).send({
        message: "Sigin route is working...",
      });
    } catch (error) {
      console.log(error);
    }
  }
);

/* GET users listing. */
router.get("/brands", async function (req, res, next) {
  const brands = await CarBrand.find();
  res.status(200).send({
    brands,
  });
});

/* GET users listing. */
router.post("/post/brand", authGuard, async function (req, res, next) {
  try {
    const { name } = req.body;
    await CarBrand.updateOne(
      {
        name: name,
      },
      {
        $set: {
          name: name,
        },
      },
      { upsert: true }
    );
    res.status(201).send({
      message: "Brand added",
    });
  } catch (error) {
    res.status(500).send(error);
  }
});

router.get("/car/:id", authGuard, async function (req, res) {
  const { id: _id } = req.params;

  const car = await Car.findById(_id).lean();
  if (car) {
    const _res = await UserFavouriteCar.findOne({ userId: req.user._id, carId: car._id }).lean()
    if (_res) {
      return res.status(200).send({
        car: { ...car, isFavourite: true },
      });
    }
  }
  res.status(200).send({
    car,
  });
});

router.post("/mark/fav", authGuard, async function (req, res) {
  const userId = req.user._id;
  const { carId, status } = req.body;

  if (!status) {
    await UserFavouriteCar.remove({
      carId,
      userId,
    });
    return res.send({
      message: "Car removed from your fav list",
    });
  }

  const alreadyFav = await UserFavouriteCar.findOne({
    carId,
    userId,
  });
  if (alreadyFav) {
    return res.send({
      message: "Car is already in your favourite list",
    });
  } else {
    await UserFavouriteCar.create({
      carId,
      userId,
    });
    return res.send({
      message: "Car is added in your favourite list",
    });
  }
});

router.get("/cars/favourite", authGuard, async function (req, res) {
  try {
    const userId = req.user._id;
    const userFavCars = await UserFavouriteCar.find({ userId }).lean();
    if (!userFavCars.length) {
      return {
        cars: [],
      };
    }
    const carIds = userFavCars.map((item) =>
      mongoose.Types.ObjectId(item.carId)
    );
    const cars = await Car.find({
      _id: {
        $in: [...carIds],
      },
    }).lean();
    const _newCars = cars.map((item) => ({ ...item, isFavourite: true }))

    return res.status(200).send({
      cars: _newCars,
    });
  } catch (error) {
    console.log(error);
    throw error;
  }
});

/* GET users listing. */
router.get("/my/posts", authGuard, async function (req, res) {
  const userId = req.user._id;
  const cars = await Car.find({
    userId,
  });
  return res.status(200).send({
    cars,
  });
});

module.exports = router;
