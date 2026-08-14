from __future__ import annotations

from pathlib import Path
from typing import Iterable, Sequence

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / ".private-spec" / "art" / "production"
DEST = ROOT / "apps" / "game" / "assets" / "external"


def board(name: str) -> Image.Image:
    return Image.open(SOURCE / name).convert("RGBA")


def cut(source: Image.Image, box: tuple[int, int, int, int], size: tuple[int, int]) -> Image.Image:
    crop = source.crop(box).convert("RGBA")
    pixels = crop.load()
    for y in range(crop.height):
        for x in range(crop.width):
            r, g, b, a = pixels[x, y]
            if r < 18 and g < 24 and b < 28:
                pixels[x, y] = (0, 0, 0, 0)
            elif r < 32 and g < 38 and b < 44 and abs(r - g) < 12 and abs(g - b) < 14:
                pixels[x, y] = (0, 0, 0, 0)
    crop = crop.resize(size, Image.Resampling.LANCZOS)
    return crop


def paste_grid(target: Image.Image, images: Sequence[Image.Image], columns: int, cell: tuple[int, int]) -> None:
    for index, image in enumerate(images):
        x = (index % columns) * cell[0]
        y = (index // columns) * cell[1]
        target.alpha_composite(image, (x, y))


def pad(image: Image.Image, size: tuple[int, int]) -> Image.Image:
    padded = Image.new("RGBA", size, (0, 0, 0, 0))
    padded.alpha_composite(image, (0, 0))
    return padded


def restrain_palette(image: Image.Image, colors: int = 64) -> Image.Image:
    alpha = image.getchannel("A").point(lambda value: 255 if value >= 64 else 0)
    rgb = Image.new("RGB", image.size, (0, 0, 0))
    rgb.paste(image.convert("RGB"), mask=alpha)
    quantized = rgb.quantize(colors=colors, method=Image.Quantize.MEDIANCUT).convert("RGBA")
    quantized.putalpha(alpha)
    return quantized


def save(path: Path, image: Image.Image) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    restrain_palette(image).save(path)


def character_sheet(source_name: str, rows: Sequence[Sequence[tuple[int, int, int, int]]], output: str) -> None:
    source = board(source_name)
    frames = [cut(source, box, (16, 24)) for row in rows for box in row[:4]]
    sheet = Image.new("RGBA", (64, 96), (0, 0, 0, 0))
    paste_grid(sheet, frames, 4, (16, 24))
    save(DEST / "sprites" / output, sheet)


def atlas_from_boxes(source_name: str, boxes: Iterable[tuple[int, int, int, int]], output: Path, cell: tuple[int, int], columns: int) -> None:
    source = board(source_name)
    boxes = list(boxes)
    rows = (len(boxes) + columns - 1) // columns
    atlas = Image.new("RGBA", (columns * cell[0], rows * cell[1]), (0, 0, 0, 0))
    paste_grid(atlas, [cut(source, box, cell) for box in boxes], columns, cell)
    expected_sizes = {
        "forest_v1.png": (256, 128),
        "bakery_v1.png": (256, 128),
        "props_v1.png": (256, 128),
        "vfx_v1.png": (128, 64),
        "ui_v1.png": (256, 96),
    }
    target_size = expected_sizes.get(output.name, atlas.size)
    save(output, pad(atlas, target_size))


def main() -> None:
    # Boards may be used only as temporary bootstrap source. These outputs are
    # modular atlases: no full board, poster layout, title, or notes are copied.
    character_sheet(
        "muji.png",
        [
            [(52, 150, 116, 275), (140, 150, 204, 275), (228, 150, 292, 275), (316, 150, 380, 275)],
            [(52, 690, 116, 805), (140, 690, 204, 805), (228, 690, 292, 805), (316, 690, 380, 805)],
            [(442, 150, 506, 275), (534, 150, 598, 275), (626, 150, 690, 275), (718, 150, 782, 275)],
            [(534, 150, 598, 275), (626, 150, 690, 275), (718, 150, 782, 275), (810, 150, 874, 275)],
        ],
        "muji_v1.png",
    )
    character_sheet(
        "friend a.png",
        [
            [(390, 142, 462, 300), (490, 142, 562, 300), (588, 142, 660, 300), (684, 142, 756, 300)],
            [(52, 372, 124, 530), (148, 372, 220, 530), (244, 372, 316, 530), (340, 372, 412, 530)],
            [(774, 372, 846, 530), (870, 372, 942, 530), (966, 372, 1038, 530), (1062, 372, 1134, 530)],
            [(52, 592, 124, 750), (148, 592, 220, 750), (244, 592, 316, 750), (340, 592, 412, 750)],
        ],
        "friend_a_v1.png",
    )

    forest_boxes = [
        (30, 143, 96, 209), (100, 143, 166, 209), (170, 143, 236, 209), (240, 143, 306, 209),
        (310, 143, 376, 209), (30, 215, 96, 281), (100, 215, 166, 281), (170, 215, 236, 281),
        (470, 190, 540, 315), (565, 190, 635, 315), (660, 190, 730, 315), (755, 190, 825, 315),
        (38, 500, 74, 558), (84, 500, 120, 558), (132, 500, 168, 558), (182, 500, 218, 558),
        (462, 448, 518, 535), (535, 448, 590, 535), (610, 448, 665, 535), (696, 448, 748, 535),
        (790, 448, 845, 535), (910, 448, 970, 535), (300, 330, 365, 390), (380, 330, 440, 390),
    ]
    atlas_from_boxes("forest-tiles.png", forest_boxes, DEST / "tiles" / "forest_v1.png", (16, 16), 16)

    bakery_boxes = [
        (32, 188, 118, 300), (126, 188, 214, 300), (222, 188, 310, 300), (318, 188, 406, 300),
        (414, 188, 502, 300), (32, 314, 118, 420), (126, 314, 214, 420), (222, 314, 310, 420),
        (318, 314, 406, 420), (414, 314, 502, 420), (522, 196, 718, 286), (738, 208, 866, 295),
        (884, 208, 940, 295), (964, 190, 1025, 300), (1040, 202, 1100, 295), (535, 336, 615, 425),
        (638, 330, 758, 425), (778, 340, 830, 425), (852, 320, 940, 425), (970, 335, 1040, 425),
        (548, 426, 620, 510), (640, 430, 768, 510), (846, 430, 910, 506), (953, 426, 1016, 512),
    ]
    atlas_from_boxes("bakery-tiles.png", bakery_boxes, DEST / "tiles" / "bakery_v1.png", (16, 16), 16)

    prop_boxes = [
        (39, 145, 145, 258), (162, 145, 237, 258), (262, 162, 348, 258), (430, 202, 465, 244),
        (540, 200, 585, 244), (770, 170, 845, 244), (47, 344, 160, 426), (181, 320, 235, 426),
        (268, 335, 340, 426), (374, 320, 458, 426), (462, 590, 555, 678), (587, 588, 705, 678),
        (36, 718, 103, 792), (128, 720, 198, 792), (228, 714, 304, 792), (322, 714, 456, 792),
    ]
    atlas_from_boxes("props.png", prop_boxes, DEST / "props" / "props_v1.png", (32, 32), 8)

    vfx_boxes = [
        (40, 165, 82, 238), (88, 165, 130, 238), (136, 165, 178, 238), (184, 165, 226, 238),
        (820, 168, 870, 220), (885, 168, 935, 220), (950, 168, 1000, 220), (1015, 168, 1065, 220),
        (36, 420, 118, 500), (140, 420, 222, 500), (250, 420, 332, 500), (360, 420, 442, 500),
        (34, 612, 95, 710), (116, 612, 177, 710), (198, 612, 259, 710), (282, 612, 343, 710),
    ]
    atlas_from_boxes("fx-pack.png", vfx_boxes, DEST / "vfx" / "vfx_v1.png", (16, 16), 8)

    ui_boxes = [
        (374, 194, 608, 398), (640, 194, 846, 314), (894, 190, 974, 238), (986, 190, 1066, 238),
        (1080, 190, 1160, 238), (518, 464, 565, 512), (782, 464, 830, 512), (850, 464, 898, 512),
        (544, 806, 724, 870), (728, 806, 894, 870), (900, 806, 1086, 870),
    ]
    atlas_from_boxes("ui-icon-packs.png", ui_boxes, DEST / "ui" / "ui_v1.png", (64, 32), 4)


if __name__ == "__main__":
    main()
