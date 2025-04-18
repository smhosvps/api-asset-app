import mongoose, { Document, Schema } from 'mongoose';

export interface ISubCategory extends Document {
  categoryName: string;
  subCategoryName: string
}

const SubCategorySchema: Schema = new Schema({
    categoryName: { type: String, required: true },
    subCategoryName: {type: String, required: true}
}, { timestamps: true });

export default mongoose.model<ISubCategory>('AssetsSubCategory', SubCategorySchema);

