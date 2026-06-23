import React, { useEffect, useState } from "react";
import FeatureList from "../components/FeatureList";
import FeatureMediaManager from "../components/FeatureMediaManager";
import UseCaseList from "../components/UseCaseList";
import DemoStoreManager from "../components/DemoStoreManager";
import PainMappingManager from "../components/PainMappingManager";

export default function KnowledgePage({ data, reload }){
  const [mode, setMode] = useState(localStorage.getItem("knowledge-tab") || "features");
  const [editingFeature, setEditingFeature] = useState(null);
  const [editingUseCase, setEditingUseCase] = useState(null);
  const [selectedFeatureForMedia, setSelectedFeatureForMedia] = useState(null);

  useEffect(() => {
    localStorage.setItem("knowledge-tab", mode);
  }, [mode]);

  return (
    <>
      <div className="pageHead">
        <div>
          <h1>Knowledge Centre</h1>
          <p className="muted">Manage feature links, use cases, slider media and demo store links.</p>
        </div>
      </div>

      <div className="tabRow">
        <button className={mode==="features" ? "active" : ""} onClick={() => setMode("features")}>Features</button>
        <button className={mode==="usecases" ? "active" : ""} onClick={() => setMode("usecases")}>Use Cases</button>
        <button className={mode==="demostores" ? "active" : ""} onClick={() => setMode("demostores")}>Demo Stores</button>
        <button className={mode==="pain" ? "active" : ""} onClick={() => setMode("pain")}>Pain Mapping</button>
      </div>

      {mode === "features" && (
        <>
          <FeatureList
            data={data}
            reload={reload}
            editing={editingFeature}
            setEditing={setEditingFeature}
            openMedia={(feature) => { setSelectedFeatureForMedia(feature); }}
          />
          {selectedFeatureForMedia && (
            <div className="mergedMediaPanel">
              <div className="panelHead">
                <div>
                  <h3>Media for {selectedFeatureForMedia.name}</h3>
                  <p className="muted">Feature images and videos are managed inside the feature itself.</p>
                </div>
                <button type="button" className="btn secondary" onClick={() => setSelectedFeatureForMedia(null)}>Close</button>
              </div>
              <FeatureMediaManager
                data={data}
                reload={reload}
                selectedFeature={selectedFeatureForMedia}
                setSelectedFeature={setSelectedFeatureForMedia}
              />
            </div>
          )}
        </>
      )}

      {mode === "usecases" && (
        <UseCaseList
          data={data}
          reload={reload}
          editing={editingUseCase}
          setEditing={setEditingUseCase}
        />
      )}

      {mode === "demostores" && <DemoStoreManager data={data} reload={reload} />}
      {mode === "pain" && <PainMappingManager data={data} reload={reload} />}
    </>
  );
}
