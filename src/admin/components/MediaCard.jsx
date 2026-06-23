import React, { useEffect, useState } from "react";

export default function MediaCard({ item, updateMedia, deleteMedia }){
  const [caption, setCaption] = useState(item.caption || "");
  const [sortOrder, setSortOrder] = useState(item.sort_order || 0);

  useEffect(() => {
    setCaption(item.caption || "");
    setSortOrder(item.sort_order || 0);
  }, [item.id]);

  return (
    <div className={!item.is_active ? "mediaCard faded" : "mediaCard"}>
      <div className="mediaThumb">
        {item.media_type === "video" ? <div className="videoThumb">VIDEO</div> : <img src={item.media_url} />}
      </div>

      <input
        value={caption}
        placeholder="Caption"
        onChange={e => setCaption(e.target.value)}
      />

      <input
        type="number"
        value={sortOrder}
        onChange={e => setSortOrder(e.target.value)}
      />

      <div className="cardMiniActions">
        <button
          type="button"
          onClick={() => updateMedia(item, { caption, sort_order: Number(sortOrder || 0) })}
        >
          Save
        </button>
        <button type="button" onClick={() => updateMedia(item, { is_active: !item.is_active })}>{item.is_active ? "Hide" : "Show"}</button>
        <button type="button" onClick={() => deleteMedia(item)}>Delete</button>
        <a href={item.media_url} target="_blank">Open</a>
      </div>
    </div>
  );
}
