const express = require("express");
const cors = require("cors");
const { Kafka } = require("kafkajs");
const app = express();
const { connectToDb } = require("./db/db");
const Order = require("./model/order.model");
const { v4: uuidv4 } = require("uuid");

app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);
app.use(express.json());

const kafka = new Kafka({
  clientId: "order-service",
  brokers: ["localhost:9094"],
});

const consumer = kafka.consumer({ groupId: "order-group" });
const producer = kafka.producer();

const connectToKafka = async () => {
  try {
    await producer.connect();
    await consumer.connect();
  } catch (error) {
    console.log("Error connecting to Kafka:", error);
  }
};

app.post("/order", async (req, res) => {
  try {
    const { userId, amount } = req.body;
    const orderId = uuidv4();
    console.log(
      `Order service: User ${userId} placed an order with ID ${orderId}`
    );
    const order = new Order({
      userId,
      orderId,
      amount,
      status: "created",
    });
    await order.save();
    console.log("Order created successfully:", order);
    await producer.send({
      topic: "order-created",
      messages: [{ value: JSON.stringify({ userId, orderId, amount }) }],
    });
    res.status(201).json({ message: "Order created successfully", orderId });
  } catch (error) {
    console.log("Error in order route:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

const run = async () => {
  try {
    await consumer.subscribe({
      topic: "payment-successful",
      fromBeginning: false,
    });
    await consumer.run({
      eachMessage: async ({ message, partition, topic }) => {
        const value = message.value.toString();
        const { orderId } = JSON.parse(value);

        const existing = await Order.findOne({ orderId });
        if (!existing) return console.log("Order not found:", orderId);
        existing.status = "paid";
        await existing.save();
        console.log(
          `Order consumer: Order ${orderId} has been paid successfully`
        );
      },
    });
  } catch (error) {
    console.log("Error in Kafka consumer:", error);
  }
};
const start = async () => {
  await connectToDb();
  await connectToKafka();
  await run();
};
app.listen(5000, () => {
  start();
  console.log("Order service is running on port 5000");
});
