import type { Request, Response } from "express"
import requestMaintenanceModel from "../models/request.maintenance.model"


// Create Equipment Request
export const createRequest = async (req: Request, res: Response) => {
  try {
    const { serviceName, issueDetails, requestDate, property_id, user_id, status } = req.body

    const newRequest = await requestMaintenanceModel.create({
      serviceName,
      issueDetails,
      requestDate,
      property_id,
      user_id,
      status
    })

    res.status(201).json({
      success: true,
      data: newRequest,
    })
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message,
    })
  }
}

// Get All Equipment Requests
export const getRequests = async (req: Request, res: Response) => {
  try {
    const requests = await requestMaintenanceModel.find().sort({ createdAt: -1 })
    res.json({
      success: true,
      data: requests,
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    })
  }
}

// Get Single Equipment Request
export const getRequestById = async (req: Request, res: Response) => {
  try {
    const request = await requestMaintenanceModel.findById(req.params.id)

    if (!request) {
      return res.status(404).json({
        success: false,
        error: "Request not found",
      })
    }

    res.json({
      success: true,
      data: request,
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    })
  }
}

// Cancel Equipment Request
export const cancelRequest = async (req: Request, res: Response) => {
  try {
    const request = await requestMaintenanceModel.findByIdAndUpdate(
      req.params.id,
      { status: "Cancelled" },
      { new: true, runValidators: true },
    )

    if (!request) {
      return res.status(404).json({
        success: false,
        error: "Request not found",
      })
    }

    res.json({
      success: true,
      data: request,
    })
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message,
    })
  }
}

export const approveRequest = async (req: Request, res: Response) => {
  try {
    const request = await requestMaintenanceModel.findByIdAndUpdate(
      req.params.id,
      { status: "approved" },
      { new: true, runValidators: true },
    )
    
    if (!request) {
      return res.status(404).json({
        success: false,
        error: "Request not found",
      })
    }

    res.json({
      success: true,
      data: request,
    })
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message,
    })
  }
}

// Delete Equipment Request
export const deleteRequest = async (req: Request, res: Response) => {
  try {
    const request = await requestMaintenanceModel.findByIdAndDelete(req.params.id)

    if (!request) {
      return res.status(404).json({
        success: false,
        error: "Request not found",
      })
    }

    res.json({
      success: true,
      data: {},
    })
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message,
    })
  }
}

// Update Equipment Request
export const updateRequest = async (req: Request, res: Response) => {
  try {
    const request = await requestMaintenanceModel.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    })

    if (!request) {
      return res.status(404).json({
        success: false,
        error: "Request not found",
      })
    }

    res.json({
      success: true,
      data: request,
    })
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message,
    })
  }
}

