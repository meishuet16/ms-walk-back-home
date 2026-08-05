extends Node2D
class_name ArtLockedTileLayers

@onready var background: TileMapLayer = $Background
@onready var midground: TileMapLayer = $Midground
@onready var foreground: TileMapLayer = $Foreground
@onready var lighting_vfx: Node2D = $LightingVfx
@onready var props: Node2D = $Props

func get_layer_order() -> Array[String]:
	return [
		background.name,
		midground.name,
		props.name,
		foreground.name,
		lighting_vfx.name
	]

func place_prop(hook_name: String, position: Vector2, prop_id: String) -> Node2D:
	var marker := Node2D.new()
	marker.name = hook_name + "__" + prop_id
	marker.position = position
	props.add_child(marker)
	return marker

