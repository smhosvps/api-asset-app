import { Request, Response } from "express";
import subcategoryModel from "../models/subcategory.model";


export const getSubCategories = async (req: Request, res: Response) => {
  try {
    const categories = await subcategoryModel.find().sort({ createdAt: -1 });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

export const createSubCategory = async (req: Request, res: Response) => {
  try {
    const { categoryName, subCategoryName } = req.body;
    
    if (!categoryName) {
      return res.status(400).json({ message: "Category name is required" });
    }

    if (!subCategoryName) {
      return res.status(400).json({ message: "Subcategory name is required" });
    }

    const category = await subcategoryModel.create({ categoryName, subCategoryName });
    res.status(201).json(category);
  } catch (error: any) {
    if (error.name === "ValidationError") {
      return res.status(400).json({ message: error.message });
    }
    if (error.code === 11000) {
      return res.status(409).json({ message: "sub category already exists" });
    }
    res.status(500).json({ message: "Server error" });
  }
};

export const updateSubCategory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { categoryName, subCategoryName } = req.body;

    const category = await subcategoryModel.findByIdAndUpdate(
      id,
      { categoryName, subCategoryName },
      { new: true, runValidators: true }
    );

    if (!category) return res.status(404).json({ message: "Category not found" });
    res.json(category);
  } catch (error: any) {
    if (error.name === "ValidationError") {
      return res.status(400).json({ message: error.message });
    }
    if (error.code === 11000) {
      return res.status(409).json({ message: "Subcategory already exists" });
    }
    res.status(500).json({ message: "Server error" });
  }
};

export const deleteSubCategory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const category = await subcategoryModel.findByIdAndDelete(id);
    
    if (!category) return res.status(404).json({ message: "Sub category not found" });
    res.json({ message: "Category deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};