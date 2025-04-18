import { Request, Response } from "express";
import itemsModel from "../models/items.model";


export const getItem = async (req: Request, res: Response) => {
  try {
    const items = await itemsModel.find().sort({ createdAt: -1 });
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

export const createItem = async (req: Request, res: Response) => {
  try {
    const { itemName } = req.body;
    
    if (!itemName) {
      return res.status(400).json({ message: "Item name is required" });
    }

    const item = await itemsModel.create({ itemName });
    res.status(201).json(item);
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

export const updateItem = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { itemName } = req.body;

    const item = await itemsModel.findByIdAndUpdate(
      id,
      { itemName },
      { new: true, runValidators: true }
    );

    if (!item) return res.status(404).json({ message: "Item not found" });
    res.json(item);
  } catch (error: any) {
    if (error.name === "ValidationError") {
      return res.status(400).json({ message: error.message });
    }
    if (error.code === 11000) {
      return res.status(409).json({ message: "Item already exists" });
    }
    res.status(500).json({ message: "Server error" });
  }
};

export const deleteItem = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const item = await itemsModel.findByIdAndDelete(id);
    
    if (!item) return res.status(404).json({ message: "Item not found" });
    res.json({ message: "Item deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};