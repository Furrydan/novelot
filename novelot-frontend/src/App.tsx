import "./App.css";
import NovelSearch from "@components/search/NovelSearch";
import Page from "@components/layout/Page";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

function App() {
  return (
    <Page>
      <Router>
        <Routes>
          <Route path="/" element={<NovelSearch />} />
        </Routes>
      </Router>
    </Page>
  );
}

export default App;
