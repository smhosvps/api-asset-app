import mongoose, { Document, Schema } from 'mongoose';

export interface ITem extends Document {
  categoryName: string;
}

const ItemSchema: Schema = new Schema({
    itemName: { type: String, required: true },
}, { timestamps: true });

export default mongoose.model<ITem>('AssetsItem', ItemSchema);

