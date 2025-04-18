import express from "express";
import {  authenticate, authorize } from "../middleware/auth";
import { createSubCategory, deleteSubCategory, getSubCategories, updateSubCategory } from "../controlers/subcategory.controller";

const subcategoryRouter = express.Router();

subcategoryRouter.get("/asset-subcategories", getSubCategories);
subcategoryRouter.post("/asset-create-subcategories", authenticate, createSubCategory);
subcategoryRouter.put("/asset-subcategories/:id", authenticate, updateSubCategory);
subcategoryRouter.delete("/asset-subcategories/:id", authenticate, deleteSubCategory);

export default subcategoryRouter;