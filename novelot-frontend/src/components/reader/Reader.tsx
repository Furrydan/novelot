import { Suspense, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import ChapterContent from "./ChapterContent";
import ErrorBoundary from "./ErrorBoundary";
import "./Reader.css";

function Reader() {
  const params = useParams();
  const novelId = Number(params.novelId);
  const chapterNumber = Number(params.chapterNumber);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [font, setFont] = useState<"serif" | "sans" | "system">("serif");

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [novelId, chapterNumber]);

  return (
    <ErrorBoundary key={`${novelId}/${chapterNumber}`}>
      <Suspense fallback={<p>Loading...</p>}>
        <div className="chapter" data-theme={theme} data-font={font}>
          <button
            type="button"
            className="chapter__buttons__button"
            onClick={() => setTheme((t) => (t === "light" ? "dark" : "light"))}
          >
            Toggle theme
          </button>
          <button
            type="button"
            className="chapter__buttons__button"
            onClick={() =>
              setFont((f) =>
                f === "serif" ? "sans" : f === "sans" ? "system" : "serif",
              )
            }
          >
            Current Font : {font}
          </button>

          <ChapterContent novelId={novelId} chapterNumber={chapterNumber} />
        </div>
      </Suspense>
    </ErrorBoundary>
  );
}

export default Reader;
