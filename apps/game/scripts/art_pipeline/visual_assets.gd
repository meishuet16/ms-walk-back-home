extends RefCounted
class_name VisualAssets

const MUJI_SPRITE := "res://assets/external/sprites/muji_v1.png"
const FRIEND_A_SPRITE := "res://assets/external/sprites/friend_a_v1.png"
const FOREST_TILESET := "res://assets/external/tiles/forest_v1.png"
const BAKERY_TILESET := "res://assets/external/tiles/bakery_v1.png"
const PROP_ATLAS := "res://assets/external/props/props_v1.png"
const VFX_ATLAS := "res://assets/external/vfx/vfx_v1.png"
const UI_ATLAS := "res://assets/external/ui/ui_v1.png"

const TILE_SIZE := Vector2i(16, 16)
const CHARACTER_FRAME_SIZE := Vector2i(16, 24)
const PROP_CELL_SIZE := Vector2i(32, 32)
const UI_CELL_SIZE := Vector2i(64, 32)

static func load_texture(path: String) -> Texture2D:
	if not FileAccess.file_exists(path):
		push_warning("Missing visual asset: " + path)
		return null
	var image := Image.new()
	var error := image.load(path)
	if error != OK:
		push_warning("Could not load visual asset: " + path)
		return null
	return ImageTexture.create_from_image(image)

static func atlas_region(cell: Vector2i, cell_size: Vector2i) -> Rect2:
	return Rect2(Vector2(cell.x * cell_size.x, cell.y * cell_size.y), Vector2(cell_size))

static func draw_atlas(canvas: CanvasItem, texture: Texture2D, cell: Vector2i, cell_size: Vector2i, position: Vector2, scale: float = 1.0, centered: bool = true) -> void:
	if texture == null:
		return
	var size := Vector2(cell_size) * scale
	var top_left := position - (size * 0.5 if centered else Vector2.ZERO)
	canvas.draw_texture_rect_region(texture, Rect2(top_left, size), atlas_region(cell, cell_size))

static func make_tileset(texture: Texture2D, tile_size: Vector2i) -> TileSet:
	var tile_set := TileSet.new()
	tile_set.tile_size = tile_size
	var source := TileSetAtlasSource.new()
	source.texture = texture
	source.texture_region_size = tile_size
	if texture != null:
		var columns := int(texture.get_width() / tile_size.x)
		var rows := int(texture.get_height() / tile_size.y)
		for y in range(rows):
			for x in range(columns):
				source.create_tile(Vector2i(x, y))
	tile_set.add_source(source)
	return tile_set
