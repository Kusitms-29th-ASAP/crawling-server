const express = require('express');
const app = express();
const router = express.Router();

const CrawlingController = require("./crawling/controller/crawling_controller");

router.use("/crawl", CrawlingController);

module.exports = router;