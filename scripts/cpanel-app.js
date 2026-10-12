// Startup fajl za cPanel "Setup Node.js App" (Passenger). Pokreće Next.js standalone server.
process.env.NODE_ENV = process.env.NODE_ENV || "production";
process.env.HOSTNAME = "0.0.0.0";
require("./server.js");
