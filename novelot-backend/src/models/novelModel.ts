import mongoose, { Model } from "mongoose";
import type { Novel } from "@apptypes/Novel.js"
import { paginate } from "@/helpers/pagination.ts";
import { novelotError } from "@/helpers/error.js";

const novelSchema = new mongoose.Schema<Novel>({
    id: Number,
    title: String,
    author: String,
    likes: Number,
    views: Number,
    description: String,
    tags: [String],
    totalChapters: Number
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

async function getTotalChapters(novelId: number): Promise<number> {
    const partialNovel = await novelModel.findOne({ id: novelId }, { totalChapters: 1 }).lean()

    if (!partialNovel) {
        throw new novelotError(404, "Novel Not Found")
    }

    return partialNovel.totalChapters
}

export default { getAllNovels, getNovelsWithMatchingChar, getTotalChapters };
