import { Suspense, useEffect, useState, type CSSProperties } from "react";
import { useParams } from "react-router-dom";
import ChapterContent from "./ChapterContent";
import ErrorBoundary from "./ErrorBoundary";
import "./Reader.css";

type ReaderSettings = {
  theme: "light" | "dark";
  font: "serif" | "sans" | "system";
  fontSize: number;
};

const DEFAULT_SETTINGS: ReaderSettings = {
  theme: "light",
  font: "serif",
  fontSize: 18,
};

const MIN_FONT_SIZE = 14;
const MAX_FONT_SIZE = 28;
const FONT_SIZE_STEP = 2;

function Reader() {
  const params = useParams();
  const novelId = Number(params.novelId);
  const chapterNumber = Number(params.chapterNumber);
  const [settings, setSettings] = useState<ReaderSettings>(DEFAULT_SETTINGS);

  const changeFontSize = (delta: number) =>
    setSettings((s) => ({
      ...s,
      fontSize: Math.min(
        MAX_FONT_SIZE,
        Math.max(MIN_FONT_SIZE, s.fontSize + delta),
      ),
    }));

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [novelId, chapterNumber]);

  return (
    <ErrorBoundary key={`${novelId}/${chapterNumber}`}>
      <Suspense fallback={<p>Loading...</p>}>
        <div
          className="chapter"
          data-theme={settings.theme}
          data-font={settings.font}
          style={
            { "--reader-font-size": `${settings.fontSize}px` } as CSSProperties
          }
        >
          <button
            type="button"
            className="chapter__buttons__button"
            onClick={() =>
              setSettings((s) => ({
                ...s,
                theme: s.theme === "light" ? "dark" : "light",
              }))
            }
          >
            Toggle theme
          </button>
          <button
            type="button"
            className="chapter__buttons__button"
            onClick={() =>
              setSettings((s) => ({
                ...s,
                font:
                  s.font === "serif"
                    ? "sans"
                    : s.font === "sans"
                      ? "system"
                      : "serif",
              }))
            }
          >
            Current Font : {settings.font}
          </button>
          <button
            type="button"
            className="chapter__buttons__button"
            onClick={() => changeFontSize(-FONT_SIZE_STEP)}
            disabled={settings.fontSize <= MIN_FONT_SIZE}
          >
            A−
          </button>
          <button
            type="button"
            className="chapter__buttons__button"
            onClick={() => changeFontSize(FONT_SIZE_STEP)}
            disabled={settings.fontSize >= MAX_FONT_SIZE}
          >
            A+
          </button>

          <ChapterContent novelId={novelId} chapterNumber={chapterNumber} />
        </div>
      </Suspense>
    </ErrorBoundary>
  );
}

export default Reader;
