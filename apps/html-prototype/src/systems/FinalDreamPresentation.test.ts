import { describe, expect, it } from "vitest";
import { finalDreamCredits, finalDreamEndingLines, finalDreamFrames, finalDreamMusic } from "../fixtures/finalDreamChapter.js";

describe("Final Dream narrative contract", () => {
  it("keeps the approved ending copy unchanged", () => {
    expect(finalDreamEndingLines).toEqual([
      "后来我还是醒了。",
      "没有多出来的那一天。",
      "有些事情后来没有发生，",
      "有些话也一直没有说完。",
      "没关系。",
      "至少有那么一段路，我们确实一起走过。",
      "你有你的下一站。",
      "我也该继续走了。",
      "可是天已经亮了。",
      "回家吧。"
    ]);
  });

  it("makes Tomorrow the only changed fact rather than a romance resolution", () => {
    const copy = finalDreamFrames.map((frame) => frame.text ?? "").join("\n");
    expect(copy).toContain("明天再走");
    expect(copy).toContain("没有告白");
    expect(copy).toContain("没有答案");
    expect(copy).toContain("你自己选择在这里待一下");
  });

  it("fades from faces toward backs and then an empty morning", () => {
    expect(finalDreamFrames[0].image).toContain("fd-01");
    expect(finalDreamFrames.at(-1)?.image).toContain("fd-09-10");
    expect(finalDreamEndingLines.at(-2)).toBe("可是天已经亮了。");
  });

  it("uses Dear D and the locked credits wording", () => {
    expect(finalDreamMusic).toContain("Dear D (亲爱的告诉你)");
    expect(finalDreamCredits).toEqual([
      "a game by Muji",
      "based on things that happened",
      "and one thing that didn't",
      "thank you for walking with me"
    ]);
  });
});
