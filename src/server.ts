import express, { Request, Response } from "express";
import dotenv from "dotenv";

dotenv.config();
const app = express();

const PORT = process.env.PORT;

app.get("/", (request: Request, response: Response) => {
    response.status(200).send("Cocoup toi");
});

app.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
}).on("error", (err: Error) => {
    throw new Error(err.message);
});