import { Suspense, useEffect, useState, type CSSProperties } from "react";
import { useParams } from "react-router-dom";
import ChapterContent from "./ChapterContent";
import ErrorBoundary from "./ErrorBoundary";
import "./Reader.css";
import ReaderSettings from "./ReaderSettings";
import type { ReaderSettings as Settings } from "@novelot-types/readerSettingsLogic";

const DEFAULT_SETTINGS: Settings = {
  theme: "light",
  font: "serif",
  fontSize: 18,
};

function Reader() {
  const params = useParams();
  const novelId = Number(params.novelId);
  const chapterNumber = Number(params.chapterNumber);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);

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
          <ChapterContent novelId={novelId} chapterNumber={chapterNumber} />
        </div>
        <ReaderSettings settings={settings} onSettingsChange={setSettings} />
      </Suspense>
    </ErrorBoundary>
  );
}

export default Reader;
