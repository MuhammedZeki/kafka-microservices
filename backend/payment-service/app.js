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
  clientId: "payment-service",
  brokers: ["localhost:9094"],
});

const producer = kafka.producer();

const connectToKafka = async () => {
  try {
    await producer.connect();
    console.log("Connected to Producer");
  } catch (error) {
    console.log("Error connecting to Kafka:", error);
  }
};

app.post("/payment", async (req, res) => {
  try {
    const { cart } = req.body;

    const userId = "123456789";
    console.log(cart);
    await producer.send({
      topic: "payment-successful",
      messages: [{ value: JSON.stringify({ userId, cart }) }],
    });
  } catch (error) {
    console.log("Error in payment route:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.listen(5000, () => {
  connectToDb();
  connectToKafka();
  console.log("Payment service is running on port 5000");
});
