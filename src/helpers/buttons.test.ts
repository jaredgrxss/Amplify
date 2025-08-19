import {
  describe,
  test,
  expect,
  beforeEach,
  jest,
  beforeAll,
} from "@jest/globals";
import { MessageFlags } from "discord.js";

jest.resetModules();

const pausePlayback = jest.fn().mockReturnValue("Paused song - XXX");
const resumePlayback = jest.fn().mockReturnValue("Playing song - XXX");
const removePlayback = jest.fn().mockReturnValue("Playback removed");
const nextPlayback = jest.fn().mockReturnValue("Playing next song - XXX");
const prevPlayback = jest.fn().mockReturnValue("Playing previous song - XXX");
const shufflePlayback = jest.fn().mockReturnValue("Shuffled song - XXX");

const buildPlaybackComponents = jest.fn((...args: any[]) => [
  { kind: args[0] ? "playing" : "paused" },
]);

const saveToUsersSpotify = jest
  .fn()
  .mockReturnValue({ msg: "Saved to Spotify", components: [{ kind: "row" }] });

// Wire mocks to modules used by buttons.ts
jest.doMock(
  "../helpers/playback.js",
  () => ({
    pausePlayback,
    resumePlayback,
    removePlayback,
    nextPlayback,
    prevPlayback,
    shufflePlayback,
  }),
  { virtual: true }
);
jest.doMock(
  "./components.js",
  () => ({
    buildPlaybackComponents,
  }),
  { virtual: true }
);
jest.doMock(
  "./spotify.js",
  () => ({
    saveToUsersSpotify,
  }),
  { virtual: true }
);

let handleButtonInteraction: any;

beforeAll(async () => {
  const buttonsModule = await import("./buttons.js");
  handleButtonInteraction = buttonsModule.handleButtonInteraction;
});

function makeInteraction(customId: string) {
  const update = jest.fn();
  const reply = jest.fn();
  return {
    guildId: "guild-123",
    customId,
    update,
    reply,
  } as any;
}

describe("helpers/button.ts", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  describe("handleButtonInteraction", () => {
    test("play: resumes playback and updates with playing components", async () => {
      const interaction = makeInteraction("play");
      await handleButtonInteraction(interaction);
      expect(resumePlayback).toHaveBeenCalledWith("guild-123");
      expect(buildPlaybackComponents).toHaveBeenCalledWith(true);
      expect(interaction.update).toHaveBeenCalledWith({
        content: "Playing song - XXX",
        components: [{ kind: "playing" }],
      });
      expect(interaction.reply).not.toHaveBeenCalled();
    });
    test("pause: pauses playback and updates with paused components", async () => {
      const interaction = makeInteraction("pause");
      await handleButtonInteraction(interaction);

      expect(pausePlayback).toHaveBeenCalledWith("guild-123");
      expect(buildPlaybackComponents).toHaveBeenCalledWith(false);
      expect(interaction.update).toHaveBeenCalledWith({
        content: "Paused song - XXX",
        components: [{ kind: "paused" }],
      });
      expect(interaction.reply).not.toHaveBeenCalled();
    });
    test("remove: removes playback and clears components", async () => {
      const interaction = makeInteraction("remove");
      await handleButtonInteraction(interaction);

      expect(removePlayback).toHaveBeenCalledWith("guild-123");
      expect(interaction.update).toHaveBeenCalledWith({
        content: "Playback removed",
        components: [],
      });
      expect(interaction.reply).not.toHaveBeenCalled();
    });
    test("previous: goes to previous song and updates with playing components", async () => {
      const interaction = makeInteraction("previous");
      await handleButtonInteraction(interaction);

      expect(prevPlayback).toHaveBeenCalledWith("guild-123");
      expect(buildPlaybackComponents).toHaveBeenCalledWith(true);
      expect(interaction.update).toHaveBeenCalledWith({
        content: "Playing previous song - XXX",
        components: [{ kind: "playing" }],
      });
    });
    test("next: goes to next song and updates with playing components", async () => {
      const interaction = makeInteraction("next");
      await handleButtonInteraction(interaction);

      expect(nextPlayback).toHaveBeenCalledWith("guild-123");
      expect(buildPlaybackComponents).toHaveBeenCalledWith(true);
      expect(interaction.update).toHaveBeenCalledWith({
        content: "Playing next song - XXX",
        components: [{ kind: "playing" }],
      });
    });
    test("shuffle: shuffles and updates with playing components", async () => {
      const interaction = makeInteraction("shuffle");
      await handleButtonInteraction(interaction);

      expect(shufflePlayback).toHaveBeenCalledWith("guild-123");
      expect(buildPlaybackComponents).toHaveBeenCalledWith(true);
      expect(interaction.update).toHaveBeenCalledWith({
        content: "Shuffled song - XXX",
        components: [{ kind: "playing" }],
      });
    });
    test("save_spotify: replies ephemerally with save result, no update", async () => {
      const interaction = makeInteraction("save_spotify");
      await handleButtonInteraction(interaction);

      expect(saveToUsersSpotify).toHaveBeenCalledWith(interaction);
      expect(interaction.reply).toHaveBeenCalledWith({
        content: "Saved to Spotify",
        components: [{ kind: "row" }],
        flags: MessageFlags.Ephemeral,
      });
      expect(interaction.update).not.toHaveBeenCalled();
    });
    test("no guildId: returns early without update/reply", async () => {
      const interaction = { ...makeInteraction("play"), guildId: null };
      await handleButtonInteraction(interaction as any);

      expect(resumePlayback).not.toHaveBeenCalled();
      expect(interaction.update).not.toHaveBeenCalled();
      expect(interaction.reply).not.toHaveBeenCalled();
    });
  });
});
