import novelModel from "../models/novelModel.js"
import { Novel } from "../types/Novel.ts";

interface novelMatchingPoints {
  novel: Novel
  points: number
}

async function findAllNovels(): Promise<Novel[] | undefined> {
  try {
    const novelList: Novel[] = await novelModel.getAllNovels()
    return novelList
  } catch (error) {
    console.log(error)
  }
}

async function getNovelByText(search: string) {
  try {
    const novelList: Novel[] = await novelModel.getAllNovels()
    let novelMatchingPointsObject: novelMatchingPoints[] = []
    novelList.map(novel => novelMatchingPointsObject.push({ novel: novel, points: fuzzyFind(search, novel.title) }))
    novelMatchingPointsObject = novelMatchingPointsObject.sort((novel1, novel2) => novel2.points - novel1.points)
    novelMatchingPointsObject = novelMatchingPointsObject.filter(novel => novel.points > 0)
    const matchingNovels: Novel[] = []
    novelMatchingPointsObject.map((novelMatching: novelMatchingPoints): number => matchingNovels.push(novelMatching.novel))

    return matchingNovels
  }
  catch (error) {
    console.log(error)
  }
}

export default { findAllNovels, getNovelByText }

function fuzzyFind(search: string, name: string): number {
  let i: number = 0
  let j: number = 0
  let points: number = 0

  search = search.toLocaleLowerCase()
  name = name.toLocaleLowerCase()

  // 3 points for matching first character.

  if (name[i] === search[j]) {
    points = points + 3
    j++
    i++
  }

  // 1 point for matching each character
  while (i < name.length && j < search.length) {
    if (name[i] === search[j]) {
      points++
      j++
    }
    i++
  }

  return points
}
