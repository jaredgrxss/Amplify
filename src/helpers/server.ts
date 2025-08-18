import express, { Request, Response } from "express";
import { exchangeCodeForToken, storeUserToken } from "./spotify.js";
import { logger } from "./logger.js";

export function startAuthServer(port = Number(process.env.PORT ?? 3000)) {
  const app = express();

  app.get("/spotify/callback", async (req: Request, res: Response) => {
    const code = String(req.query.code ?? "");
    const state = String(req.query.state ?? "");

    if (!code || !state) {
      res.status(400).send("Missing code or state");
      return;
    }
    try {
      const token = await exchangeCodeForToken(code);
      storeUserToken(state, {
        access_token: token.access_token,
        refresh_token: token.refresh_token,
        expires_in: token.expires_in,
      });
      res.send(
        "Spotify linked! You can close this window and return to Discord."
      );
    } catch (err) {
      if (err instanceof Error) {
        res.status(500).send(`Auth failed: ${err.message}`);
      } else {
        res.status(500).send(`Auth failed: ${err}`);
      }
    }
  });
  app.listen(port, () => {
    logger.info(`[auth] Listening on http:/127.0.0.1:${port}`);
  });
}
