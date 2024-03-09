import { producer } from "sdk/messaging"

producer.queue("integration-tests-queue").send("Test message in queue");

producer.topic("integration-tests-topic").send("Test message in topic");

console.log("Successfully sent messages.")