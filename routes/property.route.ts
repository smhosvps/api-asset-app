import express from "express";
import { authenticate } from "../middleware/auth";
import {
  createProperty,
  deleteProperty,
  getAllProperties,
  getPropertyById,
  updateProperty,
} from "../controlers/properties.controller";

const propertyRouter = express.Router();

// Property routes
propertyRouter.post("/create-properties", authenticate, createProperty);
propertyRouter.get("/get-properties", authenticate, getAllProperties);
propertyRouter.get("/get-properties/:id", authenticate, getPropertyById);
propertyRouter.put("/update-properties/:id", authenticate, updateProperty);
propertyRouter.delete("/delete-properties/:id", authenticate, deleteProperty);

export default propertyRouter;
