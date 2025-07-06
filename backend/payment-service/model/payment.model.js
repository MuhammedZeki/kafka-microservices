const mongoose = require("mongoose");

const PaymentSchema = new mongoose.Schema({
  card: {
    type: String,
    required: true,
  },
});
const Payment = mongoose.model("Payment", PaymentSchema);
module.exports = Payment;
