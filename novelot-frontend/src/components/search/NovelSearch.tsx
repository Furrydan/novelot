import NovelGrid from "@/components/search/grid/NovelGrid";
import { isNovel, type Novel } from "@/types/Types.ts";
import { useEffect, useState } from "react";

function NovelSearch() {
  const [novelList, setNovelList] = useState<Novel[]>([])
  useEffect(() => {
    fetch('http://localhost:1714/novels/all')
      .then(response => response.json())
      .then(data => {
        if (Array.isArray(data.default) && data.default.every(isNovel)) {
          setNovelList(data.default)
        }
      })
      .catch(error => console.log(error))
  }, [])
  console.log(novelList)
  return (
    <>
      <div className="novel-grid-holder">
        {novelList.map((novel: Novel) => (
          <NovelGrid key={novel.id} novel={novel} />
        ))}
      </div>
    </>
  );
}

export default NovelSearch;
