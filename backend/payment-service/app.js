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
  brokers: ["kafka:9092"], // burada localhost değil kafka servisi
});

const producer = kafka.producer();
const consumer = kafka.consumer({ groupId: "payment-group" });

const connectToKafka = async () => {
  try {
    await producer.connect();
    await consumer.connect();
    console.log("Connected to Producer");
  } catch (error) {
    console.log("Error connecting to Kafka:", error);
  }
};

const run = async () => {
  try {
    await consumer.subscribe({
      topic: "order-created",
      fromBeginning: false,
    });
    await consumer.run({
      eachMessage: async ({ message, partition, topic }) => {
        const value = message.value.toString();
        const { orderId, userId } = JSON.parse(value);
        console.log(
          `Payment consumer: User ${userId} placed an order with ID ${orderId}`
        );
        await producer.send({
          topic: "payment-successful",
          messages: [{ value: JSON.stringify({ orderId, userId }) }],
        });
      },
    });
  } catch (error) {
    console.log("Error in kafka consumer", error);
  }
};

app.listen(5001, () => {
  connectToDb();
  connectToKafka();
  run();
  console.log("Payment service is running on port 5001");
});
