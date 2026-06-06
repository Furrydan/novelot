import mongoose, { Model } from "mongoose";
import type { Novel } from "../types/Novel.js"

const novelSchema = new mongoose.Schema<Novel>({
  id: Number,
  title: String,
  author: String,
  likes: Number,
  views: Number,
  description: String,
  tags: [String]
})

const novelModel: Model<Novel> = mongoose.model('Novel', novelSchema)

function getAllNovels(): Promise<Novel[]> {
  return novelModel.find().lean()
}

function getNovelsWithMatchingChar(char: string): Promise<Novel[]> {
  return novelModel.find({
    title: { $regex: char, $options: 'i' }
  }).lean()
}

export default { getAllNovels, getNovelsWithMatchingChar };
