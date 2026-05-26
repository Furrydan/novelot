import NovelGrid from "@/components/search/grid/NovelGrid";
import { isNovel, type Novel } from "@/types/Types.ts";
import { useEffect, useState } from "react";

function NovelSearch() {
  const [novelSearchInput, setNovelSearchInput] = useState<string>("")
  const [novelList, setNovelList] = useState<Novel[]>([])
  useEffect(() => {
    if (novelSearchInput === "") {
      fetch("/api/novels/all")
        .then(response => response.json())
        .then(data => {
          if (Array.isArray(data) && data.every(isNovel)) {
            setNovelList(data)
          }
        })
        .catch(error => console.log(error))
    }
    else {
      fetch(`/api/novels/search/${novelSearchInput}`)
        .then(response => response.json())
        .then(data => {
          if (Array.isArray(data) && data.every(isNovel)) {
            setNovelList(data)
          }
        })
        .catch(error => console.log(error))
    }
  }, [novelSearchInput])
  return (
    <>
      <div className="novel-search-bar">
        <input className="novel-search-input" onChange={input => setNovelSearchInput(input.target.value)} />
      </div>
      <div className="novel-grid-holder">
        {novelList.map((novel: Novel) => (
          <NovelGrid key={novel.id} novel={novel} />
        ))}
      </div>
    </>
  );
}

export default NovelSearch;
