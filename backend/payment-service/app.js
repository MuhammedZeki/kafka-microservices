const express = require("express");
const cors = require("cors");
const { connectToDb } = require("./db/db");
const app = express();

app.use(
  cors({
    origin: "http://localhost:3002/",
    credentials: true,
  })
);
app.use(express.json());

app.listen(5000, () => {
  connectToDb();
  console.log("Payment service is running on port 5000");
});
