const express = require("express");
const cors = require("cors");
const { Kafka } = require("kafkajs");
const { connectToDb } = require("./db/db");
const app = express();
const { v4: uuidv4 } = require("uuid");

app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);
app.use(express.json());

const kafka = new Kafka({
  clientId: "notification-service",
  brokers: ["localhost:9094"],
});
const consumer = kafka.consumer({ groupId: "notification-group" });
const connectToKafka = async () => {
  try {
    await consumer.connect();
  } catch (error) {
    console.log("Error connection to Kafka", error);
  }
};

const run = async () => {
  try {
    await consumer.subscribe({
      topic: "payment-successful",
      fromBeginning: false,
    });
    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        const value = message.value.toString();
        const { userId, orderId } = JSON.parse(value);

        console.log(
          `Notification service: Payment successful for user ${userId}, order ${orderId}`
        );
      },
    });
  } catch (error) {
    console.log("Error in kafka consumer", error);
  }
};
const start = async () => {
  await connectToDb();
  await connectToKafka();
  await run();
};

app.listen(5002, () => {
  start();
  console.log("Notification service is running on port 5002");
});
