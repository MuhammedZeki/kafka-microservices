const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  orderId: { type: Number, required: true, unique: true },
  userId: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ["created", "paid"],
    default: "created",
  },
});
const Order = mongoose.model("Order", orderSchema);
module.exports = Order;
