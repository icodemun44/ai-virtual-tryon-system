import { useState, useEffect } from "react";
import { Camera } from "lucide-react";
import TryOnButton from "./TryonButton";

export default function MainView({ userImage, onReset }) {
  const [currentUrl, setCurrentUrl] = useState("");
  const [generating, setGenerating] = useState(false);
  const [resultUrl, setResultUrl] = useState(null);
  const [error, setError] = useState(null);
  const [lastResult, setLastResult] = useState(null);

  useEffect(() => {
    if (typeof chrome !== "undefined" && chrome.tabs) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]?.url) setCurrentUrl(tabs[0].url);
      });
    }

    if (typeof chrome !== "undefined" && chrome.storage?.local) {
      chrome.storage.local.get(["lastTryOn"], (result) => {
        if (result.lastTryOn?.status === "done") {
          setLastResult(result.lastTryOn);
        }
      });
    } else {
      const saved = localStorage.getItem("lastTryOn");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.status === "done") setLastResult(parsed);
      }
    }
  }, []);

  useEffect(() => {
    if (typeof chrome !== "undefined" && chrome.storage?.local) {
      chrome.storage.local.get(null, (result) => {
        console.log("All storage:", result); 
      });
    }
  }, []);

  const handleGenerate = async () => {
    if (!currentUrl) {
      alert("Could not get current page URL");
      return;
    }

    setGenerating(true);
    setResultUrl(null);
    setError(null);

    try {
      const imageResponse = await fetch(userImage);
      const imageBlob = await imageResponse.blob();

      const formData = new FormData();
      formData.append("person_image", imageBlob, "user-image.png");
      formData.append("product_url", currentUrl);

      const response = await fetch("http://localhost:8000/api/v1/try-on", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || "Generation failed");
      }

      const data = await response.json();

      const saved = {
        status: "done",
        resultUrl: data.result_url,
        productUrl: currentUrl,
        timestamp: Date.now(),
      };

      if (typeof chrome !== "undefined" && chrome.storage?.local) {
        chrome.storage.local.set({ lastTryOn: saved }, () => {
          console.log("Saved successfully"); // ← and this
        });
      } else {
        localStorage.setItem("lastTryOn", JSON.stringify(saved));
      }

      setLastResult(saved);
      setResultUrl(data.result_url);
    } catch (err) {
      setError(err.message || "Unknown error occurred");
    } finally {
      setGenerating(false);
    }
  };

  const clearLastResult = () => {
    if (typeof chrome !== "undefined" && chrome.storage?.local) {
      chrome.storage.local.remove(["lastTryOn"]);
    } else {
      localStorage.removeItem("lastTryOn");
    }
    setLastResult(null);
  };

  const displayUrl = (() => {
    try {
      const u = new URL(currentUrl);
      return u.hostname + u.pathname;
    } catch {
      return currentUrl;
    }
  })();

  const formatTime = (timestamp) => {
    const diff = Math.floor((Date.now() - timestamp) / 1000);
    if (diff < 60) return "just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  const loadingSteps = [
    "Analyzing product page...",
    "Fetching product details...",
    "Matching your outfit...",
    "Applying AI try-on...",
    "Finalizing result...",
  ];

  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    if (!generating) return;

    const interval = setInterval(() => {
      setStepIndex((prev) => (prev + 1) % loadingSteps.length);
    }, 12000);

    return () => clearInterval(interval);
  }, [generating]);

  // Result view
  if (resultUrl) {
    return (
      <div className="flex flex-col flex-1 gap-4 p-5 bg-[#0C1018]">
        <div className="flex flex-col gap-0.5">
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#3A5A58]">
            Result
          </p>
          <h2 className="text-[19px] font-extrabold text-[#B2ECE1] leading-tight">
            Looking good!
          </h2>
          <p className="text-xs text-[#4A6A68]">Here's how it looks on you.</p>
        </div>

        <div className="flex flex-col rounded-xl overflow-hidden border border-[#1A2A38]">
          <img
            src={resultUrl}
            alt="Try-on result"
            className="w-full object-cover max-h-[260px]"
          />
          <div className="flex items-center justify-between px-3 py-2 bg-[#0F1520]">
            <span className="text-[10px] font-bold tracking-[0.1em] text-[#8CDEDC] uppercase">
              Result
            </span>
            <span className="text-[10px] text-[#4A6A68] truncate ml-2">
              {displayUrl}
            </span>
          </div>
        </div>

        <div className="flex-1" />

        <div className="flex gap-2">
          <button
            className="flex flex-1 items-center justify-center gap-1.5 h-10 rounded-[10px] border border-[#1A2A38] bg-transparent text-[#4A6A68] text-xs font-semibold cursor-pointer transition-colors hover:text-[#8CDEDC] hover:border-[rgba(140,222,220,0.3)]"
            onClick={() => chrome.tabs.create({ url: resultUrl })}
          >
            ↗ Full size
          </button>
          <button
            className="flex flex-1 items-center justify-center gap-1.5 h-10 rounded-[10px] bg-gradient-to-br from-[#BA274A] to-[#841C26] text-[#FFE8EC] text-xs font-bold cursor-pointer hover:opacity-90 transition-opacity"
            onClick={() => setResultUrl(null)}
          >
            ↺ Try another
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 gap-4 p-5 bg-[#0C1018]">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 bg-[#111720] border border-[#1A2A38] rounded-full py-1.5 pl-2 pr-3">
          <div className="w-2 h-2 rounded-full bg-[#2191FB] shrink-0" />
          <span className="text-[11px] font-bold tracking-[0.1em] text-[#2191FB] uppercase">
            YouDress
          </span>
        </div>
        <button
          className="flex items-center gap-1.5 bg-transparent border border-[#1A2A38] text-[#4A6A68] text-[11px] py-1.5 px-2.5 rounded-lg cursor-pointer transition-colors hover:text-[#8CDEDC] hover:border-[rgba(140,222,220,0.3)]"
          onClick={onReset}
        >
          <Camera /> Change photo
        </button>
      </div>

      {/* Heading */}
      <div className="flex flex-col gap-0.5">
        <h2 className="text-[19px] font-extrabold text-[#B2ECE1] leading-tight">
          Virtual Try-On
        </h2>
        <p className="text-xs text-[#4A6A68]">
          See how it looks on you before you buy.
        </p>
      </div>

      {/* Last try-on banner */}
      {lastResult && !generating && (
        <div className="flex flex-col gap-2 bg-[#0F1B28] border border-[#1A2A38] rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-3.5 pt-3">
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-[#8CDEDC]" />
              <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#3A5A58]">
                Last Try-On
              </span>
              <span className="text-[10px] text-[#3A5A58]">
                · {formatTime(lastResult.timestamp)}
              </span>
            </div>
            <button
              className="text-[10px] text-[#3A5A58] hover:text-[#4A6A68] cursor-pointer bg-transparent border-none"
              onClick={clearLastResult}
            >
              ✕
            </button>
          </div>

          <div className="flex items-center gap-2.5 px-3.5 pb-3">
            <img
              src={lastResult.resultUrl}
              alt="Last try-on"
              className="w-12 h-12 rounded-lg object-cover border border-[#1A2A38] shrink-0"
            />
            <div className="flex flex-col flex-1 min-w-0 gap-1">
              <span className="text-[11px] text-[#4A6A68] truncate">
                {(() => {
                  try {
                    return new URL(lastResult.productUrl).hostname;
                  } catch {
                    return lastResult.productUrl;
                  }
                })()}
              </span>
              <div className="flex gap-1.5">
                <button
                  className="flex items-center justify-center h-6 px-2 rounded-md bg-transparent border border-[#1A2A38] text-[10px] font-semibold text-[#4A6A68] hover:text-[#8CDEDC] hover:border-[rgba(140,222,220,0.3)] cursor-pointer transition-colors"
                  onClick={() => setResultUrl(lastResult.resultUrl)}
                >
                  View
                </button>
                <button
                  className="flex items-center justify-center h-6 px-2 rounded-md bg-transparent border border-[#1A2A38] text-[10px] font-semibold text-[#4A6A68] hover:text-[#8CDEDC] hover:border-[rgba(140,222,220,0.3)] cursor-pointer transition-colors"
                  onClick={() =>
                    chrome.tabs.create({ url: lastResult.resultUrl })
                  }
                >
                  ↗ Open
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Photo hero card */}
      <div className="flex items-center gap-3 bg-[#0F1B28] border border-[#1A2A38] rounded-2xl px-3.5 py-3">
        <div className="flex shrink-0">
          <div className="flex items-end">
            <img
              src={userImage}
              alt="Your photo"
              className="w-[52px] h-[52px] rounded-full object-cover border-2 border-[#2191FB]"
            />
            <div className="w-3 h-3 rounded-full bg-[#8CDEDC] border-2 border-[#0C1018] -ml-3 mb-0.5" />
          </div>
        </div>
        <div className="flex flex-col flex-1 min-w-0 gap-0.5">
          <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#3A5A58]">
            Your photo
          </span>
          <span className="text-sm font-bold text-[#B2ECE1]">Photo ready</span>
          <span className="text-[11px] text-[#4A6A68]">Uploaded &amp; set</span>
        </div>
        <div className="flex items-center gap-1 bg-[#0B1A28] border border-[rgba(140,222,220,0.2)] rounded-lg px-2 py-1 shrink-0">
          <span className="text-[10px] text-[#8CDEDC]">✓</span>
          <span className="text-[10px] font-bold text-[#8CDEDC] tracking-[0.06em]">
            SET
          </span>
        </div>
      </div>

      {/* URL */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#3A5A58] shrink-0">
            Current page
          </span>
          <div className="flex-1 h-px bg-[#1A2A38]" />
        </div>
        <div className="flex items-start gap-2 bg-[#0F1520] border border-[#1A2A38] rounded-[10px] px-3 py-2.5">
          <span className="text-[#2191FB] text-sm shrink-0">🌐</span>
          <span className="text-[11px] text-[#4A6A68] leading-relaxed break-all">
            {displayUrl || "Loading…"}
          </span>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2 bg-[rgba(186,39,74,0.12)] border border-[rgba(186,39,74,0.3)] rounded-[10px] px-3 py-2.5">
          <span className="text-[#BA274A] text-sm shrink-0">⚠</span>
          <span className="text-[11px] text-[#F4A0B0] leading-relaxed">
            {error}
          </span>
        </div>
      )}

      <div className="flex-1" />

      {/* CTA */}
      <div className="flex flex-col gap-2">
        <TryOnButton
          generating={generating}
          disabled={!currentUrl}
          onClick={handleGenerate}
          step={loadingSteps[stepIndex]}
        />

        <p className="text-[11px] text-[#2A4A48] text-center leading-relaxed">
          We'll generate an image of you wearing this product.
        </p>
      </div>
    </div>
  );
}
