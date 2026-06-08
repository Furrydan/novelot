import novelModel from "../models/novelModel.js"
import { Novel } from "../types/Novel.ts";


async function findAllNovels(page: number, limit: number): Promise<Novel[] | undefined> {
  try {
    const novelList: Novel[] = await novelModel.getAllNovels(page, limit)
    return novelList
  } catch (error) {
    console.log(error)
  }
}

async function getNovelByText(search: string, page: number, limit: number) {
  try {
    const novelList: Novel[] = await novelModel.getNovelsWithMatchingChar(search[0])
    const matchingNovels: Novel[] = novelList.map(novel => ({ novel: novel, points: fuzzyFind(search, novel.title) }))
      .filter(novel => novel.points > 10)
      .sort((novel1, novel2) => novel2.points - novel1.points)
      .map(item => item.novel)
      .filter((_, index) => (page - 1) * limit <= index && (page) * limit > index)

    return matchingNovels
  }
  catch (error) {
    console.log(error)
  }
}

export default { findAllNovels, getNovelByText }

function fuzzyFind(search: string, name: string): number {
  let points: number = 0

  search = search.toLocaleLowerCase()
  name = name.toLocaleLowerCase()

  if (search === name) {
    points = 999
    return points
  }

  let searchWords: string[] = search.split(" ")
  let nameWords: string[] = name.split(" ")

  // Search through each word

  for (let searchWordIndex = 0; searchWordIndex < searchWords.length; searchWordIndex++) {
    for (let nameWordIndex = 0; nameWordIndex < nameWords.length; nameWordIndex++) {
      let nameWordLetterIndex = 0
      let searchWordLetterIndex = 0
      let lastWordMatched = false

      if (searchWords[searchWordIndex] === nameWords[nameWordIndex]) {
        points += 50
        continue
      }

      // If first first letter matches 3 points
      if (searchWords[searchWordIndex][searchWordLetterIndex] === nameWords[nameWordIndex][nameWordLetterIndex]) {
        points += 2
        nameWordLetterIndex++
        searchWordLetterIndex++
        lastWordMatched = true
      }


      while (nameWordLetterIndex < nameWords[nameWordIndex].length && searchWords[searchWordIndex].length) {
        if (searchWords[searchWordIndex][searchWordLetterIndex] === nameWords[nameWordIndex][nameWordLetterIndex]) {
          // If consecutive words match, three points are added, else only 1
          if (lastWordMatched) {
            points += 3
          }
          else {
            points++
            lastWordMatched = true
          }
        }
        else {
          lastWordMatched = false
        }
        nameWordLetterIndex++
        searchWordLetterIndex++
      }

    }
  }

  return points
}
