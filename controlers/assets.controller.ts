import { Request, Response, NextFunction } from "express";
import assetsModel from "../models/assets.model";
import { CatchAsyncError } from "../middleware/catchAsyncErrors";
import ErrorHandler from "../utils/ErrorHandler";
import cloudinary from "cloudinary";

interface AssetRequestBody {
  assetName: string;
  purchased_date: string;
  depreciation_date: string;
  status: 'active' | 'inactive' | 'maintenance' | 'deprecated';
  asset_pictures?: string[];
  asset_documents?: string;
}

interface CloudinaryUploadResult {
  public_id: string;
  url: string;
}

export const createAsset = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { 
      assetName, 
      purchased_date, 
      depreciation_date, 
      status 
    } = req.body as AssetRequestBody;
    
    const asset_pictures = req.body.asset_pictures || [];
    const asset_documents = req.body.asset_documents || null;

    // Validate required fields
    const missingFields = [];
    if (!assetName) missingFields.push('assetName');
    if (!purchased_date) missingFields.push('purchased_date');
    if (!depreciation_date) missingFields.push('depreciation_date');
    if (!status) missingFields.push('status');
    
    if (missingFields.length > 0) {
      return next(new ErrorHandler(
        `Missing required fields: ${missingFields.join(', ')}`, 
        400
      ));
    }

    // Validate status
    const validStatuses = ['active', 'inactive', 'maintenance', 'deprecated'];
    if (!validStatuses.includes(status)) {
      return next(new ErrorHandler(
        `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
        400
      ));
    }

    // Validate dates
    const purchaseDate = new Date(purchased_date);
    const depreciationDate = new Date(depreciation_date);
    
    if (isNaN(purchaseDate.getTime())) {
      return next(new ErrorHandler('Invalid purchase date format', 400));
    }
    
    if (isNaN(depreciationDate.getTime())) {
      return next(new ErrorHandler('Invalid depreciation date format', 400));
    }
    
    if (depreciationDate < purchaseDate) {
      return next(new ErrorHandler('Depreciation date cannot be earlier than purchase date', 400));
    }

    // Validate image size (1MB max)
    for (const image of asset_pictures) {
      // More accurate base64 size calculation
      const base64Data = image.split(',')[1] || image;
      const base64Size = Math.ceil((base64Data.length * 3) / 4);
      
      if (base64Size > 1 * 1024 * 1024) { // 1MB
        return next(new ErrorHandler(
          'One or more images exceed 1MB size limit',
          400
        ));
      }
    }

    // Upload images to Cloudinary
    const uploadedImages: CloudinaryUploadResult[] = [];
    try {
      for (const image of asset_pictures) {
        const result = await cloudinary.v2.uploader.upload(image, {
          folder: "assets",
          resource_type: "image"
        });
        uploadedImages.push({
          public_id: result.public_id,
          url: result.secure_url
        });
      }
    } catch (error) {
      // Cleanup uploaded images if any failed
      await Promise.all(
        uploadedImages.map(img => 
          cloudinary.v2.uploader.destroy(img.public_id)
        )
      );
      return next(new ErrorHandler(
        'Failed to upload images. Please check image formats',
        400
      ));
    }

    // Handle document upload
    let documentData = null;
    if (asset_documents) {
      try {
        const result = await cloudinary.v2.uploader.upload(asset_documents, {
          folder: "asset_documents",
          resource_type: "auto"
        });
        documentData = {
          public_id: result.public_id,
          url: result.secure_url
        };
      } catch (error) {
        // Cleanup images if document upload fails
        await Promise.all(
          uploadedImages.map(img => 
            cloudinary.v2.uploader.destroy(img.public_id)
          )
        );
        return next(new ErrorHandler(
          'Failed to upload document. Supported formats: PDF, DOC, DOCX',
          400
        ));
      }
    }

    // Create asset record
    const newAsset:any = await assetsModel.create({
      assetName,
      purchased_date: purchaseDate,
      depreciation_date: depreciationDate,
      status,
      asset_pictures: uploadedImages,
      asset_documents: documentData
    });

    res.status(201).json({
      success: true,
      data: {
        id: newAsset._id,
        assetName: newAsset.assetName,
        status: newAsset.status,
        purchased_date: newAsset.purchased_date,
        depreciation_date: newAsset.depreciation_date,
        images: newAsset.asset_pictures.map((img:any) => img.url),
        document: newAsset.asset_documents?.url || null
      }
    });

  } catch (error: any) {
    return next(new ErrorHandler(error.message || 'Internal server error', 500));
  }
};


// Get All Assets
export const getAllAssets = async (req: Request, res: Response) => {
  try {
    const assets = await assetsModel.find().sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      count: assets.length,
      data: assets,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get Single Asset
export const getAssetById = async (req: Request, res: Response) => {
  try {
    const asset = await assetsModel.findById(req.params.id);

    if (!asset) {
      return res.status(404).json({
        success: false,
        message: "Asset not found",
      });
    }

    res.status(200).json({
      success: true,
      data: asset,
    });
  } catch (error: any) {
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid asset ID",
      });
    }
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateAsset = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
  const { assetName, purchased_date, depreciation_date, status } = req.body

  const { id } = req.params

  // Find the asset by ID
  const asset: any = await assetsModel.findById(id)

  if (!asset) {
    return next(new ErrorHandler("Asset not found", 404))
  }

  // Validate required fields
  const requiredFields = ["assetName", "purchased_date", "depreciation_date", "status"]
  const missingFields = requiredFields.filter((field) => !req.body[field])
  if (missingFields.length > 0) {
    return next(new ErrorHandler(`Missing required fields: ${missingFields.join(", ")}`, 400))
  }

  // Validate status
  const validStatuses = ["active", "inactive", "maintenance", "deprecated", "disposed"]
  if (!validStatuses.includes(status.toLowerCase())) {
    return next(new ErrorHandler(`Invalid status. Must be one of: ${validStatuses.join(", ")}`, 400))
  }

  // Validate dates
  const purchaseDate = new Date(purchased_date)
  const depreciationDate = new Date(depreciation_date)

  if (isNaN(purchaseDate.getTime())) {
    return next(new ErrorHandler("Invalid purchase date format", 400))
  }

  if (isNaN(depreciationDate.getTime())) {
    return next(new ErrorHandler("Invalid depreciation date format", 400))
  }

  if (depreciationDate < purchaseDate) {
    return next(new ErrorHandler("Depreciation date cannot be earlier than purchase date", 400))
  }

  // Update asset fields
  asset.assetName = assetName
  asset.purchased_date = purchaseDate
  asset.depreciation_date = depreciationDate
  asset.status = status.toLowerCase()

  // Save the updated asset to the database
  await asset.save()

  res.status(200).json({
    success: true,
    data: {
      id: asset._id,
      assetName: asset.assetName,
      status: asset.status,
      purchased_date: asset.purchased_date,
      depreciation_date: asset.depreciation_date,
    },
    message: "Asset updated successfully",
  })
})
























// Update Asset
// export const updateAsset = CatchAsyncError(
//   async (req: Request, res: Response, next: NextFunction) => {
//     const {
//       assetName,
//       purchased_date,
//       depreciation_date,
//       status,
//       asset_pictures,
//       asset_documents,
//     } = req.body;

//     const { id } = req.params;

//     // Find the asset by ID
//     const asset = await assetsModel.findById(id);

//     if (!asset) {
//       return next(new ErrorHandler("Asset not found", 404));
//     }

//     // Handle images update if provided
//     if (asset_pictures) {
//       if (!Array.isArray(asset_pictures)) {
//         return next(new ErrorHandler("Incorrect images format", 400));
//       }

//       // Clean up any existing images
//       if (asset_pictures.some((image) => image.avatar?.public_id)) {
//         for (const image of asset_pictures) {
//           if (image.avatar?.public_id) {
//             await cloudinary.v2.uploader.destroy(image.avatar.public_id);
//           }
//         }
//       }

//       // Upload new images to Cloudinary
//       const uploadedImages = await Promise.all(
//         asset_pictures.map(async (image: string) => {
//           const result = await cloudinary.v2.uploader.upload(image, {
//             folder: "uploads",
//           });
//           return { public_id: result.public_id, url: result.secure_url };
//         })
//       );

//       asset.asset_pictures = uploadedImages;
//     }

//     // Handle document upload if provided
//     if (asset_documents) {
//       // Delete existing document if it exists
//       if (asset.asset_documents?.public_id) {
//         await cloudinary.v2.uploader.destroy(asset.asset_documents.public_id);
//       }

//       const documentToUpload =
//         typeof asset_documents === "object"
//           ? asset_documents.asset_documents
//           : asset_documents;

//       if (documentToUpload) {
//         const myCloud = await cloudinary.v2.uploader.upload(documentToUpload, {
//           folder: "uploads/documents",
//         });

//         // Assign the document data to the asset
//         asset.asset_documents = {
//           public_id: myCloud.public_id,
//           url: myCloud.secure_url,
//         };
//       }
//     }

//     // Update asset fields
//     asset.assetName = assetName !== undefined ? assetName : asset.assetName;
//     asset.purchased_date =
//       purchased_date !== undefined ? purchased_date : asset.purchased_date;
//     asset.depreciation_date =
//       depreciation_date !== undefined
//         ? depreciation_date
//         : asset.depreciation_date;
//     asset.status = status !== undefined ? status : asset.status;

//     // Save the updated asset to the database
//     await asset.save();

//     res
//       .status(200)
//       .json({ success: true, asset, message: "Asset updated successfully" });
//   }
// );









export const deleteAsset = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const asset = await assetsModel.findByIdAndDelete(id);
    
    if (!asset) return res.status(404).json({ message: "Asset not found" });
    res.json({ message: "Asset deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};


export const deprecatedAssets = async (req: Request, res: Response) => {
  try {
    const request = await assetsModel.findByIdAndUpdate(
      req.params.id,
      { status: "deprecated" },
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


export const disposedAssets = async (req: Request, res: Response) => {
  try {
    const request = await assetsModel.findByIdAndUpdate(
      req.params.id,
      { status: "disposed" },
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