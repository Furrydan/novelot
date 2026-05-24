import mongoose from "mongoose";

const novelSchema = new mongoose.Schema({
  id: Number,
  title: String,
  author: String,
  likes: Number,
  views: Number,
  description: String,
  tags: [String]
})

const novel = mongoose.model('Novel', novelSchema)

function getAllNovels(): Promise<any> {
  return new Promise((resolve, reject) => {
    novel.find().then(novels => resolve(novels)).catch(err => reject(err))
  })
}

export default { getAllNovels };
