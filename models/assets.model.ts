import mongoose, { Document, Schema } from "mongoose";

export interface IAssets extends Document {
  assetName: string;
  purchased_date: string;
  depreciation_date: string;
  status: string;
  asset_pictures: { public_id: string; url: string }[];
  asset_documents: object; 
}

const IAssetsSchema: Schema = new Schema(
  {
    assetName: { type: String, required: true },
    purchased_date: { type: String, required: true },
    depreciation_date: { type: String, required: true },
    status: { type: String, required: true },
    asset_pictures: [
      {
        public_id: { type: String },
        url: { type: String },
      },
    ],
    asset_documents: {
      public_id: {
        // required: true,
        type: String,
      },
      url: {
        // required: true,
        type: String,
      },
    },
  },
  { timestamps: true }
);

export default mongoose.model<IAssets>("AssetAssets", IAssetsSchema);
