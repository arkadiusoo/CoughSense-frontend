export async function analyzeCoughAudio(file, apiBaseUrl) {
  if (!apiBaseUrl) {
    throw new Error("Missing API base URL. Set VITE_API_BASE_URL.");
  }

  const baseUrl = apiBaseUrl.endsWith("/") ? apiBaseUrl : `${apiBaseUrl}/`;
  const endpoint = new URL("analyze", baseUrl).toString();

  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(endpoint, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    const details = errorText ? ` - ${errorText}` : "";
    throw new Error(`API error: ${response.status} ${response.statusText}${details}`);
  }

  return response.json();
}
