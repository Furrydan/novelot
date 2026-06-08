import NovelGrid from "@/components/search/grid/NovelGrid";
import { type Novel } from "@/types/Types.js";
import { useState } from "react";
import useNovels from "./logic/useNovels"

function NovelSearch() {
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [searchInput, setSearchInput] = useState<string>("")
  const perPage: number = 24
  const novels = useNovels(searchInput, currentPage, perPage)

  const updateSearch = (value: string) => {
    setSearchInput(value)
    setCurrentPage(1)
  }

  return (
    <>
      <div className="novel-search-bar">
        <input className="novel-search-input" onChange={e => { updateSearch(e.target.value) }} />
      </div>
      <div className="novel-grid-holder">
        {novels.map((novel: Novel) => (
          <NovelGrid key={novel.id} novel={novel} />
        ))}
      </div>
      <div className="novel-search-page-button-holder">
        <button className="novel-search-page-button" onClick={_ => setCurrentPage(Math.max(currentPage - 1, 1))}>Previous Page</button>
        <span className="novel-search-page-number">{currentPage}</span>
        <button className="novel-search-page-button" onClick={_ => { setCurrentPage(currentPage + 1) }}>Next Page</button>
      </div>
    </>
  );
}

export default NovelSearch;
