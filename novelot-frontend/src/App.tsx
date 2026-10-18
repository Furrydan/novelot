import "./App.css";
import NovelSearch from "@components/search/NovelSearch";
import Page from "@components/layout/Page";
import Reader from "@components/reader/Reader";
import { Routes, Route } from "react-router-dom";

function App() {
  return (
    <Page>
      <Routes>
        <Route path="/" element={<NovelSearch />} />
        <Route
          path="/novels/:novelId/chapters/:chapterNumber"
          element={<Reader />}
        />
      </Routes>
    </Page>
  );
}

export default App;
