import "./TopBar.css";
import SearchBar from "@components/search/SearchBar";

function TopBar() {
  return (
    <header className="topbar">
      <div className="topbar-icon">ICON</div>
      <div className="searchbar-wrapper">
        <SearchBar />
      </div>
    </header>
  );
}

export default TopBar;
