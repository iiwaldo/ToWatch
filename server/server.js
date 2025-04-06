import express from "express";

const app = express();
const port = 3000;

app.get("/api/test", (req,res) => {
    res.json({message : "app is working"});
});

app.listen(port, () => {
    console.log("works");
});

