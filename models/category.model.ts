import mongoose, { Document, Schema } from 'mongoose';

export interface ICategory extends Document {
  categoryName: string;
}

const CategorySchema: Schema = new Schema({
    categoryName: { type: String, required: true },
}, { timestamps: true });

export default mongoose.model<ICategory>('AssetsCategory', CategorySchema);

