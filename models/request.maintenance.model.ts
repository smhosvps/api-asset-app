

import mongoose, { Document, Schema } from "mongoose";

export interface IMaintenance extends Document {
  serviceName: string;
  issueDetails: string;
  requestDate: string;
  property_id: string;
  user_id: string;
  status: string;
}

const IMaintenanceSchema: Schema = new Schema(
  {
    serviceName: { type: String, required: true },
    issueDetails: { type: String, required: true },
    requestDate: { type: String, required: true },
    property_id: { type: String, required: true },
    status: { type: String, required: true }, 
    user_id: { type: String, required: true },
  },
  { timestamps: true }
);

export default mongoose.model<IMaintenance>("AssetsMaintenanceRequest", IMaintenanceSchema);
