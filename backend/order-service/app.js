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

const run = async () => {
  try {
    await consumer.connect();
    await producer.connect();
    await consumer.subscribe({
      topic: "payment-successful",
      fromBeginning: false,
    });
    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        const value = message.value.toString();
        const { userId } = JSON.parse(value);

        const orderId = uuidv4();
        console.log(
          `Order consumer: User ${userId} placed an order with ID ${orderId}`
        );
        try {
          const existing = await Order.findOne({ orderId });
          if (!existing) {
            const order = new Order({ userId, orderId, status: "paid" });
            await order.save();
            console.log("Success to Created");
          } else {
            console.log("OrderId is already existing!");
          }
        } catch (error) {
          console.log("Error while saving order", error);
        }
        await producer.send({
          topic: "order-created",
          messages: [{ value: JSON.stringify({ userId, orderId }) }],
        });
        await producer.send({
          topic: "order-successful",
          messages: [{ value: JSON.stringify({ userId, orderId }) }],
        });
      },
    });
  } catch (error) {
    console.log("Error in Kafka consumer:", error);
  }
};
run();
app.listen(5000, () => {
  connectToDb();
  console.log("Order service is running on port 5000");
});
