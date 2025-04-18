import express from "express";
import {
  createAsset,
  deleteAsset,
  deprecatedAssets,
  disposedAssets,
  getAllAssets,
  getAssetById,
  updateAsset,
} from "../controlers/assets.controller";

const assetRouter = express.Router();

// Asset routes
assetRouter.post("/assets", createAsset);
assetRouter.get("/assets", getAllAssets);
assetRouter.get("/assets-single/:id", getAssetById);
assetRouter.put("/assets/:id", updateAsset);
assetRouter.delete("/assets/:id", deleteAsset);

// Cancel an equipment request
assetRouter.put("/deprecated-asset/:id", deprecatedAssets);
assetRouter.put("/disposed-asset/:id", disposedAssets);
 
export default assetRouter;
