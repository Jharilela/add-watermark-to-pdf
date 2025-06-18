"use client";

import React, { useState } from "react";

const positions = [
  "top-left",
  "top-center",
  "top-right",
  "center-left",
  "center",
  "center-right",
  "bottom-left",
  "bottom-center",
  "bottom-right",
];
const rotations = [0, 45, 90, 180, 270];

const WatermarkSettingsColumn = ({ onApply }: { onApply?: (settings: any) => void }) => {
  const [type, setType] = useState<"text" | "image">("text");
  const [text, setText] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [position, setPosition] = useState("center");
  const [mosaic, setMosaic] = useState(false);
  const [transparency, setTransparency] = useState(50);
  const [rotation, setRotation] = useState(0);
  const [pages, setPages] = useState("");
  const [allPages, setAllPages] = useState(true);
  const [layer, setLayer] = useState<"above" | "below">("above");

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImage(e.target.files[0]);
    }
  };

  const handleApply = () => {
    onApply?.({
      type,
      text,
      image,
      position,
      mosaic,
      transparency,
      rotation,
      pages: allPages ? "all" : pages,
      layer,
    });
  };

  return (
    <div>
      <h2>Watermark Settings</h2>
      <div style={{ marginBottom: 16 }}>
        <label>
          <input
            type="radio"
            checked={type === "text"}
            onChange={() => setType("text")}
          />
          Text
        </label>
        <label style={{ marginLeft: 16 }}>
          <input
            type="radio"
            checked={type === "image"}
            onChange={() => setType("image")}
          />
          Image
        </label>
      </div>
      {type === "text" ? (
        <input
          type="text"
          placeholder="Watermark text"
          value={text}
          onChange={e => setText(e.target.value)}
          style={{ width: "100%", marginBottom: 16 }}
        />
      ) : (
        <input
          type="file"
          accept="image/*"
          onChange={handleImageChange}
          style={{ marginBottom: 16 }}
        />
      )}
      <div style={{ marginBottom: 16 }}>
        <label>Position: </label>
        <select value={position} onChange={e => setPosition(e.target.value)}>
          {positions.map(pos => (
            <option key={pos} value={pos}>{pos}</option>
          ))}
        </select>
      </div>
      <div style={{ marginBottom: 16 }}>
        <label>
          <input
            type="checkbox"
            checked={mosaic}
            onChange={e => setMosaic(e.target.checked)}
          />
          Mosaic mode (repeat watermark)
        </label>
      </div>
      <div style={{ marginBottom: 16 }}>
        <label>Transparency: {transparency}%</label>
        <input
          type="range"
          min={10}
          max={90}
          step={1}
          value={transparency}
          onChange={e => setTransparency(Number(e.target.value))}
        />
      </div>
      <div style={{ marginBottom: 16 }}>
        <label>Rotation: </label>
        <select value={rotation} onChange={e => setRotation(Number(e.target.value))}>
          {rotations.map(r => (
            <option key={r} value={r}>{r}&deg;</option>
          ))}
        </select>
      </div>
      <div style={{ marginBottom: 16 }}>
        <label>
          <input
            type="checkbox"
            checked={allPages}
            onChange={e => setAllPages(e.target.checked)}
          />
          All Pages
        </label>
        {!allPages && (
          <input
            type="text"
            placeholder="Pages (e.g. 1,3,5)"
            value={pages}
            onChange={e => setPages(e.target.value)}
            style={{ marginLeft: 8 }}
          />
        )}
      </div>
      <div style={{ marginBottom: 16 }}>
        <label>Layering: </label>
        <select value={layer} onChange={e => setLayer(e.target.value as "above" | "below")}> 
          <option value="above">Above content</option>
          <option value="below">Below content</option>
        </select>
      </div>
      <button onClick={handleApply} style={{ marginTop: 16, width: "100%" }}>
        Apply Watermark
      </button>
    </div>
  );
};

export default WatermarkSettingsColumn; 