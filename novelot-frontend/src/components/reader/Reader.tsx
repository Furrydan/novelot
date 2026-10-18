import { useParams } from "react-router-dom";

function Reader() {
  const params = useParams();
  const novelId = Number(params.novelId);
  const chapterNumber = Number(params.chapterNumber);

  return (
    <p>
      Novel {novelId}, Chapter {chapterNumber}
    </p>
  );
}

export default Reader;
