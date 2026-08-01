import { getEvent } from "@/lib/events";
import { BRAND } from "@/content/brand";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * A real .ics download — the credential-free calendar integration.
 * No Google/Outlook OAuth app to register: every calendar app on
 * every platform already knows how to open this file.
 */
const fold = (line: string) => line.replace(/([^\n]{73})/g, "$1\r\n ");
const stamp = (ms: number) => new Date(ms).toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
const escapeText = (s: string) => s.replace(/[\\,;]/g, (c) => `\\${c}`).replace(/\n/g, "\\n");

export async function GET(req: Request) {
  const eventId = new URL(req.url).pathname.split("/").at(-2) ?? "";
  const event = await getEvent(eventId);
  if (!event) return new Response("Event not found.", { status: 404 });

  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    `PRODID:-//${BRAND.name}//Events//EN`,
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${event.id}@${BRAND.domain}`,
    `DTSTAMP:${stamp(Date.now())}`,
    `DTSTART:${stamp(event.startAt)}`,
    `DTEND:${stamp(event.endAt)}`,
    fold(`SUMMARY:${escapeText(event.title)}`),
    fold(`DESCRIPTION:${escapeText(event.description)}`),
    fold(`LOCATION:${escapeText(event.location)}`),
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");

  return new Response(ics, {
    headers: {
      "content-type": "text/calendar; charset=utf-8",
      "content-disposition": `attachment; filename="${event.id}.ics"`,
    },
  });
}
