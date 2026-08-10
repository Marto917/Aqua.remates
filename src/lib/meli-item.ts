/**
 * Lectura de un ítem público de Mercado Libre por link o ID (MLA…).
 * Requiere MELI_ACCESS_TOKEN en el entorno.
 */

export type MeliImportedPicture = {
  /** URL remota de ML (antes de descargar). */
  sourceUrl: string;
  /** Ruta local Aqua tras descargar (`/uploads/...`), si aplica. */
  localUrl?: string;
};

export type MeliImportedItem = {
  itemId: string;
  title: string;
  description: string;
  pictures: MeliImportedPicture[];
  barcode: string | null;
  meliPrice: number | null;
  permalink: string | null;
  status: string | null;
};

export class MeliImportError extends Error {
  constructor(
    message: string,
    public readonly code:
      | "missing_token"
      | "invalid_url"
      | "not_found"
      | "forbidden"
      | "paused"
      | "upstream"
      | "network",
  ) {
    super(message);
    this.name = "MeliImportError";
  }
}

const ITEM_ID_RE = /\b(MLA)-?(\d{6,15})\b/i;

type MeliAttribute = {
  id?: string;
  name?: string;
  value_name?: string | null;
};

type MeliPicture = {
  id?: string;
  url?: string;
  secure_url?: string;
};

type MeliItemResponse = {
  id?: string;
  title?: string;
  price?: number;
  permalink?: string;
  status?: string;
  pictures?: MeliPicture[];
  attributes?: MeliAttribute[];
  error?: string;
  message?: string;
};

type MeliDescriptionResponse = {
  plain_text?: string;
  text?: string;
  error?: string;
  message?: string;
};

function getAccessToken(): string {
  const token = process.env.MELI_ACCESS_TOKEN?.trim();
  if (!token) {
    throw new MeliImportError(
      "Falta configurar MELI_ACCESS_TOKEN en el servidor (app de developers.mercadolibre.com).",
      "missing_token",
    );
  }
  return token;
}

/** Extrae MLA123… desde un link o un ID pegado. */
export function parseMeliItemId(input: string): string {
  const raw = input.trim();
  if (!raw) {
    throw new MeliImportError("Pegá el link del artículo de Mercado Libre.", "invalid_url");
  }

  const match = ITEM_ID_RE.exec(raw);
  if (!match) {
    throw new MeliImportError(
      "No reconocí un artículo de Mercado Libre. Usá un link con MLA… (ej. articulo.mercadolibre.com.ar/MLA-…).",
      "invalid_url",
    );
  }

  return `MLA${match[2]}`;
}

function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

const BARCODE_ATTR_IDS = new Set([
  "GTIN",
  "EAN",
  "UPC",
  "ISBN",
  "PRODUCT_IDENTIFIER",
  "GTIN14",
  "EMPTY_GTIN_REASON",
]);

function extractBarcode(attributes: MeliAttribute[] | undefined): string | null {
  if (!attributes?.length) return null;

  for (const attr of attributes) {
    const id = (attr.id ?? "").toUpperCase();
    if (id === "EMPTY_GTIN_REASON") continue;
    if (!BARCODE_ATTR_IDS.has(id) && !/^(GTIN|EAN|UPC|ISBN)/i.test(id)) continue;
    const value = attr.value_name?.trim() ?? "";
    if (value && /^\d{8,14}$/.test(value)) return value;
  }

  // Algunas publicaciones ponen el código en atributos genéricos
  for (const attr of attributes) {
    const name = (attr.name ?? "").toLowerCase();
    if (!/c[oó]digo|ean|gtin|barra/.test(name)) continue;
    const value = attr.value_name?.trim() ?? "";
    if (value && /^\d{8,14}$/.test(value)) return value;
  }

  return null;
}

function pictureUrls(pictures: MeliPicture[] | undefined, max = 5): string[] {
  if (!pictures?.length) return [];
  const urls: string[] = [];
  for (const pic of pictures) {
    const url = (pic.secure_url || pic.url || "").trim();
    if (!url) continue;
    // Preferir la versión de mayor calidad cuando ML usa -O.jpg / -F.jpg
    const hi = url.replace(/-I\.jpg/i, "-O.jpg").replace(/-S\.jpg/i, "-O.jpg");
    if (!urls.includes(hi)) urls.push(hi);
    if (urls.length >= max) break;
  }
  return urls;
}

async function meliGet<T>(path: string, token: string): Promise<{ status: number; data: T }> {
  let res: Response;
  try {
    res = await fetch(`https://api.mercadolibre.com${path}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
      cache: "no-store",
    });
  } catch {
    throw new MeliImportError(
      "No se pudo conectar con Mercado Libre. Probá de nuevo en unos minutos.",
      "network",
    );
  }

  const data = (await res.json().catch(() => ({}))) as T;
  return { status: res.status, data };
}

function mapHttpError(status: number, message?: string): never {
  if (status === 401 || status === 403) {
    throw new MeliImportError(
      "Mercado Libre rechazó el acceso (token inválido o vencido). Renová MELI_ACCESS_TOKEN.",
      "forbidden",
    );
  }
  if (status === 404) {
    throw new MeliImportError(
      "No encontramos ese artículo en Mercado Libre. Revisá el link.",
      "not_found",
    );
  }
  throw new MeliImportError(
    message?.trim() || `Mercado Libre respondió con error (${status}).`,
    "upstream",
  );
}

/**
 * Trae título, descripción, fotos (URLs remotas), precio de referencia y código si hay.
 * No descarga archivos a disco: eso lo hace el route de import.
 */
export async function fetchMeliItem(inputUrl: string): Promise<MeliImportedItem> {
  const token = getAccessToken();
  const itemId = parseMeliItemId(inputUrl);

  const { status, data } = await meliGet<MeliItemResponse>(`/items/${itemId}`, token);

  if (status !== 200) {
    mapHttpError(status, data.message || data.error);
  }

  const itemStatus = data.status?.toLowerCase() ?? null;
  if (itemStatus === "closed" || itemStatus === "inactive" || itemStatus === "paused") {
    throw new MeliImportError(
      "Ese artículo está pausado, cerrado o inactivo en Mercado Libre.",
      "paused",
    );
  }

  const title = data.title?.trim() ?? "";
  if (!title) {
    throw new MeliImportError("Mercado Libre no devolvió el título del artículo.", "upstream");
  }

  let description = "";
  const descRes = await meliGet<MeliDescriptionResponse>(`/items/${itemId}/description`, token);
  if (descRes.status === 200) {
    const plain = descRes.data.plain_text?.trim();
    const html = descRes.data.text?.trim();
    description = plain || (html ? stripHtml(html) : "");
  }
  // description 404 = sin descripción; no es error fatal

  const price =
    typeof data.price === "number" && Number.isFinite(data.price) && data.price > 0
      ? data.price
      : null;

  return {
    itemId: data.id ?? itemId,
    title,
    description,
    pictures: pictureUrls(data.pictures).map((sourceUrl) => ({ sourceUrl })),
    barcode: extractBarcode(data.attributes),
    meliPrice: price,
    permalink: data.permalink?.trim() || null,
    status: itemStatus,
  };
}
