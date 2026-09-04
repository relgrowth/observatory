from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "artwork-sources/generated/story-shack-object-atlas.png"
OUTPUT = ROOT / "public/assets/objects/story-shack-object-atlas.webp"
OBJECTS = ROOT / "artwork-sources/generated/objects"
GRID = 5
CELL = 512
PADDING = 28
NAMES = [
    "door", "stairs", "chest", "table", "bed",
    "barrels", "campfire", "tree", "pine", "boulder",
    "bridge", "cottage", "tower", "well", "ship",
    "ruin", "chair", "crates", "bookshelf", "altar",
    "market-stall", "tent", "wagon", "rowboat",
]
OVERRIDES = {index: OBJECTS / f"{name}.png" for index, name in enumerate(NAMES)}


def fit_sprite(image: Image.Image) -> Image.Image:
    image = image.convert("RGBA")
    alpha_bounds = image.getchannel("A").getbbox()
    if alpha_bounds:
        image = image.crop(alpha_bounds)
    image.thumbnail((CELL - PADDING * 2, CELL - PADDING * 2), Image.Resampling.LANCZOS)
    cell = Image.new("RGBA", (CELL, CELL))
    cell.alpha_composite(image, ((CELL - image.width) // 2, (CELL - image.height) // 2))
    return cell


def main() -> None:
    previous = Image.open(SOURCE).convert("RGBA")
    old_cell_width = previous.width / GRID
    old_cell_height = previous.height / GRID
    atlas = Image.new("RGBA", (CELL * GRID, CELL * GRID))
    for index in range(GRID * GRID):
        if index in OVERRIDES:
            cell = fit_sprite(Image.open(OVERRIDES[index]))
        elif index >= len(NAMES):
            cell = Image.new("RGBA", (CELL, CELL))
        else:
            column, row = index % GRID, index // GRID
            crop = (
                round(column * old_cell_width),
                round(row * old_cell_height),
                round((column + 1) * old_cell_width),
                round((row + 1) * old_cell_height),
            )
            cell = previous.crop(crop).resize((CELL, CELL), Image.Resampling.LANCZOS)
        atlas.alpha_composite(cell, ((index % GRID) * CELL, (index // GRID) * CELL))
    atlas.save(SOURCE, optimize=True)
    atlas.save(OUTPUT, "WEBP", quality=92, method=6)


if __name__ == "__main__":
    main()
