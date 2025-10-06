import express from "express";
import { createServer } from "node:http";
import mongoose from "mongoose";
import {connectToSocket} from "./controllers/socketManager.js";
import { Server } from "socket.io";
import cors from "cors";
import wrapAsync from "./utils/wrapAsync.js";
import userRoutes from "./routes/userRoutes.js";

const app = express();
const server = createServer(app);
const io = connectToSocket(server);

app.use(cors({
  origin: [
    "http://localhost:5173",               // local frontend
    "hhttps://virtual-hangout-backend.onrender.com" // deployed frontend
  ],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  credentials: true,
}));
app.use(express.json());
app.use(express.json({limit : "40kb"}));
app.use(express.urlencoded({limit : "40kb" , extended : true}))

app.use("/api/v1/users",userRoutes)

app.set("port" , (process.env.PORT || 8080 ))

app.get("/",(req,res)=>{
    res.send("hello world");
});

const start = async () => {
    const connectionDb = await mongoose.connect("mongodb+srv://pratyushsinha2003_db_user:dKtxUZ5Gobh8Rxgm@cluster0.7bnismk.mongodb.net/");
    console.log(`mongo db connected ${connectionDb.connection.host}`)
    server.listen(app.get("port"), () => {
        console.log("listening on port 8080");
    });
}
start();