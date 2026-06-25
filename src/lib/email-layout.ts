import { getAppBaseUrl } from "@/lib/app-url";
import { resolveProductImageUrl } from "@/lib/product-images";
import { getStoreSettings } from "@/lib/store-settings";

const BRAND_NAME = "AQUA Remates";
const BRAND_COLOR = "#0f766e";
const BRAND_ACCENT = "#14b8a6";

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function absoluteImageUrl(imageUrl: string | null | undefined): string {
  const resolved = resolveProductImageUrl(imageUrl);
  if (resolved.startsWith("http://") || resolved.startsWith("https://")) return resolved;
  const base = getAppBaseUrl();
  return `${base}${resolved.startsWith("/") ? resolved : `/${resolved}`}`;
}

export async function getEmailBrandLogoUrl(): Promise<string> {
  const settings = await getStoreSettings();
  return absoluteImageUrl(settings.brandLogoUrl ?? "/logo-aqua.png");
}

type BrandedEmailOptions = {
  title: string;
  bodyHtml: string;
  /** Pie opcional (HTML). Si no se pasa, usa link a la tienda. */
  footerHtml?: string;
  preheader?: string;
};

/**
 * Plantilla HTML compartida para todos los mails transaccionales.
 * Editá acá logo, colores, tipografía y pie de página.
 */
export async function buildBrandedEmailHtml({
  title,
  bodyHtml,
  footerHtml,
  preheader,
}: BrandedEmailOptions): Promise<string> {
  const logoUrl = await getEmailBrandLogoUrl();
  const storeUrl = getAppBaseUrl();
  const footer =
    footerHtml ??
    `<p style="margin:0;font-size:13px;color:#64748b">
      <a href="${storeUrl}" style="color:${BRAND_COLOR};text-decoration:none;font-weight:600">${BRAND_NAME}</a>
    </p>`;

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)}</title>
</head>
<body style="margin:0;padding:0;background:#f0fdfa;font-family:system-ui,-apple-system,Segoe UI,sans-serif;color:#0f172a">
  ${preheader ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0">${escapeHtml(preheader)}</div>` : ""}
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f0fdfa;padding:24px 12px">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:16px;border:1px solid #ccfbf1;overflow:hidden">
          <tr>
            <td style="padding:28px 28px 16px;text-align:center;background:linear-gradient(180deg,#f0fdfa 0%,#ffffff 100%)">
              <a href="${storeUrl}" style="text-decoration:none">
                <img src="${logoUrl}" alt="${BRAND_NAME}" width="72" height="72" style="display:block;margin:0 auto;border-radius:999px;border:2px solid #99f6e4;object-fit:cover" />
              </a>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 28px 28px">
              <h1 style="margin:0 0 16px;font-size:22px;line-height:1.3;color:${BRAND_COLOR};text-align:center">${escapeHtml(title)}</h1>
              <div style="font-size:15px;line-height:1.6;color:#334155">${bodyHtml}</div>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 28px 24px;border-top:1px solid #e2e8f0;background:#f8fafc;text-align:center">
              ${footer}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/** Botón principal (verificar email, ver pedido, etc.). */
export function emailButton(label: string, href: string): string {
  return `<p style="margin:28px 0;text-align:center">
    <a href="${href}" style="background:${BRAND_ACCENT};color:#ffffff;padding:12px 28px;border-radius:999px;text-decoration:none;font-weight:600;display:inline-block;font-size:15px">
      ${escapeHtml(label)}
    </a>
  </p>`;
}

export function emailMisComprasFooter(): string {
  const url = `${getAppBaseUrl()}/cuenta/mis-compras`;
  return `<p style="margin:0;font-size:13px;color:#64748b">
    ${BRAND_NAME} · <a href="${url}" style="color:${BRAND_COLOR}">Ver mis compras</a>
  </p>`;
}
