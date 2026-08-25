import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { chapterRegistry, forestEntries, routeForestEntry } from "../src/systems/ChapterRegistry.js";
import { authoredRuntimeByScene } from "../src/systems/AuthoredChapterRegistry.js";
import { createDiaryLibrary, forestNodesForMonth } from "../src/systems/DiaryLibrary.js";
import { authoredChapterDiaryEntries } from "../src/fixtures/authoredDiaryEntries.js";
import { june24Assets, june24Chapter, june24EchoDialogues, june24FrameRegistries, june24ReflectionChoices, resolveJune24Actions } from "../src/fixtures/june24Chapter.js";
import type { SceneLayout } from "../src/systems/SceneLayouts.js";
import { applyChapterExperienceChoice, startChapterMemoryExperience } from "../src/systems/ChapterMemoryExperience.js";
import { createChapterTriggerSession, consumeAutomaticChapterTrigger, resetChapterTriggerSession } from "../src/systems/ChapterProgressManager.js";
import { emptyTendencies } from "../src/systems/TendencySystem.js";

const appRoot = process.cwd().endsWith("html-prototype") ? process.cwd() : resolve(process.cwd(), "apps/html-prototype");
const root = resolve(appRoot, "public/scene-layouts/624");
const readLayout = (orientation: "portrait" | "landscape") => JSON.parse(readFileSync(resolve(root, `${orientation}.json`), "utf8")) as SceneLayout;
const appSource = readFileSync(resolve(appRoot, "src/app.ts"), "utf8");

test("June 24 is registered with its authored diary entry", () => {
  assert.equal(chapterRegistry[june24Chapter.id], june24Chapter);
  assert.deepEqual(authoredChapterDiaryEntries.find((entry) => entry.id === june24Chapter.diaryEntryId), {
    id: "authored-diary-june24-only-came-for-you",
    source: "authored",
    chapterId: "june24-only-came-for-you",
    date: "2026-06-24",
    title: "06.24 · 只为你而来",
    body: [
      "早上有人告诉我，你在楼下。我嘴上说，关我什么事。过了几秒，还是问了一句，你怎么会在那里。",
      "后来去厕所的时候，我从楼上往下看，真的看见你坐着。于是我还是走过去，在你对面坐下。你问我为什么会在那里，我说我没有课。你不信。我最后只好笑着说，我就是特地来找你的。",
      "有些实话好像只有装成玩笑，才比较容易说出口。",
      "现在想起来，那句话大概是真的。只是那时候我很喜欢把真的东西说得像假的。这样如果对方没有接住，我还可以假装自己本来就在开玩笑。",
      "我坐在你对面看你读书。你看了一下我脖子上的伤，我跑去买了一杯难喝得要命的 carrot milk，又把它留给你。你喝了一口就骂我，到底谁家好人会喝萝卜。",
      "后来我又回来坐着。我们不知道怎么聊，突然说到了放飞机。于是我第一次告诉你，五月二十三号那天，我真的去了。",
      "你完全不相信。",
      "我说真的啊。你还是说我一定在车大炮。于是我打开相册，想把那天拍到的东西翻给你看。我才刚开始找，你就伸手按住我的手。",
      "“ok，我懂了，不用翻了。”",
      "然后你问我，为什么那时候不叫住你。",
      "我记得我反问了好几次：叫住你？怎么叫？为什么要叫？",
      "你说，就喊你的名字，然后走过来告诉你，我真的来了。",
      "其实听起来很简单。",
      "那天如果我喊一声，你大概真的会回头。后来我也想过，如果当时真的叫了，五月二十三会不会变成另一种记忆。可能我们会散一下步，可能我不会一个人在那里绕那么久，也可能什么都不会改变。",
      "可是已经没有办法知道了。",
      "你后来小声说，对不起。你说你以为我在车大炮。又过了一会儿，你说想到那天我真的来了，你却跟别人走掉，会觉得很愧疚。",
      "我那时候没有回答。",
      "不是因为还在生气。只是忽然不知道应该怎样安慰你。五月二十三号的我确实很难过；六月二十四号的你也确实不是故意让她难过。两件事情放在一起，好像没有谁需要被判输赢。",
      "后来被理解是一件很奇怪的事。它不会修改已经发生过的那一天，也不会把一个人走过的路退回来。可是有些一直卡在记忆里的东西，会突然松一点。",
      "至少从那天以后，我不需要再一个人知道这件事。",
      "我真的去过。",
      "你也终于相信了。"
    ].join("\n\n"),
    location: "the study table",
    weather: "quiet afternoon",
    memoryKind: "chapter",
    mood: "quiet",
    photos: [],
    scrapbookLayout: { elements: [] }
  });
});

