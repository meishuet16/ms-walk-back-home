extends Node2D

# Mechanics prototype only.
# These procedural rectangles, polygons, and circles are temporary stand-ins
# for the final original pixel-art production assets. Later passes should
# replace this drawing layer with TileMap layers, animated sprites, Muji's
# sprite sheet, portal animations, and environmental VFX while preserving the
# portal metadata contract loaded below.
const PORTAL_DATA_PATH := "res://forest_data/portal_manifest.seed.json"
const CHAPTER_REGISTRY_PATH := "res://chapters/chapter_registry.json"
const CompletionStore := preload("res://scripts/chapters/chapter_completion_store.gd")
const MobileControls := preload("res://scripts/input/mobile_controls.gd")
const MUJI_SPEED := 150.0
const PORTAL_RADIUS := 64.0
const FOREST_BOUNDS := Rect2(Vector2(32.0, 80.0), Vector2(896.0, 420.0))

var muji_position := Vector2(480.0, 330.0)
var portals: Array[Dictionary] = []
var chapter_registry := {}
var active_portal: Dictionary = {}
var completed_chapters := {}
var time_seconds := 0.0
var info_label: Label
var mobile_controls := MobileControls.new()

func _ready() -> void:
	portals = _load_portals()
	chapter_registry = _load_chapter_registry()
	completed_chapters = CompletionStore.load_completed_chapters()
	info_label = Label.new()
	info_label.position = Vector2(28.0, 24.0)
	info_label.size = Vector2(540.0, 92.0)
	info_label.add_theme_color_override("font_color", Color(0.96, 0.92, 0.84))
	add_child(info_label)
	set_process(true)
	queue_redraw()

func _process(delta: float) -> void:
	time_seconds += delta
	mobile_controls.update_layout(get_viewport_rect().size)
	var direction := _movement_direction()
	if direction.length() > 1.0:
		direction = direction.normalized()
	muji_position += direction * MUJI_SPEED * delta
	muji_position.x = clampf(muji_position.x, FOREST_BOUNDS.position.x, FOREST_BOUNDS.end.x)
	muji_position.y = clampf(muji_position.y, FOREST_BOUNDS.position.y, FOREST_BOUNDS.end.y)
	active_portal = _nearest_portal()
	_update_info_label()
	queue_redraw()

func _input(event: InputEvent) -> void:
	if mobile_controls.handle_input(event, get_viewport_rect().size):
		if mobile_controls.consume_interaction_pressed():
			_try_enter_active_portal()
		queue_redraw()
		return
	if event.is_action_pressed("enter_portal"):
		_try_enter_active_portal()

func _try_enter_active_portal() -> void:
	if not active_portal.is_empty():
		var state := str(active_portal.get("state", "locked"))
		if state == "playable":
			var chapter_id := str(active_portal.get("chapterId", ""))
			var registry_entry: Dictionary = chapter_registry.get(chapter_id, {})
			var scene_path := str(registry_entry.get("scenePath", ""))
			if scene_path == "":
				info_label.text = "Fixture error: no chapter scene is registered for this portal."
				return
			get_tree().change_scene_to_file(scene_path)
		elif state == "processing":
			info_label.text = "This memory is still becoming a door."
		else:
			info_label.text = "This path is locked for now."

func _draw() -> void:
	_draw_sky()
	_draw_forest()
	_draw_fireflies()
	for portal in portals:
		_draw_portal(portal)
	_draw_muji()
	mobile_controls.draw(self, get_viewport_rect().size)

func _load_portals() -> Array[Dictionary]:
	if not FileAccess.file_exists(PORTAL_DATA_PATH):
		push_error("Missing fictional portal metadata.")
		return []
	var file := FileAccess.open(PORTAL_DATA_PATH, FileAccess.READ)
	if file == null:
		push_error("Could not open fictional portal metadata.")
		return []
	var parsed = JSON.parse_string(file.get_as_text())
	if typeof(parsed) != TYPE_DICTIONARY or not parsed.has("portals"):
		push_error("Invalid fictional portal metadata.")
		return []
	var result: Array[Dictionary] = []
	for item in parsed.get("portals", []):
		if typeof(item) == TYPE_DICTIONARY:
			result.append(item)
	return result

