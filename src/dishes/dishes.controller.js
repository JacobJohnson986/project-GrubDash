const path = require("path");

// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /dishes handlers needed to make the tests pass

function create(req, res, next) {
  const { data } = req.body;
  const newDish = {
    id: nextId(),
    ...data,
  };
  dishes.push(newDish);
  res.status(201).json({ data: newDish });
}

function read(req, res) {
  const { dishId } = req.params;
  const foundDish = dishes.find((dish) => dish.id === res.locals.dish.id);
  if (foundDish) {
    res.json({ data: foundDish });
  } else {
    res.status(404).json({ error: `Dish not found with id: ${dishId}` });
  }
}

function update(req, res, next) {
  const { dishId } = req.params;
  const { data } = req.body;
  if (data.id && data.id !== dishId) {
    return next({
      status: 400,
      message: `Dish id does not match route id. Dish: ${data.id}, Route: ${dishId}`,
    });
  }
  const foundIndex = dishes.findIndex((dish) => dish.id === res.locals.dish.id);
  if (foundIndex === -1) {
    return next({ status: 404, message: `Dish not found with id: ${dishId}` });
  }
  dishes[foundIndex] = { ...data, id: dishId };
  res.json({ data: dishes[foundIndex] });
}

function list(req, res) {
  res.json({ data: dishes });
}

function validateDish(req, res, next) {
  const { data } = req.body;
  const requiredFields = ["name", "description", "price", "image_url"];
  for (const field of requiredFields) {
    if (!data[field]) {
      return next({ status: 400, message: `Dish must include a ${field}` });
    }
  }
  if (data.price <= 0 || !Number.isInteger(data.price)) {
    return next({
      status: 400,
      message: "Dish must have a price that is an integer greater than 0",
    });
  }
  next();
}

function dishExists(req, res, next) {
  const { dishId } = req.params;
  const foundDish = dishes.find((dish) => dish.id === dishId);
  if (foundDish) {
    res.locals.dish = foundDish;
    return next();
  }
  next({ status: 404, message: `Dish not found with id: ${dishId}` });
}

module.exports = {
  create: [validateDish, create],
  read: [dishExists, read],
  update: [dishExists, validateDish, update],
  list,
};