import express from 'express';
import bodyParser  from 'body-parser';
import path  from  'path';

import {router}  from './data/repositories/routers.js';

import React from "react";
import ReactDOM from "react-dom";

import cors from 'cors';


const app = express();
const PORT = process.env.PORT ?? 8000;

const __dirname = path.resolve();

app.use(cors());

app.use(express.static(__dirname));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Yoooooooou! What are you doing here? You must be somewhere else. Bye)");
});

//app.use("/api/posts", posts);
app.use(router);


app.all("*", (req, res) => {
  res.status(404).send('404!\nPage not found');
});

app.listen(PORT, () => {
  console.log('Server is running on the port ' + PORT + '\n\n');
});





