const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
const TRYON_ENDPOINT = `${API_BASE_URL}/api/v1/try-on`;

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "START_TRYON") {
    handleTryOn(message.payload);
    sendResponse({ status: "started" });
  }
  return true;
});

async function handleTryOn({ userImage, productUrl }) {
  chrome.storage.local.set({
    lastTryOn: { status: "processing", productUrl, timestamp: Date.now() },
  });

  try {
    const imageResponse = await fetch(userImage);
    const imageBlob = await imageResponse.blob();

    const formData = new FormData();
    formData.append("person_image", imageBlob, "user-image.png");
    formData.append("product_url", productUrl);

    const response = await fetch(TRYON_ENDPOINT, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.detail || "Generation failed");
    }

    const data = await response.json();

    chrome.storage.local.set({
      lastTryOn: {
        status: "done",
        resultUrl: data.result_url,
        productUrl,
        timestamp: Date.now(),
      },
    });
  } catch (err) {
    chrome.storage.local.set({
      lastTryOn: {
        status: "error",
        error: err.message,
        productUrl,
        timestamp: Date.now(),
      },
    });
  }
}
