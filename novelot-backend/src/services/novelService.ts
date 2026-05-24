import novelModel from "../models/novelModel.js"

async function findAllNovels() {
  try {

    const novelList = await novelModel.getAllNovels()
    return JSON.stringify(novelList)
  } catch (error) {
    console.log(error)
  }
}
export default { findAllNovels }
