const { Kafka } = require("kafkajs");

const kafka = new Kafka({
  clientId: "analytic-service",
  brokers: ["localhost:9094"],
});

const consumer = kafka.consumer({ groupId: "analytic-group" });

const run = async () => {
  try {
    await consumer.connect();
    await consumer.subscribe({
      topics: ["payment-successful", "order-successful", "email-successful"],
      fromBeginning: false,
    });
    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        switch (topic) {
          case "payment-successful":
            {
              const value = message.value.toString();
              console.log(" RAW VALUE:", value);
              const parsed = JSON.parse(value);
              console.log(" PARSED VALUE:", parsed);
              const { userId, cart } = parsed;
              const total = cart
                .reduce((acc, item) => acc + item.price, 0)
                .toFixed(2);
              console.log(
                `Analytic consumer : User ${userId} made a payment of $${total}`
              );
            }
            break;
          case "order-successful":
            {
              const value = message.value.toString();
              const { userId, orderId } = JSON.parse(value);
              console.log(
                `Analytic consumer : User ${userId} placed an order with ID ${orderId}`
              );
            }
            break;
          case "email-successful":
            {
              const value = message.value.toString();
              const { userId, emailId } = JSON.parse(value);
              console.log(
                `Analytic consumer : User ${userId} received an email at ${emailId}`
              );
            }
            break;
          default:
            break;
        }
      },
    });
  } catch (error) {
    console.error("Error in Kafka consumer:", error);
  }
};
run();
