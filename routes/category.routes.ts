import express from "express";
import {  authenticate, authorize } from "../middleware/auth";
import { createCategory, deleteCategory, getCategories, updateCategory } from "../controlers/category.controller";

const categoryRouter = express.Router();

categoryRouter.get("/asset-categories", getCategories);
categoryRouter.post("/asset-categories", authenticate, createCategory);
categoryRouter.put("/asset-categories/:id", authenticate, updateCategory);
categoryRouter.delete("/asset-categories/:id", authenticate, deleteCategory);

export default categoryRouter;