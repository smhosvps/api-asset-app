import mongoose, { Document, Schema } from "mongoose";

export interface IEquipemnt extends Document {
  itemName: string;
  issueDetails: string;
  requestDate: string;
  property_id: string;
  user_id: string;
  status: string;
}

const EquipemntSchema: Schema = new Schema(
  {
    itemName: { type: String, required: true },
    issueDetails: { type: String },
    requestDate: { type: String, required: true },
    property_id: { type: String, required: true },
    status: { type: String, required: true },
    user_id: { type: String, required: true },
  },
  { timestamps: true }
);

export default mongoose.model<IEquipemnt>(
  "AssetsEquipemntRequest",
  EquipemntSchema
);