test("June 24 keeps the authored layout trigger and semantic asset mapping", () => {
  for (const orientation of ["portrait", "landscape"] as const) {
    const layout = readLayout(orientation);
    assert.equal(layout.sceneId, "624");
    assert.equal(layout.triggers.find((trigger) => trigger.id === "june24-table-arrival")?.eventId, "june24-table-memory");
    assert.equal(layout.triggers.find((trigger) => trigger.id === "june24-table-arrival")?.once, true);
  }
  const actions = resolveJune24Actions(readLayout("portrait"), "main");
  const firstSpawn = actions.find((action) => action.type === "spawn");
  assert.equal(firstSpawn?.type, "spawn");
  if (firstSpawn?.type === "spawn") assert.equal(firstSpawn.sprite?.assetId, june24FrameRegistries.et.right[0]);
  assert.equal(june24FrameRegistries.ms.up[1], "assets/624/ms-base/up/up-02.png");
  assert.equal(june24FrameRegistries.ms.up[2], "assets/624/ms-base/up/up-03.png");
  assert.equal(june24FrameRegistries.ms.up[3], "assets/624/ms-base/up/up-04.png");
  assert.equal(june24FrameRegistries.et.right[0], "assets/624/624-table/table-facing-right/01-sitting-reading.png");
});

test("June 24 main sequence preserves cause, reaction, dialogue and reflection checkpoints", () => {
  const actions = resolveJune24Actions(readLayout("portrait"), "main");
  const phoneShow = actions.findIndex((action) => action.type === "sprite" && action.sprite.assetId.includes("02-show-phone"));
  const stop = actions.findIndex((action) => action.type === "sprite" && action.sprite.assetId.includes("04-hand-stop-phone"));
  const reaction = actions.findIndex((action) => action.type === "sprite" && action.sprite.assetId.includes("03-phone-hand-stopped-reaction"));
  const noFlip = actions.findIndex((action) => action.type === "dialogue" && action.text.includes("不用翻"));
  assert.ok(phoneShow >= 0 && phoneShow < stop && stop < reaction && reaction < noFlip);
  assert.deepEqual(june24ReflectionChoices.map((reflection) => reflection.id), ["june24-reflection-1", "june24-reflection-2", "june24-reflection-3"]);
  assert.equal(actions.filter((action) => action.type === "checkpoint").length, 3);
  assert.equal(new Set(actions.filter((action) => action.type === "spawn").map((action) => action.actor)).size, 2);
});

