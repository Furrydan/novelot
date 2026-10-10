import { novelotError } from "@/helpers/error.js";
import { Chapter } from "@apptypes/Chapter.ts";
import mongoose, { Model } from "mongoose";

const chapterSchema = new mongoose.Schema<Chapter>({
  novelId: Number,
  chapterNumber: Number,
  title: String,
  content: [String],
});

chapterSchema.index({ novelId: 1, chapterNumber: 1 }, { unique: true });

const chapterModel: Model<Chapter> = mongoose.model(
  "Chapter",
  chapterSchema,
  "chapters",
);

async function getChapter(
  novelId: number,
  chapterNumber: number,
): Promise<Chapter> {
  const chapter = await chapterModel.findOne({ novelId, chapterNumber }).lean();

  if (!chapter) {
    throw new novelotError(404, "Chapter Not Found");
  }

  return chapter;
}

export default { getChapter };
