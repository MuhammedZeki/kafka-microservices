const express = require("express");
const cors = require("cors");
const { Kafka } = require("kafkajs");
const { connectToDb } = require("./db/db");
const app = express();
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
const producer = kafka.producer();
const consumer = kafka.consumer({ groupId: "notifiction-group" });
const connectToKafka = async () => {
  try {
    await producer.connect();
    await consumer.connect();
  } catch (error) {
    console.log("Error connection to Kafka", error);
  }
};

const run = async () => {
  try {
    await consumer.subscribe({
      topic: "order-successful",
      fromBeginning: false,
    });
    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        const value = message.value.toString();
        const { userId } = JSON.parse(value);

        const emailId = Math.floor(Math.random() * 999999 + 1);
        console.log(
          `Email consumer: User ${userId} placed an email with ID ${emailId}`
        );
        await producer.send({
          topic: "email-successful",
          messages: [{ value: JSON.stringify({ userId, emailId }) }],
        });
      },
    });
  } catch (error) {
    console.log("Error in kafka consumer", error);
  }
};
run();
app.listen(5000, () => {
  connectToDb();
  connectToKafka();
  console.log("Notification service is running on port 5000");
});
