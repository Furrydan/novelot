import { useEffect, useState } from "react";
import { type Novel, isNovel } from "../../../types/Types";

function useNovels(search: string, currentPage: number, limit: number) {
  const [novelList, setNovelList] = useState<Novel[]>([])
  const [url, setUrl] = useState<string>(`/api/novels/all?page=${currentPage}&limit=${limit}`)

  useEffect(() => {
    const getAllNovels = async () => {
      const response = await fetch(url)
      const data = await response.json();
      if (Array.isArray(data) && data.every(isNovel)) {
        setNovelList(data)
      }
      return;
    }
    getAllNovels()
  }, [url])

  useEffect(() => {
    if (search !== "") {
      setUrl(`/api/novels/search?search=${search}&page=${currentPage}&limit=${limit}`)
    }
    else {
      setUrl(`/api/novels/all?page=${currentPage}&limit=${limit}`)
    }

  }, [currentPage])

  useEffect(() => {
    if (search === "") {
      setUrl(`/api/novels/all?page=${currentPage}&limit=${limit}`)
    }
    else {



      const setSearchUrl = setTimeout(async () => {
        setUrl(`/api/novels/search?search=${search}&page=${currentPage}&limit=${limit}`)

      }, 1000)
      return () => clearTimeout(setSearchUrl)
    }
  }, [search])

  return novelList;
}
export default useNovels


