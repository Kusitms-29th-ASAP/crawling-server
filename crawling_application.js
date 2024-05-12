const express = require("express");
const bodyParser = require("body-parser");
const expressErrorHandler = require("express-error-handler");

// Import required modules

// Create an Express application
const app = express();

// Start the server
const port = 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

// server setting
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// Router setting
const router = require("./index");
app.use(router);

// Error handling
app.use(expressErrorHandler.httpError(404));
app.use((err, req, res, next) => {
    res.status(500);
    res.json({message: err.message});
  });