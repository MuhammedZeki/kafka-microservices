const express = require("express");
const app = express();
const cors = require("cors");
const { connectToDb } = require("./lib/db");

app.use(
  cors({
    origin: "http://localhost:3002/",
    credentials: true,
  })
);
app.use(express.json());

app.listen(5000, () => {
  connectToDb();
  console.log("Order service is running on port 5000");
});
