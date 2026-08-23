# April 5 Scene 405 Visual Semantic Map

Status: locked before implementation on 2026-08-22.

Source checks:

- Latest fetched `origin/main`: `5d14e1c2722334d6e1d1f647b4d69255704a822c`.
- Current implementation branch: `mobile-layout`; working tree was clean before this document was added.
- Authored geometry remains the source of truth in `apps/html-prototype/public/scene-layouts/405/landscape.json` and `portrait.json`.
- The 405 approved PNGs were inspected frame-by-frame. Their dimensions and transparent visible bounds were measured without altering the source assets.

## Identity and facing map

| Semantic actor/state | Approved source | Visual meaning | Runtime identity/facing rule |
| --- | --- | --- | --- |
| MS waiting / canonical spray | `assets/330/ms-base.png`; `assets/405/405-water-spraying/frame-01.png..frame-08.png` | White-shirt MS; the Xiaoba water gun is visibly baked into the dedicated action frames | Dedicated 405 family, source faces left, `mirrorForLeft: false`, measured feet and nozzle metadata; actor `ms` only |
| ET waiting / canonical reaction | `assets/330/yet-base.png`; `assets/405/405-water-sprayed/et-april05-water-sprayed-frame-01.png..08.png` | Dark-outfit, long-haired ET receiving the spray | Dedicated 405 individual PNGs with irregular source sizes, visible bounds, and per-frame feet; actor `et` only |
| Water gun prop | `assets/330/water-gun.png` | One canonical physical water gun | One prop id, `water-gun`, owned by MS only while visible; no duplicate echo prop |
| Water spray VFX | `assets/330/water-vfx.png` | Horizontal water travel from nozzle to target | Reuse March 30 water-vfx geometry; effect has actor `ms`/target and no extra event |
| ST | `assets/405/friend/su/1.png..16.png` | Gray shirt, glasses, ponytail; front, side walk, back states | Always actor id `st`; `su=ST`; do not swap with Angela |
| Angela | `assets/405/friend/te/1.png..16.png` | Black S shirt, ponytail; front, side walk, back states | Always actor id `angela`; `te=Angela`; do not swap with ST |
| ET hair-ruffle action | `assets/405/405-hair-ruffle/01.png..08.png` | Black outfit: approach, reach, touch/ruffle, recover | Use frames in authored order `01 → 02 → 03 → 04 → 05 → 06 → 07 → 08`; ET actor only |
| MS hair-ruffled reaction | `assets/405/405-hair-ruffled/01.png..08.png` | White shirt/backpack: receives ruffle, rubs head, settles | Use frames in authored order `01 → 02 → 03 → 04 → 05 → 06 → 07 → 08`; MS actor only |
| ET lock sequence | `assets/405/lock/01.png..08.png` | Black outfit: stand, sit, reach, fold/settle | Use frames `01 → 02 → 03 → 04 → 05 → 06 → 07 → 08`; ET actor only |
| MS locked reaction | `assets/405/locked/01.png..08.png` | White shirt: seated side-lock reaction and settle | Use frames `01 → 02 → 03 → 04 → 05 → 06 → 07 → 08`; MS actor only |

## Visible-bounds and feet-anchor findings

All 405 individual action PNGs are irregularly cropped. The renderer must use each file's full source rectangle plus its transparent visible bounds and normalized feet point. The inspected frame families share these practical facts:

- Hair ruffle/reaction files are `384×512`; visible bottoms vary from approximately source y `450` to `502`.
- ET lock files vary from `321×512` through `384×512` and include seated frames with bottoms around source y `446`–`510`.
- ST files vary from `175×287` through `250×334`; Angela files vary from `159×309` through `236×326`.
- The 16-state friend sets are not a uniform sprite sheet. They must be individual metadata entries, not a guessed 4×4 crop grid.
- `feet.y` is the visible bottom, not the PNG height. `feet.x` is the visible-bounds midpoint. `mirrorForLeft` is not needed for these already-facing individual PNGs.
- Reused March 30 sheets continue to use their existing per-frame visible bounds, feet, and horizontal mirror behavior.

## Visually verified water-frame chronology

The individual PNGs were inspected as images, not ordered from filenames alone. The runtime uses this semantic order:

| Frame | MS `405-water-spraying` | ET `405-water-sprayed` |
| --- | --- | --- |
| 01 | Holding/preparation; gun held at the torso | Neutral/pre-impact |
| 02 | Raise/aim | First hit enters the reaction |
| 03 | Settle the aim toward the left | Flinch begins; eyes/face turn into the hit |
| 04 | Active leftward spray begins | Stronger flinch |
| 05 | Follow-through with the gun extended | Peak sprayed reaction begins |
| 06 | Peak leftward spray with visible water | Strong sprayed reaction / recoil |
| 07 | Follow-through recovery | Recovery from the flinch |
| 08 | Recovery/return to a held-gun stance | Neutral recovery while remaining ET |

Identity contract: `405-water-spraying` is the MS visual identity (white-shirt MS spraying ET); `405-water-sprayed` is the ET visual identity (dark-outfit long-haired ET receiving the spray). MS frames are all `408×536`; ET frames use their natural irregular sizes `[384×502, 363×499, 380×467, 356×446, 348×469, 359×498, 353×471, 293×497]`. Each asset stores measured alpha visible bounds and a normalized feet point derived from its shoe baseline so the irregular ET source rectangles share the authored world foot anchor. The dedicated MS family also stores a nozzle origin for the shared VFX geometry.
## Main-memory order

