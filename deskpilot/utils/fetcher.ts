export async function safeFetchJson(url: string, options: RequestInit = {}, timeoutMs = 8000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timer);

    if (!response.ok) {
      return {
        success: false,
        error: `HTTP Error ${response.status}: ${response.statusText}`,
        status: response.status,
      };
    }

    const data = await response.json();
    return { success: true, data };
  } catch (err: any) {
    clearTimeout(timer);
    if (err.name === "AbortError") {
      return { success: false, error: "Request timed out after 8 seconds." };
    }
    return { success: false, error: err.message || "Failed to complete network request." };
  }
}