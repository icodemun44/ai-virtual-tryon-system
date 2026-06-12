import { useState, useRef } from 'react';

export default function UploadView({ onUpload }) {
  const [preview, setPreview] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef(null);

  const handleFile = (file) => {
    if (!file || !file.type.startsWith('image/')) {
      alert('Please upload an image file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target.result);
    reader.readAsDataURL(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const handleConfirm = () => {
    if (preview) onUpload(preview);
  };

  return (
    <div className="p-6 flex flex-col gap-5">
      <div>
        <h2 className="text-xl font-semibold mb-1">Welcome!</h2>
        <p className="text-sm text-neutral-400">
          To use this extension, please upload your picture first.
        </p>
      </div>

      {!preview ? (
        <div
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all bg-neutral-800
            ${dragActive ? 'border-blue-500 bg-blue-500/10' : 'border-neutral-700 hover:border-neutral-500'}`}
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
          onDragLeave={() => setDragActive(false)}
          onClick={() => inputRef.current?.click()}
        >
          <div className="text-3xl mb-3">📷</div>
          <p className="text-sm font-medium mb-1">Click or drag & drop your photo here</p>
          <span className="text-xs text-neutral-500">JPG, PNG up to 5MB</span>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            onChange={(e) => handleFile(e.target.files[0])}
            hidden
          />
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="w-full h-52 rounded-xl overflow-hidden bg-neutral-800 border border-neutral-700">
            <img src={preview} alt="Preview" className="w-full h-full object-cover" />
          </div>
          <div className="flex gap-3">
            <button className="btn-secondary" onClick={() => setPreview(null)}>
              Choose Different
            </button>
            <button className="btn-primary flex-1" onClick={handleConfirm}>
              Use This Picture
            </button>
          </div>
        </div>
      )}
    </div>
  );
}