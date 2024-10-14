import express, { Request, Response } from "express";
import dotenv from "dotenv";

dotenv.config();
const app = express();
const PORT = process.env.PORT;
const cors = require("cors");
const corsOptions = {
    origin: ["http://localhost:5173"],
};

app.use(cors(corsOptions));

app.get("/", (request: Request, response: Response) => {
    response.status(200).send("Cocoup toi");
});

app.get("/api" , (request: Request, response: Response) => {
    response.json({films: ["Matrix","Bob l'éponge","Joker"]})
});

app.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
}).on("error", (err: Error) => {
    throw new Error(err.message);
});