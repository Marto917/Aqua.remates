import { NextResponse } from "next/server";

type NominatimItem = {
  display_name?: string;
  address?: {
    road?: string;
    house_number?: string;
    city?: string;
    town?: string;
    village?: string;
    state?: string;
    postcode?: string;
  };
};

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get("q")?.trim();
  if (!q || q.length < 4) {
    return NextResponse.json({ suggestions: [] });
  }

  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", `${q}, Argentina`);
  url.searchParams.set("format", "json");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("limit", "6");
  url.searchParams.set("countrycodes", "ar");

  try {
    const res = await fetch(url.toString(), {
      headers: { "User-Agent": "AquaRemates/1.0 (contacto@aquaremates.com.ar)" },
      next: { revalidate: 3600 },
    });
    if (!res.ok) return NextResponse.json({ suggestions: [] });

    const rows = (await res.json()) as NominatimItem[];
    const suggestions = rows
      .map((row) => {
        const addr = row.address ?? {};
        const street = addr.road?.trim() ?? "";
        const number = addr.house_number?.trim() ?? "";
        const city = (addr.city ?? addr.town ?? addr.village ?? "").trim();
        const province = (addr.state ?? "").trim();
        const postalCode = (addr.postcode ?? "").trim();
        if (!street) return null;
        return {
          display: row.display_name ?? `${street} ${number}, ${city}`,
          street,
          number,
          city,
          province,
          postalCode,
        };
      })
      .filter(Boolean);

    return NextResponse.json({ suggestions });
  } catch {
    return NextResponse.json({ suggestions: [] });
  }
}
