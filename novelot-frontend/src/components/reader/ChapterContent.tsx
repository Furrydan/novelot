import useChapter from "./logic/useChapter";
import "./ChapterContent.css";
import { useNavigate } from "react-router-dom";

interface ChapterContentProps {
  novelId: number;
  chapterNumber: number;
}

function ChapterContent({ novelId, chapterNumber }: ChapterContentProps) {
  const chapter = useChapter(novelId, chapterNumber);
  const navigate = useNavigate();

  return (
    <>
      <article className="chapter__content">
        <h1 className="chapter__title">{chapter.title}</h1>
        {chapter.content.map((paragraph, index) => (
          <p key={index}>{paragraph}</p>
        ))}
      </article>
      <nav className="chapter__buttons">
        <button
          type="button"
          className="chapter__buttons__button"
          onClick={() =>
            navigate(`/novels/${novelId}/chapters/${chapterNumber - 1}`)
          }
          disabled={chapterNumber <= 1}
        >
          Previous
        </button>
        <span className="chapter__buttons__text">
          {chapterNumber} of {chapter.totalChapters}
        </span>
        <button
          type="button"
          className="chapter__buttons__button"
          onClick={() =>
            navigate(`/novels/${novelId}/chapters/${chapterNumber + 1}`)
          }
          disabled={chapterNumber >= chapter.totalChapters}
        >
          Next
        </button>
      </nav>
    </>
  );
}

export default ChapterContent;
