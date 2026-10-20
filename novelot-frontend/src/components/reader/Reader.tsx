import { Suspense, useEffect } from "react";
import { useParams } from "react-router-dom";
import ChapterContent from "./ChapterContent";
import ErrorBoundary from "./ErrorBoundary";
import "./Reader.css";

function Reader() {
  const params = useParams();
  const novelId = Number(params.novelId);
  const chapterNumber = Number(params.chapterNumber);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [novelId, chapterNumber]);

  return (
    <ErrorBoundary key={`${novelId}/${chapterNumber}`}>
      <Suspense fallback={<p>Loading...</p>}>
        <div className="chapter">
          <ChapterContent novelId={novelId} chapterNumber={chapterNumber} />
        </div>
      </Suspense>
    </ErrorBoundary>
  );
}

export default Reader;
