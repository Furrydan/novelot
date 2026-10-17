import "./App.css";
import NovelSearch from "@components/search/NovelSearch";
import Page from "@components/layout/Page";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

function App() {
  return (
    <Router>
      <Page>
        <Routes>
          <Route path="/" element={<NovelSearch />} />
        </Routes>
      </Page>
    </Router>
  );
}

export default App;
