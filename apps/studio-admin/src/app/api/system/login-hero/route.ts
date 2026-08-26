import { NextRequest, NextResponse } from "next/server";

// In-memory fallback cache across requests in the Node server instance
let currentGlobalLoginHeroId = "fig-01";

export async function GET(req: NextRequest) {
  // Read from cookie first, fallback to in-memory state
  const cookieHero = req.cookies.get("k2net_global_login_hero")?.value;
  const activeHeroId = cookieHero || currentGlobalLoginHeroId;

  return NextResponse.json(
    { activeHeroId },
    {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    }
  );
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const heroId = body.id || "fig-01";

    currentGlobalLoginHeroId = heroId;

    const response = NextResponse.json({ success: true, activeHeroId: heroId });

    // Set cookie across whole domain for 1 year so any browser sees it
    response.cookies.set("k2net_global_login_hero", heroId, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365, // 1 year
      sameSite: "lax",
      httpOnly: false, // accessible to client for fast hydration
    });

    return response;
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 400 });
  }
}
