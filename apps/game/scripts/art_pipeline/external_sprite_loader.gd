extends RefCounted
class_name ExternalSpriteLoader

static func load_texture(path: String) -> Texture2D:
	if not ResourceLoader.exists(path):
		return null
	return load(path) as Texture2D

static func configure_sprite(sprite: Sprite2D, texture: Texture2D, frame_size: Vector2i) -> void:
	if texture == null:
		sprite.texture = null
		sprite.visible = false
		return
	sprite.texture = texture
	sprite.hframes = int(texture.get_width() / frame_size.x)
	sprite.vframes = int(texture.get_height() / frame_size.y)
	sprite.texture_filter = CanvasItem.TEXTURE_FILTER_NEAREST
	sprite.centered = true
	sprite.visible = true

