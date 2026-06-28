import { useState, useEffect } from "react";
import UploadView from "./components/UploadView";
import MainView from "./components/MainView";

function App() {
  const [userImage, setUserImage] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof chrome !== "undefined" && chrome.storage?.local) {
      chrome.storage.local.get(["userPicture"], (result) => {
        if (result.userPicture) setUserImage(result.userPicture);
        setLoading(false);
      });
    } else {
      const saved = localStorage.getItem("userPicture");
      if (saved) setUserImage(saved);
      setLoading(false);
    }
  }, []);

  const handleImageUpload = (imageData) => {
    setUserImage(imageData);
    if (typeof chrome !== "undefined" && chrome.storage?.local) {
      chrome.storage.local.set({ userPicture: imageData });
    } else {
      localStorage.setItem("userPicture", imageData);
    }
  };

  const handleReset = () => {
    setUserImage(null);
    if (typeof chrome !== "undefined" && chrome.storage?.local) {
      chrome.storage.local.remove(["userPicture"]);
    } else {
      localStorage.removeItem("userPicture");
    }
  };

  if (loading) {
    return (
      <div className="w-[360px] min-h-[450px] flex flex-col items-center justify-center gap-3 bg-[#0C1018]">
        <div className="w-8 h-8 rounded-full border-[3px] border-[#1A2A38] border-t-[#2191FB] animate-spin" />
        <p className="text-[#4A6A68] text-sm">Loading...</p>
      </div>
    );
  }

  return (
    <div className="w-[360px] min-h-[450px] flex flex-col overflow-hidden bg-[#0C1018]">
      {!userImage ? (
        <UploadView onUpload={handleImageUpload} />
      ) : (
        <MainView userImage={userImage} onReset={handleReset} />
      )}
    </div>
  );
}

export default App;
