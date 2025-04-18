import { Request, Response } from "express";
import categoryModel from "../models/category.model";


export const getCategories = async (req: Request, res: Response) => {
  try {
    const categories = await categoryModel.find().sort({ createdAt: -1 });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

export const createCategory = async (req: Request, res: Response) => {
  try {
    const { categoryName } = req.body;
    
    if (!categoryName) {
      return res.status(400).json({ message: "Category name is required" });
    }

    const category = await categoryModel.create({ categoryName });
    res.status(201).json(category);
  } catch (error: any) {
    if (error.name === "ValidationError") {
      return res.status(400).json({ message: error.message });
    }
    if (error.code === 11000) {
      return res.status(409).json({ message: "Category already exists" });
    }
    res.status(500).json({ message: "Server error" });
  }
};

export const updateCategory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { categoryName } = req.body;

    const category = await categoryModel.findByIdAndUpdate(
      id,
      { categoryName },
      { new: true, runValidators: true }
    );

    if (!category) return res.status(404).json({ message: "Category not found" });
    res.json(category);
  } catch (error: any) {
    if (error.name === "ValidationError") {
      return res.status(400).json({ message: error.message });
    }
    if (error.code === 11000) {
      return res.status(409).json({ message: "Category already exists" });
    }
    res.status(500).json({ message: "Server error" });
  }
};

export const deleteCategory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const category = await categoryModel.findByIdAndDelete(id);
    
    if (!category) return res.status(404).json({ message: "Category not found" });
    res.json({ message: "Category deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};