test("June 24 approach uses the authored cycle, scale, facing, and feet metadata", () => {
  const actions = resolveJune24Actions(readLayout("portrait"), "main");
  const approach = actions.find((action) => action.type === "move" && action.actor === "ms");
  assert.equal(approach?.type, "move");
  if (approach?.type === "move") {
    assert.deepEqual(approach.spriteCycle?.map((frame) => frame.assetId), [
      "assets/624/ms-base/up/up-02.png",
      "assets/624/ms-base/up/up-03.png",
      "assets/624/ms-base/up/up-04.png",
      "assets/624/ms-base/up/up-03.png"
    ]);
    assert.equal(approach.visualScale, 0.3);
    assert.equal(approach.arrivalFacing, "left");
    assert.equal(approach.x, readLayout("portrait").anchors["ms-table-approach"].x);
  }
  assert.deepEqual(june24Assets["assets/624/ms-base/up/up-03.png"].feet, { x: 0.5, y: 1 });
});
test("June 24 table states retarget both actors to their authored anchors", () => {
  const layout = readLayout("portrait");
  const actions = resolveJune24Actions(layout, "main");
  const expectedMoves = [
    ["ms", "ms-first-seat", "01-sitting-opposite"],
    ["ms", "ms-carrot-seat", "04-hold-carrot-milk"],
    ["et", "et-carrot-seat", "05-drink-carrot-milk"],
    ["ms", "ms-second-seat", "01-sitting-opposite"],
    ["ms", "ms-xiaoba-give", "05-give-xiaoba"],
    ["et", "et-xiaoba-receive", "06-hold-ugly-xiaoba"],
    ["ms", "ms-phone-show", "02-show-phone"],
    ["et", "et-phone-stop", "04-hand-stop-phone"],
    ["ms", "ms-head-down-seat", "06-head-down-table"],
    ["et", "et-guilt-seat", "07-guilt-quiet"],
    ["ms", "ms-goodbye-stand", "07-goodbye-stand"],
    ["et", "et-goodbye-look", "08-goodbye-look"]
  ] as const;
  for (const [actor, anchor, assetSuffix] of expectedMoves) {
    const target = layout.anchors[anchor];
    const action = actions.find((candidate) => candidate.type === "move" && candidate.actor === actor && candidate.sprite?.assetId?.endsWith(assetSuffix + ".png") && candidate.x === target.x && candidate.y === target.y);
    assert.equal(action?.type, "move", actor + " " + assetSuffix + " must be an authored-anchor move");
    if (action?.type === "move") {
      assert.deepEqual({ x: action.x, y: action.y }, target);
    }
  }
});

test("June 24 authored interactions win over overlapping residue fallbacks", () => {
  assert.match(appSource, /this\.activeObject = availableInteraction\?\.id \?\? echoActive \?\? ""/);
  assert.deepEqual(authoredRuntimeByScene["624"]?.echoPortraitIds, {
    "carrot-milk-memory": "june24-angela-st-echo",
    "five-cent-memory": "june24-room-study-echo",
    "xiaoba-memory": "june24-haircut-echo"
  });
});
test("June 24 shares full replay progression while protecting first-completion contribution", () => {
  const first = startChapterMemoryExperience({
    chapterId: june24Chapter.id,
    eventId: june24Chapter.canonicalClosure.historicalEventId,
    mode: "automatic",
    baselineTendencies: emptyTendencies(),
    firstCompletionPending: true
  });
  const firstRun = applyChapterExperienceChoice(first, june24ReflectionChoices[0].choices[0]);
  const replay = startChapterMemoryExperience({
    chapterId: june24Chapter.id,
    eventId: june24Chapter.canonicalClosure.historicalEventId,
    mode: "manual-replay",
    baselineTendencies: emptyTendencies(),
    firstCompletionPending: false
  });
  const replayRun = applyChapterExperienceChoice(replay, june24ReflectionChoices[1].choices[1]);
  assert.equal(firstRun.choiceIds.length, 1);
  assert.equal(replayRun.choiceIds.length, 1);
  assert.deepEqual(replayRun.persistentContribution, emptyTendencies());
  assert.equal(replayRun.eventId, june24Chapter.canonicalClosure.historicalEventId);
});

test("June 24 automatic trigger resets on re-entry and Echo Portraits are independent", () => {
  let session = createChapterTriggerSession(june24Chapter.id);
  const first = consumeAutomaticChapterTrigger(session);
  assert.equal(first.allowed, true);
  session = resetChapterTriggerSession(first.session);
  assert.equal(consumeAutomaticChapterTrigger(session).allowed, true);
  assert.equal(authoredRuntimeByScene["624"]?.echoRequiresMainCompletion, false);
  assert.match(appSource, /private startEchoPortrait/);
  assert.match(appSource, /echo-portrait-next/);
});