func _load_chapter_registry() -> Dictionary:
	if not FileAccess.file_exists(CHAPTER_REGISTRY_PATH):
		push_error("Missing fictional chapter registry.")
		return {}
	var file := FileAccess.open(CHAPTER_REGISTRY_PATH, FileAccess.READ)
	if file == null:
		push_error("Could not open fictional chapter registry.")
		return {}
	var parsed = JSON.parse_string(file.get_as_text())
	if typeof(parsed) != TYPE_DICTIONARY or not parsed.has("chapters"):
		push_error("Invalid fictional chapter registry.")
		return {}
	var result := {}
	for item in parsed.get("chapters", []):
		if typeof(item) != TYPE_DICTIONARY:
			continue
		var chapter_id := str(item.get("chapterId", ""))
		var scene_path := str(item.get("scenePath", ""))
		var template := str(item.get("supportedTemplate", ""))
		if chapter_id != "" and scene_path != "" and template == "bakery_day":
			result[chapter_id] = item
	return result

func _movement_direction() -> Vector2:
	var direction := Vector2.ZERO
	direction.x = Input.get_axis("move_left", "move_right")
	direction.y = Input.get_axis("move_up", "move_down")
	direction += mobile_controls.touch_direction
	return direction.normalized() if direction.length() > 1.0 else direction

func _nearest_portal() -> Dictionary:
	var nearest: Dictionary = {}
	var nearest_distance := PORTAL_RADIUS
	for portal in portals:
		var portal_position := Vector2(float(portal.get("x", 0.0)), float(portal.get("y", 0.0)))
		var distance := muji_position.distance_to(portal_position)
		if distance < nearest_distance:
			nearest = portal
			nearest_distance = distance
	return nearest

func _update_info_label() -> void:
	if active_portal.is_empty():
		info_label.text = "Walk with Muji. WASD or arrows move. Approach a glowing path."
		return
	var state := str(active_portal.get("state", "locked"))
	var chapter_id := str(active_portal.get("chapterId", "chapter-fixture-001"))
	var completed := bool(completed_chapters.get(chapter_id, false))
	var action := "Completed. Press E to revisit" if completed else ("Press E to enter" if state == "playable" else "Not ready to enter")
	info_label.text = "%s\n%s · %s · %s\n%s" % [
		str(active_portal.get("chapterTitle", "Untitled chapter")),
		str(active_portal.get("date", "fixture")),
		str(active_portal.get("mood", "unknown")),
		state,
		action
	]

func _draw_sky() -> void:
	var viewport_size := get_viewport_rect().size
	draw_rect(Rect2(Vector2.ZERO, viewport_size), Color(0.05, 0.09, 0.16))
	draw_rect(Rect2(Vector2.ZERO, viewport_size), Color(0.08, 0.17, 0.20, 0.32))
	for i in range(12):
		var y := 90.0 + float(i) * 34.0
		draw_line(Vector2(0.0, y), Vector2(960.0, y + 34.0), Color(0.11, 0.24, 0.25, 0.16), 2.0)

func _draw_forest() -> void:
	draw_circle(Vector2(480.0, 405.0), 380.0, Color(0.16, 0.28, 0.23, 0.34))
	draw_rect(Rect2(Vector2(100.0, 370.0), Vector2(760.0, 92.0)), Color(0.16, 0.28, 0.23, 0.85))
	for i in range(17):
		var x := 34.0 + float(i) * 58.0
		var sway := sin(time_seconds * 1.2 + float(i)) * 4.0
		var trunk_top := Vector2(x + sway, 150.0 + float(i % 3) * 16.0)
		draw_rect(Rect2(trunk_top + Vector2(-5.0, 92.0), Vector2(10.0, 220.0)), Color(0.07, 0.13, 0.12))
		draw_polygon(PackedVector2Array([
			trunk_top + Vector2(-34.0, 120.0),
			trunk_top + Vector2(0.0, 8.0),
			trunk_top + Vector2(34.0, 120.0)
		]), PackedColorArray([
			Color(0.07, 0.24, 0.22),
			Color(0.07, 0.24, 0.22),
			Color(0.07, 0.24, 0.22)
		]))
		draw_polygon(PackedVector2Array([
			trunk_top + Vector2(-26.0, 78.0),
			trunk_top + Vector2(0.0, -18.0),
			trunk_top + Vector2(26.0, 78.0)
		]), PackedColorArray([
			Color(0.09, 0.32, 0.29),
			Color(0.09, 0.32, 0.29),
			Color(0.09, 0.32, 0.29)
		]))
	draw_polyline(PackedVector2Array([
		Vector2(468.0, 540.0),
		Vector2(440.0, 455.0),
		Vector2(482.0, 375.0),
		Vector2(506.0, 290.0)
	]), Color(0.40, 0.35, 0.26, 0.55), 42.0)

