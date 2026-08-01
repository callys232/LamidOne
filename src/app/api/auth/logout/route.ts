import { handler, ok } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const POST = handler(async () => {
  const res = ok({ loggedOut: true });
  res.cookies.set("accessToken", "", { httpOnly: true, path: "/", maxAge: 0 });
  return res;
});
