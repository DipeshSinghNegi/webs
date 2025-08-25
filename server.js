const express = require("express");
const http = require("http");

const app = express(http);
const server = http.createServer(app);


app.get("/",(req,res) => {
    res.send("Backend is running.")

});