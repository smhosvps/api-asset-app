import { Request, Response } from 'express';
import propertyModel from '../models/property.model';

// Create Property
export const createProperty = async (req: Request, res: Response) => {
  try {
    const { categoryName, subCategoryName, flatNumber,  assign_assets } = req.body;
    
    // Validate required fields
    if (!categoryName || !subCategoryName || !flatNumber) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    const newProperty = await propertyModel.create({
      categoryName,
      subCategoryName,
      flatNumber,
      assign_assets:  assign_assets || []
    });

    res.status(201).json({
      success: true,
      data: newProperty
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get All Properties
export const getAllProperties = async (req: Request, res: Response) => {
  try {
    const properties = await propertyModel.find().sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      count: properties.length,
      data: properties
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get Single Property
export const getPropertyById = async (req: Request, res: Response) => {
  try {
    const property = await propertyModel.findById(req.params.id);
    
    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found'
      });
    }

    res.status(200).json({
      success: true,
      data: property
    });
  } catch (error: any) {
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid property ID'
      });
    }
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Update Property
export const updateProperty = async (req: Request, res: Response) => {
  try {
    const updates = req.body;
    
    const property = await propertyModel .findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    );

    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found'
      });
    }

    res.status(200).json({
      success: true,
      data: property
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Delete Property
export const deleteProperty = async (req: Request, res: Response) => {
  try {
    const property = await propertyModel.findByIdAndDelete(req.params.id);

    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Property deleted successfully'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};