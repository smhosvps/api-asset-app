import express from "express";
import {
  approveRequest,
  cancelRequest,
  createRequest,
  deleteRequest,
  getRequestById,
  getRequests,
  updateRequest,
} from "../controlers/request.maintenance.controller";

const maintenanceRouter = express.Router();

// Create a new equipment request
maintenanceRouter.post("/request-m", createRequest);

// Get all equipment requests
maintenanceRouter.get("/request-m", getRequests);

// Get a single equipment request
maintenanceRouter.get("/request-m/:id", getRequestById);

// Update an equipment request
maintenanceRouter.put("/request-m/:id", updateRequest);

// Cancel an equipment request
maintenanceRouter.patch("/request-m/:id/cancel", cancelRequest);
maintenanceRouter.put("/approve-request-m/:id", approveRequest);

// Delete an equipment request
maintenanceRouter.delete("/request-m/:id", deleteRequest);

export default maintenanceRouter;
