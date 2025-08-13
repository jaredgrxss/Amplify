import { OpenAI } from "openai";
import { SongPick } from "../@types/open-ai.js";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const exclusions: SongPick[] = [];

export async function getSongByGenre(genre: string): Promise<SongPick[]> {
  const schema = {
    type: "object",
    properties: {
      picks: {
        type: "array",
        items: {
          type: "object",
          properties: {
            title: { type: "string" },
            artist: { type: "string" },
            year: { type: "number" },
          },
          required: ["title", "artist", "year"],
          additionalProperties: false,
        },
        minItems: 1,
        maxItems: 15,
      },
    },
    required: ["picks"],
    additionalProperties: false,
  } as const;

  const res = await openai.chat.completions.create({
    model: "gpt-5-nano",
    messages: [
      {
        role: "system",
        content: `You are a meticulous music selector.
            Rules:
            - Return exactly 15 unique songs under "picks".
            - Prefer releases from the last 5 years UNLESS the genre name itself encodes a period (e.g., "80s synthpop", "1994 hip-hop").
            - Avoid any song whose {title, artist} appears in the provided exclusions.
            - Mix well-known and lesser-known picks; avoid repeating the same artist >1 time unless the genre is extremely narrow.
            - Validate years realistically for the artist/title.
            - No commentary outside JSON.
            `,
      },
      {
        role: "user",
        content: `Select songs for genre: "${genre}. Avoid any in the exclusions provided next.`,
      },
      {
        role: "user",
        content: `Exclusions (JSON): ${JSON.stringify({
          exclusions,
        })}`,
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: { name: "SongPicks", schema, strict: true },
    },
  });

  const json = JSON.parse(res.choices[0]?.message.content || "{}");
  return json.picks as SongPick[];
}

export async function getPlaylistsByVibe(vibe: string): Promise<SongPick[]> {
  console.log(vibe);
  return [
    { artist: "something", title: "something", year: 2000 },
  ] as SongPick[];
}
