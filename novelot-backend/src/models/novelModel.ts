import mongoose, { Model } from "mongoose";
import type { Novel } from "@apptypes/Novel.js"

const novelSchema = new mongoose.Schema<Novel>({
    id: Number,
    title: String,
    author: String,
    likes: Number,
    views: Number,
    description: String,
    tags: [String]
})

const novelModel: Model<Novel> = mongoose.model('Novel', novelSchema, "novels")

function getAllNovels(page: number, limit: number): Promise<Novel[]> {
    return novelModel.find().limit(limit * 1).skip((page - 1) * limit).lean()
}

function getNovelsWithMatchingChar(char: string): Promise<Novel[]> {
    return novelModel.find({
        title: { $regex: char, $options: 'i' }
    }).lean()
}

export default { getAllNovels, getNovelsWithMatchingChar };
