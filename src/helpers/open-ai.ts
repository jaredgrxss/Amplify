import { OpenAI } from "openai";
import { SongPick } from "../@types/open-ai.js";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

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
          required: ["title", "artist"],
          additionalProperties: false,
        },
        minItems: 1,
        maxItems: 3,
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
        content:
          "You recommend well-known, real songs. Only return songs that exist. Prefer tracks with clear artist/title matches on YouTube.",
      },
      {
        role: "user",
        content: `Give me 1–3 amazing ${genre} songs as JSON under 'picks'.`,
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
