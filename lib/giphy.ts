export type GiphyGif = {
  id: string;
  title: string;
  images: {
    fixed_width?: {
      url?: string;
      webp?: string;
      mp4?: string;
      width?: string;
      height?: string;
    };
    fixed_width_small?: {
      url?: string;
      webp?: string;
      mp4?: string;
      width?: string;
      height?: string;
    };
    original?: {
      url?: string;
      webp?: string;
      mp4?: string;
      width?: string;
      height?: string;
    };
  };
  analytics?: {
    onload?: { url: string };
    onclick?: { url: string };
    onsent?: { url: string };
  };
};

type GiphyListResponse = {
  data: GiphyGif[];
};

type GiphySingleResponse = {
  data: GiphyGif;
};

function getApiKey() {
  const key = process.env.NEXT_PUBLIC_GIPHY_API_KEY;
  if (!key) throw new Error("Missing NEXT_PUBLIC_GIPHY_API_KEY");
  return key;
}

function buildUrl(
  path: string,
  params: Record<string, string | number | undefined>
) {
  const sp = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") {
      sp.set(key, String(value));
    }
  }

  return `https://api.giphy.com/v1/gifs/${path}?${sp.toString()}`;
}

export async function searchGiphyGifs(query: string) {
  const url = buildUrl("search", {
    api_key: getApiKey(),
    q: query,
    limit: 20,
    rating: "g",
    lang: "en",
    bundle: "messaging_non_clips",
  });

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to search GIPHY");

  const json: GiphyListResponse = await res.json();
  return json.data;
}

export async function getTrendingGiphyGifs() {
  const url = buildUrl("trending", {
    api_key: getApiKey(),
    limit: 20,
    rating: "g",
    bundle: "messaging_non_clips",
  });

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch trending GIFs");

  const json: GiphyListResponse = await res.json();
  return json.data;
}

export async function getGiphyGifById(id: string) {
  const url = `https://api.giphy.com/v1/gifs/${id}?${new URLSearchParams({
    api_key: getApiKey(),
    rating: "g",
  }).toString()}`;

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch GIF by id");

  const json: GiphySingleResponse = await res.json();
  return json.data;
}

export function getGifPreviewMedia(gif: GiphyGif) {
  const img =
    gif.images.fixed_width_small ??
    gif.images.fixed_width ??
    gif.images.original;

  return {
    src: img?.webp || img?.url || "",
    mp4: img?.mp4 || "",
    width: Number(img?.width || 200),
    height: Number(img?.height || 200),
  };
}

export function getGifDisplayMedia(gif: GiphyGif) {
  // Use higher quality for actual comment display
  const img =
    gif.images.original ??
    gif.images.fixed_width ??
    gif.images.fixed_width_small;

  return {
    src: img?.webp || img?.url || "",
    mp4: img?.mp4 || "",
    width: Number(img?.width || 260),
    height: Number(img?.height || 260),
  };
}