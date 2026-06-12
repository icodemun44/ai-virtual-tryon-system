import { useState, useEffect } from 'react';

export default function MainView({ userImage, onReset }) {
  const [currentUrl, setCurrentUrl] = useState('');
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (typeof chrome !== 'undefined' && chrome.tabs) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]?.url) setCurrentUrl(tabs[0].url);
      });
    }
  }, []);

  const handleGenerate = async () => {
    if (!currentUrl) {
      alert('Could not get current page URL');
      return;
    }

    setGenerating(true);

    try {
      const response = await fetch('https://your-api.com/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userImage: userImage,
          productUrl: currentUrl,
        }),
      });

      if (!response.ok) throw new Error('Generation failed');

      const data = await response.json();
      
      const resultUrl = chrome.runtime.getURL(
        `result.html?image=${encodeURIComponent(data.imageUrl)}`
      );
      chrome.tabs.create({ url: resultUrl });
    } catch (error) {
      const errorUrl = chrome.runtime.getURL(
        `result.html?error=${encodeURIComponent(error.message)}`
      );
      chrome.tabs.create({ url: errorUrl });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="p-6 flex flex-col gap-5">
      <div>
        <h2 className="text-xl font-semibold mb-1">Virtual Try-On</h2>
        <p className="text-sm text-neutral-400">Your picture is ready!</p>
      </div>

      <div className="flex items-center gap-3 p-3 bg-neutral-800 rounded-xl border border-neutral-700">
        <img 
          src={userImage} 
          alt="Your picture" 
          className="w-12 h-12 rounded-full object-cover border-2 border-blue-500"
        />
        <div className="flex-1 min-w-0">
          <p className="text-xs text-neutral-500 uppercase tracking-wider mb-0.5">Your Photo</p>
        </div>
        <button 
          onClick={onReset}
          className="text-xs text-neutral-400 hover:text-white border border-neutral-600 hover:border-neutral-500 px-2.5 py-1.5 rounded-md transition-colors"
        >
          Change
        </button>
      </div>

      <div>
        <label className="block text-xs text-neutral-500 uppercase tracking-wider mb-2">
          Current Website
        </label>
        <div className="bg-neutral-800 border border-neutral-700 rounded-lg p-3 text-xs text-neutral-400 break-all max-h-20 overflow-y-auto">
          {currentUrl || 'Loading...'}
        </div>
      </div>

      <button
        className="btn-primary w-full"
        onClick={handleGenerate}
        disabled={generating || !currentUrl}
      >
        {generating ? (
          <>
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Generating...
          </>
        ) : (
          'Try It On Me'
        )}
      </button>

      <p className="text-xs text-neutral-500 text-center leading-relaxed">
        We'll generate an image of you wearing this product and open it in a new tab.
      </p>
    </div>
  );
}