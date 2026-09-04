import "./NovelGrid.css";
import Tag from "@components/search/tags/Tag";
import { FaHeart } from "react-icons/fa";
import thumbnail from "@assets/Elise.png";
import type { Novel } from "@novelot-types/Novel";

function NovelGrid({ novel }: { novel: Novel }) {
    return (
        <div className="novel-grid">
            <div className="novel-grid-thumbnail">
                <img className="novel-grid-thumbnail-image" src={thumbnail} alt={novel.title + " Thumbnail"} />
            </div>
            <h2 className="novel-grid-title">{novel.title}</h2>
            <h3 className="novel-grid-author">
                <span className="novel-grid-author-label">Author:</span> {novel.author}
            </h3>
            <div className="novel-grid-metrics-bar">
                <h3 className="novel-grid-metrics-like">
                    <FaHeart className="novel-grid-heart" /> : {novel.likes}
                </h3>
                <h3 className="novel-grid-metrics-views">
                    <span className="novel-grid-metrics-views-label">Views: </span>{" "}
                    {novel.views}
                </h3>
            </div>
            <p className="novel-grid-description">{novel.description}</p>
            <div className="tag-bar">
                {novel.tags.map((tag: string) => (
                    <Tag key={tag} tag={tag} />
                ))}
            </div>
        </div>
    );
}

export default NovelGrid;
