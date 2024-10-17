import express, { Request, Response } from "express";
import dotenv from "dotenv";
import cors from "cors";
import axios, {isCancel, AxiosError} from 'axios';
import * as url from "node:url";

dotenv.config();
const app = express();
const PORT = process.env.PORT || '8080';

const corsOptions = {
    origin: ["http://localhost:5173"],
};

const requiredEnv = ["TMDB_URL","TMDB_TOKEN","DB_TYPE"]

for (const env of requiredEnv) {
    if(process.env[env] === undefined) {
        throw new Error(`Missing required env: ${env}`);
    }
}

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

async function getTMDBList() {
    try{
        const response = await axios.get(`${process.env.TMDB_URL}`, {
            method: 'GET',
            headers: {accept: 'application/json', Authorization: `Bearer ${process.env.TMDB_TOKEN}`},
        });
        console.log(response);
    }
    catch(err){
        console.error(err);
    }
}