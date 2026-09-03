import "./TopBar.css";
import SearchBar from "@components/search/SearchBar";
import UserMenu from "./UserMenu";

function TopBar() {
    return (
        <header className="topbar">
            <div className="topbar-icon">ICON</div>
            <div className="searchbar-wrapper">
                <SearchBar />
            </div>
            <UserMenu />
        </header>
    );
}

export default TopBar;
