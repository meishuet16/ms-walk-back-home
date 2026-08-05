import argparse
import json
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
CONTRACT_PATH = ROOT / "apps" / "game" / "art_pipeline" / "art_lock_v1_assets.json"
ASSET_ROOT = ROOT / "apps" / "game" / "assets" / "external"


def expected_size(asset: dict) -> tuple[int, int]:
    if asset["kind"] == "sprite_sheet":
        return (asset["frameWidth"] * asset["columns"], asset["frameHeight"] * asset["rows"])
    return (asset["tileWidth"] * asset["columns"], asset["tileHeight"] * asset["rows"])


def workspace_path(resource_path: str) -> Path:
    prefix = "res://assets/external/"
    if not resource_path.startswith(prefix):
        raise ValueError(f"Asset path must start with {prefix}: {resource_path}")
    return ASSET_ROOT / resource_path.removeprefix(prefix)


def inspect_asset(asset: dict, strict: bool) -> tuple[str, list[str]]:
    messages: list[str] = []
    path = workspace_path(asset["path"])
    if not path.exists():
        status = "missing" if strict else "pending"
        return status, [f"{asset['id']}: {status} external file {path.relative_to(ROOT)}"]

    with Image.open(path) as image:
        actual = image.size
        expected = expected_size(asset)
        if actual != expected:
            return "invalid", [f"{asset['id']}: expected {expected[0]}x{expected[1]}, found {actual[0]}x{actual[1]}"]
        if image.mode not in ["RGBA", "RGB", "P"]:
            return "invalid", [f"{asset['id']}: unsupported image mode {image.mode}"]
        colors = image.convert("RGBA").getcolors(maxcolors=4096)
        if colors is None:
            messages.append(f"{asset['id']}: palette has more than 4096 colors; check pixel-art discipline")
        elif len(colors) > 96:
            messages.append(f"{asset['id']}: palette has {len(colors)} colors; review against Art Lock v1 restraint")

    return "ok", [f"{asset['id']}: ok {path.relative_to(ROOT)}", *messages]


def main() -> int:
    parser = argparse.ArgumentParser(description="Validate externally supplied Art Lock v1 assets.")
    parser.add_argument("--strict", action="store_true", help="Fail when required external files are missing.")
    args = parser.parse_args()

    contract = json.loads(CONTRACT_PATH.read_text(encoding="utf-8"))
    failed = False
    for asset in contract["assets"]:
        status, messages = inspect_asset(asset, args.strict)
        for message in messages:
            print(message)
        if status == "invalid" or (args.strict and status == "missing"):
            failed = True

    return 1 if failed else 0


if __name__ == "__main__":
    raise SystemExit(main())
