import React, { useEffect, useState } from "react";
import { supabase } from "../../services/supabase";
import MediaCard from "./MediaCard";

export default function FeatureMediaManager({ data, reload, selectedFeature, setSelectedFeature }){
  const [featureId, setFeatureId] = useState(selectedFeature?.id || data.features[0]?.id || "");
  const [uploading, setUploading] = useState(false);
  const [caption, setCaption] = useState("");
  const [selectedFiles, setSelectedFiles] = useState([]);

  const media = (data.media || []).filter(m => m.feature_id === featureId).sort((a,b)=>(a.sort_order||0)-(b.sort_order||0));

  useEffect(() => {
    if(selectedFeature?.id) setFeatureId(selectedFeature.id);
  }, [selectedFeature?.id]);

  async function saveSelectedFiles(){
    const files = selectedFiles;
    if(!featureId || !files.length) return alert("Please select files first.");
    setUploading(true);

    for(let i = 0; i < files.length; i++){
      const file = files[i];
      const cleanName = file.name.replace(/[^a-zA-Z0-9.]+/g, "-");
      const path = `${featureId}/${Date.now()}-${i}-${cleanName}`;

      const { error: uploadError } = await supabase.storage
        .from("feature-media")
        .upload(path, file, { upsert: true });

      if(uploadError){
        alert("Upload failed: " + uploadError.message);
        setUploading(false);
        return;
      }

      const { data: urlData } = supabase.storage
        .from("feature-media")
        .getPublicUrl(path);

      const maxSort = media.reduce((max, m) => Math.max(max, Number(m.sort_order || 0)), 0);

      const { error: insertError } = await supabase.from("feature_media").insert({
        feature_id: featureId,
        media_type: file.type.startsWith("video") ? "video" : "image",
        media_url: urlData.publicUrl,
        caption: caption || file.name,
        sort_order: maxSort + i + 1,
        is_active: true
      });

      if(insertError){
        alert("Media save failed: " + insertError.message);
        setUploading(false);
        return;
      }
    }

    setCaption("");
    setSelectedFiles([]);
    setUploading(false);
    await reload();
  }

  async function addVideoUrl(){
    const url = prompt("Paste video URL or embed URL:");
    if(!url) return;
    const cap = prompt("Caption:", "Feature video") || "Feature video";
    const maxSort = media.reduce((max, m) => Math.max(max, Number(m.sort_order || 0)), 0);

    const { error } = await supabase.from("feature_media").insert({
      feature_id: featureId,
      media_type: "video",
      media_url: url,
      caption: cap,
      sort_order: maxSort + 1,
      is_active: true
    });

    if(error) return alert(error.message);
    reload();
  }

  async function updateMedia(item, patch){
    const { error } = await supabase.from("feature_media").update({
      ...patch,
      updated_at: new Date().toISOString()
    }).eq("id", item.id);

    if(error) return alert(error.message);
    reload();
  }

  async function deleteMedia(item){
    if(!confirm("Delete this media?")) return;
    const { error } = await supabase.from("feature_media").delete().eq("id", item.id);
    if(error) return alert(error.message);
    reload();
  }

  return (
    <>
      <div className="adminCard">
        <h3>Feature Media Manager</h3>
        <p className="muted">Upload images for the View Feature slider. Images are automatically linked to the selected feature.</p>

        <label>Select Feature</label>
        <select value={featureId} onChange={e => { setFeatureId(e.target.value); setSelectedFeature(null); }}>
          {data.features.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
        </select>

        <div className="mediaUploadBox">
          <input placeholder="Default caption for selected images" value={caption} onChange={e => setCaption(e.target.value)} />
          <label className="uploadDrop">
            <input type="file" accept="image/*,video/*" multiple onChange={e => setSelectedFiles(Array.from(e.target.files || []))} />
            <span>{selectedFiles.length ? `${selectedFiles.length} file(s) selected` : "+ Select Images / Videos"}</span>
          </label>
          <button type="button" className="btn primary" disabled={uploading || !selectedFiles.length} onClick={saveSelectedFiles}>
            {uploading ? "Saving..." : "Save Media"}
          </button>
          <button type="button" className="btn secondary" onClick={addVideoUrl}>+ Add Video URL</button>
        </div>
      </div>

      <div className="mediaGrid">
        {media.map((m) => <MediaCard key={m.id} item={m} updateMedia={updateMedia} deleteMedia={deleteMedia} />)}
      </div>
    </>
  );
}
