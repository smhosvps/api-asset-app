import type { Request, Response } from "express"
import requestEquipmentModel from "../models/request.equipment.model"

// Create Equipment Request
export const createEquipmentRequest = async (req: Request, res: Response) => {
  try {
    const { itemName, issueDetails, requestDate, property_id, user_id, status } = req.body

    const newRequest = await requestEquipmentModel.create({
      itemName,
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
export const getEquipmentRequests = async (req: Request, res: Response) => {
  try {
    const requests = await requestEquipmentModel.find().sort({ createdAt: -1 })
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
export const getEquipmentRequestById = async (req: Request, res: Response) => {
  try {
    const request = await requestEquipmentModel.findById(req.params.id)

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
export const cancelEquipmentRequest = async (req: Request, res: Response) => {
  try {
    const request = await requestEquipmentModel.findByIdAndUpdate(
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

export const approveWquipmentRequest = async (req: Request, res: Response) => {
  try {
    const request = await requestEquipmentModel.findByIdAndUpdate(
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
export const deleteEquipmentRequest = async (req: Request, res: Response) => {
  try {
    const request = await requestEquipmentModel.findByIdAndDelete(req.params.id)

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
export const updateEquipmentRequest = async (req: Request, res: Response) => {
  try {
    const request = await requestEquipmentModel.findByIdAndUpdate(req.params.id, req.body, {
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

