import express from "express";
import {  authenticate, authorize } from "../middleware/auth";
import { createItem, deleteItem, getItem, updateItem } from "../controlers/item.controller";

const itemRouter = express.Router();

itemRouter.get("/asset-items", getItem);
itemRouter.post("/asset-items", authenticate, createItem);
itemRouter.put("/asset-items/:id", authenticate, updateItem);
itemRouter.delete("/asset-items/:id", authenticate, deleteItem);

export default itemRouter;