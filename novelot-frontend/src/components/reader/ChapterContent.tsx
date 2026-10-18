import useChapter from "./logic/useChapter";
import "./ChapterContent.css";

interface ChapterContentProps {
  novelId: number;
  chapterNumber: number;
}

function ChapterContent({ novelId, chapterNumber }: ChapterContentProps) {
  const chapter = useChapter(novelId, chapterNumber);

  return (
    <article className="chapter-content">
      <h1 className="chapter-title">{chapter.title}</h1>
      {chapter.content.map((paragraph, index) => (
        <p key={index}>{paragraph}</p>
      ))}
    </article>
  );
}

export default ChapterContent;
