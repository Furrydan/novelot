import { use } from "react";
import { api } from "@api/novelClients";
import {
  isChapterResponse,
  type ChapterResponse,
} from "@novelot-types/Chapter";

const chapterCache = new Map<string, Promise<ChapterResponse>>();

async function fetchChapter(
  novelId: number,
  chapterNumber: number,
): Promise<ChapterResponse> {
  const res = await api.get<unknown>(`/${novelId}/chapters/${chapterNumber}`);
  if (!isChapterResponse(res.data)) {
    throw new Error("Invalid chapter response");
  }
  return res.data;
}

function useChapter(novelId: number, chapterNumber: number): ChapterResponse {
  const key = `${novelId}/${chapterNumber}`;
  let promise = chapterCache.get(key);
  if (!promise) {
    promise = fetchChapter(novelId, chapterNumber);
    chapterCache.set(key, promise);
  }
  return use(promise);
}

export default useChapter;
