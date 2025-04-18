require('dotenv').config();
import express, { NextFunction, Request, Response } from "express";
import cors from 'cors';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cookieParser from "cookie-parser";
import { ErrorMiddleware } from "./middleware/error";
import userRouter from "./routes/user.routes";
import categoryRouter from "./routes/category.routes";
import subcategoryRouter from "./routes/subcategory.routes";
import propertyRouter from "./routes/property.route";
import itemRouter from "./routes/items.routes";
import assetRouter from "./routes/assets.routes";
import maintenanceRouter from "./routes/request.maintenance.controller";
import eqRouter from "./routes/request.equipment.controller";


const app = express();
const server = http.createServer(app);

const io = new SocketIOServer(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    preflightContinue: false,
    optionsSuccessStatus: 204
  }
});

app.use(cors({
  origin: "http://localhost:3000",
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  preflightContinue: false,
  optionsSuccessStatus: 204
}));

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// routes 
app.use("/api/v1",
  userRouter,
  categoryRouter,
  subcategoryRouter,
  propertyRouter,
  itemRouter,
  assetRouter,
  maintenanceRouter,
  eqRouter
);

// testing api
app.get("/smhos-asset-x", (req: Request, res: Response, next: NextFunction) => {
  res.status(200).json({
    success: true,
    message: "api is working"
  });
});

// unknown routes 
app.all("*", (req: Request, res: Response, next: NextFunction) => {
  const err = new Error(`Route ${req.originalUrl} not found!`) as any;
  err.statusCode = 404;
  next(err);
});


// use errorhandler
app.use(ErrorMiddleware);

export { app, server, io };