import { type ChangeEvent, useState } from "react";
import useNovels from "./logic/UseNovels";
import "./SearchBar.css";

function SearchBar() {
    const [currentPage, setCurrentPage] = useState(1);
    const [searchInput, setSearchInput] = useState("");
    const novels = useNovels(searchInput, currentPage, setCurrentPage, 5);

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        setSearchInput(e.target.value);
        setCurrentPage(1);
    };

    const isOpen = searchInput !== "" && novels.length > 0;

    return (
        <div className="searchbar">
            <div className="searchbar-input-wrapper">
                <input
                    className="searchbar-input"
                    type="text"
                    value={searchInput}
                    onChange={handleChange}
                    placeholder="Search..."
                />
            </div>
            <div
                className={`searchbar-dropdown ${isOpen ? "searchbar-dropdown--open" : "searchbar-dropdown-closed"
                    }`}
            >
                <ul className="searchbar-dropdown-list">
                    {novels.map((novel) => (
                        <li key={novel.id} className="searchbar-dropdown-item">
                            {novel.title}
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}

export default SearchBar;