func _draw_fireflies() -> void:
	for i in range(18):
		var x := 80.0 + float((i * 137) % 780)
		var y := 130.0 + float((i * 59) % 270)
		var pulse := 0.45 + sin(time_seconds * 2.0 + float(i)) * 0.22
		draw_circle(Vector2(x, y), 2.0 + pulse, Color(0.95, 0.77, 0.34, 0.42 + pulse))

func _draw_portal(portal: Dictionary) -> void:
	var portal_position := Vector2(float(portal.get("x", 0.0)), float(portal.get("y", 0.0)))
	var state := str(portal.get("state", "locked"))
	var chapter_id := str(portal.get("chapterId", "chapter-fixture-001"))
	var completed := bool(completed_chapters.get(chapter_id, false))
	var glow := Color(0.91, 0.63, 0.30, 0.34)
	if completed:
		glow = Color(0.54, 0.92, 0.72, 0.34)
	if state == "locked":
		glow = Color(0.47, 0.55, 0.61, 0.22)
	elif state == "processing":
		glow = Color(0.56, 0.77, 0.92, 0.32)
	draw_circle(portal_position, 46.0 + sin(time_seconds * 2.0) * 3.0, glow)
	draw_rect(Rect2(portal_position + Vector2(-22.0, -38.0), Vector2(44.0, 76.0)), Color(0.10, 0.17, 0.18))
	draw_rect(Rect2(portal_position + Vector2(-15.0, -28.0), Vector2(30.0, 58.0)), Color(glow.r, glow.g, glow.b, 0.44))
	if state == "locked":
		draw_line(portal_position + Vector2(-17.0, -3.0), portal_position + Vector2(17.0, 3.0), Color(0.77, 0.83, 0.86), 4.0)
	if completed:
		draw_line(portal_position + Vector2(-13.0, 5.0), portal_position + Vector2(-2.0, 18.0), Color(0.77, 1.0, 0.82), 4.0)
		draw_line(portal_position + Vector2(-2.0, 18.0), portal_position + Vector2(18.0, -14.0), Color(0.77, 1.0, 0.82), 4.0)

func _draw_muji() -> void:
	draw_line(muji_position + Vector2(-16.0, 20.0), muji_position + Vector2(-24.0, 36.0), Color(0.06, 0.08, 0.13), 3.0)
	draw_line(muji_position + Vector2(16.0, 20.0), muji_position + Vector2(24.0, 36.0), Color(0.06, 0.08, 0.13), 3.0)
	draw_line(muji_position + Vector2(-22.0, -2.0), muji_position + Vector2(-34.0, 10.0), Color(0.06, 0.08, 0.13), 3.0)
	draw_line(muji_position + Vector2(22.0, -2.0), muji_position + Vector2(34.0, 10.0), Color(0.06, 0.08, 0.13), 3.0)
	draw_rect(Rect2(muji_position + Vector2(-18.0, -48.0), Vector2(36.0, 14.0)), Color(0.02, 0.05, 0.11))
	draw_arc(muji_position + Vector2(19.0, -41.0), 11.0, -1.5, 1.5, 16, Color(0.02, 0.05, 0.11), 4.0)
	draw_rect(Rect2(muji_position + Vector2(-22.0, -34.0), Vector2(44.0, 58.0)), Color(0.42, 0.57, 0.66, 0.62))
	draw_rect(Rect2(muji_position + Vector2(-14.0, -24.0), Vector2(28.0, 38.0)), Color(0.78, 0.91, 0.96, 0.20))
	draw_line(muji_position + Vector2(-11.0, -9.0), muji_position + Vector2(11.0, -9.0), Color(0.02, 0.05, 0.11), 3.0)