test("June 24 has a Forest entrance that routes into Scene 624", () => {
  const entry = forestEntries.find((item) => item.chapterId === june24Chapter.id);
  assert.ok(entry, "June 24 must be registered as a Forest door");
  assert.equal(entry?.date, "06.24");
  assert.equal(forestNodesForMonth(forestEntries, createDiaryLibrary(), "2026-06").some((item) => item.id === entry?.id), true);
  const route = routeForestEntry(entry!);
  assert.equal(route.kind, "implemented-chapter");
  if (route.kind === "implemented-chapter") {
    assert.equal(route.chapter.id, june24Chapter.id);
    assert.equal(route.chapter.runtimeScene, "624");
  }
});


test("June 24 follows the exact authored dialogue sequence", () => {
  const dialogue = resolveJune24Actions(readLayout("portrait"), "main")
    .filter((action) => action.type === "dialogue")
    .map((action) => action.speaker + ": " + action.text);
  assert.deepEqual(dialogue, [
    "ET: 哈喽",
    "MS: hi屁噢",
    "ET: zomok你在这里的\n你怎样知道我在这里\n你不用上课吗",
    "MS: 我没有上课啊",
    "ET: 骗人\nangela讲你们上philosophy",
    "MS: 对啊angela上罢了",
    "ET: 真的么",
    "MS: 对啊我没有上课\n特地来这里只为了找你的",
    "MS: 我现在不止钱包破洞\n脖子也破洞",
    "ET: 哇你一大早就喝冰的 够力",
    "ET: 你看我的小八可爱吗",
    "MS: 可爱啊 欸我有更可爱的\n等下我拿给你 嘿嘿",
    "ET: 一定是很丑的\n我不要 你不要来了",
    "MS: 谁理你 就来",
    "ET: walao你不要留这杯东西在这边\n等下我喝掉",
    "MS: 给你喝咯\n我不要了 很难喝\n等下要丢了",
    "ET: walao难喝就给我啦",
    "ET: 哇老你喝什么东西来的\n够难喝哦\nteh tarik吗",
    "MS: 萝卜啊",
    "ET: 哇靠谁家好人喝萝卜",
    "ET: 你要一直坐在这里吗？你朋友几时来哦",
    "MS: 怎么？我就是想坐在这里看你读书啊\n你越不给我在这里\n我越要在这里",
    "MS: 其实我5月23号那天真的去了",
    "ET: 真的吗\n你不要骗我",
    "MS: 真的啊",
    "ET: 我不信\n你一定是在车大炮",
    "MS: 包真的啊\n我还看到你的背影了",
    "ET: ok我懂了不用翻相册了\n为什么你那时候不叫住我",
    "MS: 叫住你？\n怎样叫住你？",
    "MS: 为什么要叫住你？",
    "ET: 喊我名字\n然后过来跟我讲你真的来了啊",
    "MS: 可是我那他不是早就说过我到了吗",
    "ET: 呜呜呜呜\n对不起\n我以为你在车大炮",
    "MS: 我从来没有骗过你\n一直都是你在放我飞机",
    "ET: 对不起",
    "MS: 对不起然后呢\n后续呢",
    "ET: 我真的没时间了\n这个礼拜final week\n下个礼拜study week\n后个礼拜就exam了",
    "MS: 呜呜呜 ",
    "ET: 哎呀你干嘛 不要扮可怜勒\nok咯拜四我们去散步",
    "MS: 你看我信吗\n你走过来我宿舍咯",
    "ET: 看你信不信咯\n就是明天",
    "MS: 呵呵",
    "ET: 球球你不要转那个五毛回来了\n等下欠人东西我心里总觉得不踏实",
    "MS: ok那我不要还你\n然后也继续讲你\n我不亏诶",
    "ET: 可以啊\n至少我知道我还了",
    "ET: 我很愧疚",
    "MS: 怎么了",
    "ET: 想到那天你来了\n可是我和别人走掉了",
    "MS: 我朋友来带我走了\n你开心了咯",
    "MS: 我靠你们琢磨偷拍我",
    "ET: 哇靠琢磨他们突然要拍你"
  ]);
  assert.equal(dialogue.some((line) => line.includes("我只为你而来")), false);
  assert.equal(dialogue.some((line) => line.includes("不用翻给我看")), false);
});

