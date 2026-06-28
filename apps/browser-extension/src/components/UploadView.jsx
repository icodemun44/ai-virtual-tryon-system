import { useState, useRef } from "react";

export default function UploadView({ onUpload }) {
  const [preview, setPreview] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);

  const inputRef = useRef(null);

  const handleFile = (file) => {
    if (!file || !file.type.startsWith("image/")) {
      alert("Please upload an image file");
      return;
    }
    setSelectedFile(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const handleConfirm = async () => {
    if (!selectedFile) return;
    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target.result;
        onUpload(base64);
      };
      reader.readAsDataURL(selectedFile);
    } catch (error) {
      console.error(error);
      alert(error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-6 flex flex-col gap-5">
      <div>
        <p
          className="text-xs font-bold uppercase tracking-widest mb-1"
          style={{ color: "#2191FB" }}
        >
          Setup
        </p>
        <h2 className="text-xl font-bold mb-1" style={{ color: "#B2ECE1" }}>
          Welcome!
        </h2>
        <p className="text-sm" style={{ color: "#4A7A76" }}>
          Upload your picture to get started.
        </p>
      </div>

      {!preview ? (
        <div
          className="rounded-xl p-8 text-center cursor-pointer transition-all"
          style={{
            border: `1.5px dashed ${dragActive ? "#2191FB" : "#1A2A38"}`,
            background: dragActive ? "#0D1C2E" : "#0B1520",
          }}
          onDrop={handleDrop}
          onDragOver={(e) => {
            e.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onClick={() => {
            if (inputRef.current) {
              inputRef.current.value = "";
              inputRef.current.click();
            }
          }}
        >
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{
              background: "#0D1C2E",
              border: "1.5px solid rgba(33,145,251,0.3)",
            }}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#2191FB"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
              <circle cx="12" cy="13" r="4" />
            </svg>
          </div>

          <p
            className="text-sm font-semibold mb-1"
            style={{ color: "#B2ECE1" }}
          >
            Click or drag & drop your photo here
          </p>
          <span className="text-xs" style={{ color: "#3A5A58" }}>
            JPG, PNG up to 5MB
          </span>

          <div className="flex items-center justify-center gap-1 mt-3">
            <span
              className="text-xs font-semibold px-3 py-1 rounded-full"
              style={{
                color: "#8CDEDC",
                background: "#0B1E1E",
                border: "1px solid rgba(140,222,220,0.25)",
              }}
            >
              Choose image
            </span>
          </div>

          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => handleFile(e.target.files[0])}
          />
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <div
            className="w-full h-52 rounded-xl overflow-hidden relative"
            style={{ border: "1.5px solid #1A2A38", background: "#0B1520" }}
          >
            <img
              src={preview}
              alt="Preview"
              className="w-full h-full object-cover"
            />
            <span
              className="absolute bottom-2 left-2 text-xs font-bold px-2 py-1 rounded-full"
              style={{
                color: "#8CDEDC",
                background: "rgba(10,14,20,0.85)",
                border: "1px solid rgba(140,222,220,0.3)",
                letterSpacing: "0.08em",
              }}
            >
              PREVIEW
            </span>
          </div>

          <div className="flex gap-3">
            <button
              className="flex items-center gap-2 px-4 h-10 rounded-xl text-sm font-medium transition-colors"
              style={{
                border: "1.5px solid #1A2A38",
                background: "transparent",
                color: "#4A7A76",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "#2191FB55";
                e.currentTarget.style.color = "#8CDEDC";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "#1A2A38";
                e.currentTarget.style.color = "#4A7A76";
              }}
              onClick={() => {
                setPreview(null);
                setSelectedFile(null);
                if (inputRef.current) inputRef.current.value = "";
              }}
            >
              ↺ Choose Different
            </button>

            <button
              className="flex-1 flex items-center justify-center gap-2 h-10 rounded-xl text-sm font-bold transition-opacity"
              style={{
                background: "linear-gradient(135deg, #BA274A, #841C26)",
                color: "#FFE8EC",
                border: "none",
                opacity: uploading ? 0.45 : 1,
                cursor: uploading ? "not-allowed" : "pointer",
              }}
              onClick={handleConfirm}
              disabled={uploading}
            >
              {uploading ? "Uploading…" : "✓ Use This Picture"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
