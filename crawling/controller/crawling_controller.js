const express = require('express');
const app = express();
const router = express.Router();

const crawling_service = require("../service/crawling_service");

router.get("", async(req, res) => {
    const start_idx = req.query.start_idx;
    const batch_size = req.query.batch_size;
    const element_school_url = req.query.element_school_url;

    console.log("start_idx: ", start_idx);
    console.log("batch_size: ", batch_size);
    console.log("element_school_url: ", element_school_url);
    
    try{
        const response = await crawling_service.crawling(start_idx, batch_size, element_school_url)
        res.json(response);
    }catch(err){
        console.log(err);
        res.status(500).send("Internal Server Error");
    } 
});


module.exports = router;