The semantic runtime order is fixed and must be preserved in both orientations. The resolver maps every position through `layout.anchors`; it never copies or recalculates coordinates.

1. Spawn MS, Angela, and ST at `ms-wait-position`, `angela-wait-position`, and `st-wait-position`; ET is absent. Dialogue: `ei你在宿舍吗` → `在啊怎么 你来了啊 不要跟我讲你又晚上骑脚车` → `是诶我在你门口 你下来一下`.
2. Spawn ET at `et-entrance-spawn`, move to `et-arrival-position`.
3. Move MS to `ms-spray-position`; hide the MS-owned separate prop before the baked-gun frame sequence, show MS `405-water-spraying/01..08`, travel one leftward VFX from MS to ET, then show ET `405-water-sprayed/01..08` and only then ET says `！！？？wtf`.
4. Move ET through `et-ruffle-start` and `et-ruffle-contact`; play paired ET hair-ruffle and MS hair-ruffled frames; then the humorous ET line.
5. Move ET through `et-trash-start` and `et-trash-position`; MS moves to `ms-friends-spray-position`, sprays Angela and ST at their authored sprayed positions, then ET returns through `et-trash-return`.
6. Play the paired seated side-lock using `et-lock-position` and `ms-locked-target`, with ET `lock/*` and MS `locked/*` state families.
7. Continue abstract banter.
8. Speak the April 5/sad-thing beat, then checkpoint reflection point 1.
9. Speak the happy-because-see-you beat, then checkpoint reflection point 2.
10. Speak the bicycle/package/6AM/quiz beat, then checkpoint reflection point 3.
11. Speak the fixed goodbye lines, then move ET through `et-goodbye-position` and `et-exit-position`; only after the final goodbye line fade/despawn actors.

## Echo and authored keys

The `watergun-crossing` / `r-watergun-crossing` alias contract belongs to the existing 406 morning echo and must remain unchanged. April 5 does not add those keys. Its authored secondary echo anchors are exactly `cat-approach`, `bicycle-st-comment`, and `phone-after-return`; the 405 runtime must not add another anchor or duplicate an echo event.

The three optional echo anchors are exactly `cat-approach`, `bicycle-st-comment`, and `phone-after-return`. They map to `cat-echo`, `bicycle`, and the later phone-after-return message echo. They are not additional main-memory triggers or persistent completion events.


## Beat-level contract

| Beat id | Actor/state | Exact source/state | Authored anchor | Required topology/facing | Flip/fallback |
| --- | --- | --- | --- | --- | --- |
| 405-group-wait | MS, Angela, ST | March 30 base states plus `te/1.png`, `su/1.png` | `ms-wait-position`, `angela-wait-position`, `st-wait-position` | Ordinary conversation facing; ET is absent | No dedicated-action fallback issue |
| 405-et-enter / 405-et-arrive | ET | March 30 ET base walking/idle | `et-entrance-spawn` → `et-arrival-position` | Preserve canonical approach facing; movement does not decide facing | Use existing sheet mirror only when source metadata allows |
| 405-ms-aim-water | MS | `405-water-spraying/frame-01..08` | `ms-spray-position` | MS is right of ET and visibly aims left | Dedicated 405 source order; no March 30 spray fallback |
| 405-water-hit-et / 405-et-react-wtf | MS, ET, VFX | MS `405-water-spraying/01..08`, ET `405-water-sprayed/01..08`, `water-vfx` | `ms-spray-position`, `et-sprayed-position` | `ET.x < MS.x`; VFX travels left from MS to ET; ET reaction appears after VFX; dialogue remains ET | One VFX, no 330 spray fallback |
| 405-et-ruffle-approach / reach / contact / release | ET and MS | `405-hair-ruffle/01..08` paired semantically with `405-hair-ruffled/01..08` | `et-ruffle-start` → `et-ruffle-contact`, MS at `ms-ruffle-target` | `ET.x < MS.x`; ET acts toward MS | No numeric-index blind pairing; no base fallback |
| 405-et-trash-depart / arrive / return | ET | March 30 ET base movement | `et-trash-start` → `et-trash-position` → `et-trash-return` | Preserve authored walk facing | No new trash asset |
| 405-ms-spray-friends | MS, Angela, ST | Dedicated 405 MS spraying frame 04 plus `te/*` and `su/*` reaction states | `ms-friends-spray-position`, `angela-sprayed-position`, `st-sprayed-position` | Keep ST=`su`, Angela=`te`; MS still owns the visible spray | No identity fallback/swap |
| 405-et-lock-init / contact / hold | ET and MS | `lock/01..08` paired semantically with `locked/01..08` | `et-lock-position`, `ms-locked-target` | `ET.x < MS.x`; playful loose side-lock, not romance or violence | No numeric-index blind pairing; no base fallback |
| 405-april-five-question / sad-thing / happy-because-see-you | ET/MS | Base/settled action state | `et-final-talk-position`, `ms-final-talk-position` | RPG_BOTTOM only; ST opinion stays interpretation | No VN portrait by default |
| 405-et-sneeze / goodbye / exit | ET | Settled/goodbye base state | `et-goodbye-position` → `et-exit-position` | Goodbye dialogue resolves before fade/despawn | No early despawn |

The dedicated 405 MS spraying frames visibly include the Xiaoba water gun. The separate `water-gun` prop is visible only during the lead-in, owned by MS, then hidden before `ms-water-spraying-01`; during the baked-gun frames there is exactly one gun total. ET never owns the prop. The optional echo has no physical prop and no second persistent event.
