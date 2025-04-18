import mongoose, { Document, Schema } from 'mongoose';

export interface IProperty extends Document {
  categoryName: string;
  subCategoryName: string;
  flatNumber: string;
  assign_assets: Array<{
    propertyId: string;
    // Add other relevant fields if needed
  }>;
}

const PropertySchema: Schema = new Schema({
  categoryName: { type: String, required: true },
  subCategoryName: { type: String, required: true }, 
  flatNumber: { type: String, required: true },
  assign_assets: [{
    assetId: { 
      type:  String, 
      required: false,
      ref: 'Property'
    }
  }]
}, { timestamps: true });

export default mongoose.model<IProperty>('AssetsProperty', PropertySchema);