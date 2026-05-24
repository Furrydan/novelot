import "./Tag.css";

function Tag({ tag }: { tag: string }) {
  return (
    <div className="tag">
      <span className="primary-tag">{tag}</span>
    </div>
  );
}

export default Tag;
