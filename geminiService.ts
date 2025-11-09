
const API_ENDPOINT = 'https://tinyurl.com/api-create.php';

export const createShortUrl = async (longUrl: string): Promise<string> => {
  try {
    const response = await fetch(`${API_ENDPOINT}?url=${encodeURIComponent(longUrl)}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const shortUrl = await response.text();
    if (!shortUrl || !shortUrl.startsWith('http')) {
         throw new Error("Invalid response from shortening service.");
    }
    // The API returns the full URL, e.g. https://tinyurl.com/234asdf
    // We strip the protocol so it displays nicely in the UI.
    return shortUrl.replace(/^https?:\/\//, '');
  } catch (error) {
    console.error("Error shortening URL:", error);
    throw new Error("Failed to create a short link. Please check the URL and try again.");
  }
};
