extends CharacterBody2D
class_name ArtLockedCharacterBody

@export_file("*.png") var sprite_sheet_path := ""
@export var frame_size := Vector2i(16, 20)
@export var sprite_scale := Vector2(3.0, 3.0)

@onready var sprite: Sprite2D = $Sprite2D
@onready var animation_player: AnimationPlayer = $AnimationPlayer

func _ready() -> void:
	var texture := ExternalSpriteLoader.load_texture(sprite_sheet_path)
	ExternalSpriteLoader.configure_sprite(sprite, texture, frame_size)
	sprite.scale = sprite_scale
	_configure_animation_player()

func play_directional_animation(direction: String, moving: bool) -> void:
	var prefix := "walk" if moving else "idle"
	var animation_name := prefix + "_" + direction
	if animation_player.has_animation(animation_name):
		animation_player.play(animation_name)

func _configure_animation_player() -> void:
	var library := AnimationLibrary.new()
	for direction_index in range(ExternalArtPaths.CHARACTER_DIRECTIONS.size()):
		var direction := str(ExternalArtPaths.CHARACTER_DIRECTIONS[direction_index])
		_ensure_frame_animation(library, "idle_" + direction, direction_index * 4, 1, 0.5)
		_ensure_frame_animation(library, "walk_" + direction, direction_index * 4, 4, 0.48)
	animation_player.add_animation_library("", library)

func _ensure_frame_animation(library: AnimationLibrary, name: String, first_frame: int, frame_count: int, length: float) -> void:
	if library.has_animation(name):
		return
	var animation := Animation.new()
	animation.length = length
	animation.loop_mode = Animation.LOOP_LINEAR
	var track := animation.add_track(Animation.TYPE_VALUE)
	animation.track_set_path(track, NodePath("Sprite2D:frame"))
	for index in range(frame_count):
		var time := 0.0 if frame_count == 1 else length * float(index) / float(frame_count)
		animation.track_insert_key(track, time, first_frame + index)
	library.add_animation(name, animation)
