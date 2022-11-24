const express = require("express");
const cors = require("cors");
const port = process.env.PORT || 5000;

const app = express();

//Middleware
app.use(cors());
app.use(express.json());

app.get('/', async(req, res) => {
    res.send("Car Cruise BD Server is Running");
});

app.listen(port, () => {
    console.log(`Car Cruise BD Server is Running on ${port}`);
});