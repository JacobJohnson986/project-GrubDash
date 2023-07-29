const path = require("path");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /orders handlers needed to make the tests pass

const dishes = require("../data/dishes-data");

function create(req, res) {
  const { data: newOrder } = req.body;
  const newId = nextId();
  const newOrderWithId = { ...newOrder, id: newId };
  orders.push(newOrderWithId);
  res.status(201).json({ data: newOrderWithId });
}


function read(req, res) {
  const { orderId } = req.params;
  const foundOrder = res.locals.order;
  if (foundOrder) {
    res.json({ data: foundOrder });
  } else {
    res.status(404).json({ error: `Order not found with id: ${orderId}` });
  }
}

function update(req, res, next) {
  const { orderId } = req.params;
  const { data } = req.body;
  if (data.id && data.id !== orderId) {
    return next({
      status: 400,
      message: `Order id does not match route id. Order: ${data.id}, Route: ${orderId}`,
    });
  }
  const foundIndex = orders.findIndex((order) => order.id === res.locals.order.id);
  if (foundIndex === -1) {
    return next({ status: 404, message: `Order not found with id: ${orderId}` });
  }
  if (orders[foundIndex].status === "delivered") {
    return next({
      status: 400,
      message: "A delivered order cannot be changed",
    });
  }
  orders[foundIndex] = { ...data, id: orderId };
  res.json({ data: orders[foundIndex] });
}

function destroy(req, res, next) {
  const { orderId } = req.params;
  const foundIndex = orders.findIndex((order) => order.id === res.locals.order.id);
  if (foundIndex === -1) {
    return next({ status: 404, message: `Order not found with id: ${orderId}` });
  }
  if (orders[foundIndex].status !== "pending") {
    return next({
      status: 400,
      message: "An order cannot be deleted unless it is pending",
    });
  }
  orders.splice(foundIndex, 1);
  res.sendStatus(204);
}

function list(req, res) {
  res.json({ data: orders });
}

function validateOrder(req, res, next) {
  const { data } = req.body;
  const requiredFields = ["deliverTo", "mobileNumber", "dishes"];
  for (const field of requiredFields) {
    if (!data[field]) {
      return next({ status: 400, message: `Order must include a ${field}` });
    }
  }

  if (req.method === "PUT") {
    if (!data.status) {
      return next({ status: 400, message: "Order must include a status" });
    }

    const validStatuses = ["pending", "preparing", "out-for-delivery", "delivered"];
    if (!validStatuses.includes(data.status)) {
      return next({ status: 400, message: "Order must have a valid status" });
    }
  } else if (req.method === "POST") {
    data.status = data.status || "pending"; // Set the default status to "pending" for create operation
  }

  const { dishes } = data;
  if (!Array.isArray(dishes) || dishes.length === 0) {
    return next({ status: 400, message: "Order must include at least one dish" });
  }

  for (const [index, dish] of dishes.entries()) {
    if (!dish.quantity || typeof dish.quantity !== "number" || dish.quantity <= 0) {
      return next({ status: 400, message: `Dish ${index} must have a quantity that is an integer greater than 0` });
    }
  }

  next();
}

function orderExists(req, res, next) {
  const { orderId } = req.params;
  const foundOrder = orders.find((order) => order.id === orderId);
  if (foundOrder) {
    res.locals.order = foundOrder;
    return next();
  }
  next({ status: 404, message: `Order not found with id: ${orderId}` });
}

module.exports = {
  create: [validateOrder, create],
  read: [orderExists, read],
  update: [orderExists, validateOrder, update],
  delete: [orderExists, destroy],
  list,
};