test("June 24 keeps the authored physical beat order and exact table states", () => {
  const actions = resolveJune24Actions(readLayout("portrait"), "main");
  const spritePaths = actions.filter((action) => action.type === "sprite").map((action) => action.sprite.assetId);
  assert.deepEqual(spritePaths, [
    "assets/624/624-table/table-facing-left/01-sitting-opposite.png",
    "assets/624/624-table/table-facing-left/04-hold-carrot-milk.png",
    "assets/624/624-table/table-facing-right/05-drink-carrot-milk.png",
    "assets/624/624-table/table-facing-left/01-sitting-opposite.png",
    "assets/624/624-table/table-facing-right/01-sitting-reading.png",
    "assets/624/624-table/table-facing-left/05-give-xiaoba.png",
    "assets/624/624-table/table-facing-right/06-hold-ugly-xiaoba.png",
    "assets/624/624-table/table-facing-left/01-sitting-opposite.png",
    "assets/624/624-table/table-facing-right/03-surprised-5-23.png",
    "assets/624/624-table/table-facing-left/02-show-phone.png",
    "assets/624/624-table/table-facing-right/04-hand-stop-phone.png",
    "assets/624/624-table/table-facing-left/03-phone-hand-stopped-reaction.png",
    "assets/624/624-table/table-facing-right/07-guilt-quiet.png",
    "assets/624/624-table/table-facing-left/06-head-down-table.png",
    "assets/624/624-table/table-facing-right/01-sitting-reading.png",
    "assets/624/624-table/table-facing-left/07-goodbye-stand.png",
    "assets/624/624-table/table-facing-right/08-goodbye-look.png"  ]);
  const indices = {
    show: actions.findIndex((action) => action.type === "sprite" && action.sprite.assetId.endsWith("02-show-phone.png")),
    stop: actions.findIndex((action) => action.type === "sprite" && action.sprite.assetId.endsWith("04-hand-stop-phone.png")),
    reaction: actions.findIndex((action) => action.type === "sprite" && action.sprite.assetId.endsWith("03-phone-hand-stopped-reaction.png")),
    dialogue: actions.findIndex((action) => action.type === "dialogue" && action.text.startsWith("ok我懂了不用翻相册了"))
  };
  assert.ok(indices.show < indices.stop && indices.stop < indices.reaction && indices.reaction < indices.dialogue);
  assert.equal(actions.filter((action) => action.type === "wait").some((action) => action.duration >= 0.28), true);
});

