import mongoose, { Model } from "mongoose";
import type { Novel } from "@apptypes/Novel.js"
import { paginate } from "@/helpers/pagination.ts";

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

async function getAllNovels(page: number, limit: number): Promise<Novel[]> {
    return paginate(await novelModel.find().lean(), page, limit)
}

function getNovelsWithMatchingChar(char: string): Promise<Novel[]> {
    return novelModel.find({
        title: { $regex: char, $options: 'i' }
    }).lean()
}

export default { getAllNovels, getNovelsWithMatchingChar };
