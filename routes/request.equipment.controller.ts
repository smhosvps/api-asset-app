import express from "express";
import {
  approveWquipmentRequest,
  cancelEquipmentRequest,
  createEquipmentRequest,
  deleteEquipmentRequest,
  getEquipmentRequestById,
  getEquipmentRequests,
  updateEquipmentRequest,
} from "../controlers/request.equipment.controller";

const eqRouter = express.Router();

// Create a new equipment request
eqRouter.post("/request-e", createEquipmentRequest);

// Get all equipment requests
eqRouter.get("/request-e", getEquipmentRequests);

// Get a single equipment request
eqRouter.get("/request-e/:id", getEquipmentRequestById);

// Update an equipment request
eqRouter.put("/request-e/:id", updateEquipmentRequest);

// Cancel an equipment request
eqRouter.patch("/request-e/:id/cancel", cancelEquipmentRequest);
eqRouter.put("/approve-request-e/:id", approveWquipmentRequest);

// Delete an equipment request
eqRouter.delete("/request-e/:id", deleteEquipmentRequest);

export default eqRouter;