test("June 24 reflection choices use the authored prompts, responses, and effects", () => {
  assert.deepEqual(june24ReflectionChoices, [
    {
      id: "june24-reflection-1",
      prompt: "后来知道她真的以为你没来，\n那 5 月 23 日会变得不一样吗？",
      choices: [
        { id: "june24-reflection-1-a", label: "会吧。至少我终于知道她当时在想什么。", effects: { acceptance: 1, honesty: 1 }, response: "知道后来发生了什么，\n和重新走一遍那天，不是一回事。" },
        { id: "june24-reflection-1-b", label: "不会。那天我还是一个人走了那么久。", effects: { honesty: 1, distance: 1 }, response: "对。\n后来的解释没有替当时的你走那段路。" },
        { id: "june24-reflection-1-c", label: "我不知道。\n好像轻了一点，又没有真的轻。", effects: { acceptance: 1, companionship: 1 }, response: "有些答案只是把空白填上。\n不一定会把重量拿走。" }
      ]
    },
    {
      id: "june24-reflection-2",
      prompt: "她问“为什么你那时候不叫住我”，\n你最在意的是哪一部分？",
      choices: [
        { id: "june24-reflection-2-a", label: "我明明已经说过“我到了”。", effects: { honesty: 1 }, response: "那句话那天就已经在那里。" },
        { id: "june24-reflection-2-b", label: "原来她真的以为我没有来。", effects: { acceptance: 1, closeness: 1 }, response: "这件事，\n你到一个月后才知道。" },
        { id: "june24-reflection-2-c", label: "为什么最后还是要我再走过去一次。", effects: { distance: 1, honesty: 1 }, response: "当时的你，\n也问过类似的问题。" }
      ]
    },
    {
      id: "june24-reflection-3",
      prompt: "她说“我很愧疚”的时候，\n你为什么没有说话？",
      choices: [
        { id: "june24-reflection-3-a", label: "因为那时候的我确实觉得自己那时候有点可怜。", effects: { honesty: 1, acceptance: 1 }, response: "你没有替过去的自己否认这件事。" },
        { id: "june24-reflection-3-b", label: "因为我不知道该不该原谅什么。", effects: { avoidance: 1, acceptance: 1 }, response: "也不一定需要当场决定。" },
        { id: "june24-reflection-3-c", label: "因为听到她也记得，\n我已经够了。", effects: { closeness: 1, companionship: 1 }, response: "那一刻没有再多一句。" }
      ]
    }
  ]);
});

test("June 24 Echoes use the exact secondary memories and stop at their uncertainty", () => {
  assert.deepEqual(june24EchoDialogues["june24-angela-st-echo"], [
    { speaker: "Angela", text: "诶你没有看到et吗\n她在楼下坐着诶\n你没有去找她吗" },
    { speaker: "MS", text: "蛤\n我zomok会看到她" },
    { speaker: "ST", text: "她现在眼里已经没有et了" },
    { speaker: "MS", text: "啊对对对" },
    { speaker: "MS", text: "。。。\n她现在在楼下？\n为啥 她在这里干嘛" },
    { speaker: "Angela", text: "温习吧\n对 她就在这里楼下坐着\n你现在下去就可以看到她了" },
    { speaker: "MS", text: "噢噢\n。。。\n科科" }
  ]);
  assert.deepEqual(june24EchoDialogues["june24-room-study-echo"], [
    { speaker: "ET", text: "我明天可以申请我不要散步吗\n我要做功课\n我在你那里做功课就好😂" },
    { speaker: "MS", text: "可以啊\n认真的\n你走路来咯" },
    { speaker: "ET", text: "如果你不得空\n我们就取消 哈哈哈" },
    { speaker: "MS", text: "我就是不要啊\n我就看你会不会走路来\n我不得空也可以有空的" },
    { speaker: "ET", text: "okokok\n你明天等我走来" }
  ]);
  assert.deepEqual(june24EchoDialogues["june24-haircut-echo"], [
    { speaker: "MS", text: "你刘海长了欸\n我可以帮你剪" },
    { speaker: "ET", text: "我理你都傻" },
    { speaker: "MS", text: "我妈妈可以帮你剪\n你放假来我家\n我妈妈免费帮你剪头发➕染头发" },
    { speaker: "ET", text: "考完试收拾完房间再看" },
    { speaker: "MS", text: "希望这次不要再放我飞机了" }
  ]);
  assert.equal(june24EchoDialogues["june24-room-study-echo"].at(-1)?.text.includes("你明天等我走来"), true);
  assert.equal(june24EchoDialogues["june24-haircut-echo"].at(-1)?.text.includes("放我飞机了"), true);
});
