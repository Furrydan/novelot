import NovelGrid from "@/components/search/grid/NovelGrid";
import { isNovel, type Novel } from "@/types/Types.ts";
import { useEffect, useState } from "react";

function NovelSearch() {
  const [novelSearchInput, setNovelSearchInput] = useState<string>("")
  const [currentPage, setCurrentPage] = useState<number>(0)
  const perPage: number = 24
  console.log(currentPage * perPage)
  const [novelList, setNovelList] = useState<Novel[]>([])
  useEffect(() => {
    const getData = setTimeout(async () => {
      try {
        const novels = await fetchNovels(novelSearchInput);
        setNovelList(novels);
      } catch (error) {
        console.error(error);
      }
    }, 2000);

    return () => clearTimeout(getData);
  }, [novelSearchInput])
  return (
    <>
      <div className="novel-search-bar">
        <input className="novel-search-input" onChange={input => setNovelSearchInput(input.target.value)} />
      </div>
      <div className="novel-grid-holder">
        {novelList.filter((_, idx) => currentPage * perPage <= idx && idx < (currentPage + 1) * perPage)
          .map((novel: Novel) => (
            <NovelGrid key={novel.id} novel={novel} />
          ))}
      </div>
      <div className="novel-search-page-button-holder">
        <button className="novel-search-page-button" onClick={_ => setCurrentPage(Math.max(currentPage - 1, 0))}>Previous Page</button>
        <span className="novel-search-page-number">{currentPage + 1}</span>
        <button className="novel-search-page-button" onClick={_ => setCurrentPage(Math.min(currentPage + 1, novelList.length / perPage))}>Next Page</button>
      </div>
    </>
  );
}

// Function to retreive novels from backend. Can search for specific novel or return all novels
async function fetchNovels(search: string): Promise<Novel[]> {
  const url = search ? `/api/novels/search/${search}` : "/api/novels/all";
  const response = await fetch(url);
  const data = await response.json();
  if (Array.isArray(data) && data.every(isNovel)) {
    return data;
  }
  return [];
}

export default NovelSearch;
