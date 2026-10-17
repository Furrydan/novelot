import "./App.css";
import NovelSearch from "@components/search/NovelSearch";
import Page from "@components/layout/Page";
import { Routes, Route } from "react-router-dom";

function App() {
  return (
    <Page>
      <Routes>
        <Route path="/" element={<NovelSearch />} />
      </Routes>
    </Page>
  );
}

export default App;
