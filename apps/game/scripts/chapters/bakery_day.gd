extends Node2D

# Mechanics prototype only.
# These procedural shapes are temporary stand-ins for original pixel-art assets.
# Later passes should replace this scene with TileMaps, animated sprites, Muji's
# sprite sheet, portal animation, and environmental VFX without changing the
# Chapter Manifest contract loaded here.
const CHAPTER_MANIFEST_PATH := "res://chapters/bakery_day.chapter.json"
const FOREST_SCENE_PATH := "res://scenes/forest/memory_forest.tscn"
const CompletionStore := preload("res://scripts/chapters/chapter_completion_store.gd")
const MobileControls := preload("res://scripts/input/mobile_controls.gd")
const MUJI_SPEED := 150.0
const INTERACTION_RADIUS := 54.0
const BAKERY_BOUNDS := Rect2(Vector2(42.0, 120.0), Vector2(876.0, 330.0))
const VALID_DIALOGUE_SOURCES := ["exact_quote", "reconstructed", "generic_contextual", "muji_observation", "silent_beat"]

var manifest: Dictionary = {}
var objectives: Array = []
var objective_index := 0
var muji_position := Vector2.ZERO
var npc_records: Array[Dictionary] = []
var object_records: Array[Dictionary] = []
var target_positions := {}
var exit_rect := Rect2()
var prompt_text := ""
var dialogue_text := ""
var ending_visible := false
var fixture_error_text := ""
var walk_frame := 0
var walk_time := 0.0
var facing := "down"
var mobile_controls := MobileControls.new()

func _ready() -> void:
	manifest = _load_manifest()
	var validation_errors := _validate_manifest(manifest)
	if validation_errors.size() > 0:
		fixture_error_text = "Fixture error:\n" + "\n".join(validation_errors)
		set_process(false)
		queue_redraw()
		return
	_apply_manifest(manifest)
	_complete_current_objective("enter_scene")
	set_process(true)
	queue_redraw()

func _process(delta: float) -> void:
	if fixture_error_text != "":
		queue_redraw()
		return
	if ending_visible:
		queue_redraw()
		return
	mobile_controls.update_layout(get_viewport_rect().size)
	var direction := _movement_direction()
	if direction.length() > 0.0:
		walk_time += delta
		if walk_time > 0.14:
			walk_frame = (walk_frame + 1) % 2
			walk_time = 0.0
		muji_position += direction * MUJI_SPEED * delta
		muji_position.x = clampf(muji_position.x, BAKERY_BOUNDS.position.x, BAKERY_BOUNDS.end.x)
		muji_position.y = clampf(muji_position.y, BAKERY_BOUNDS.position.y, BAKERY_BOUNDS.end.y)
	prompt_text = _current_prompt()
	if _current_objective_completion() == "exit" and exit_rect.has_point(muji_position):
		_complete_current_objective("exit")
	queue_redraw()

func _input(event: InputEvent) -> void:
	if fixture_error_text != "":
		if event.is_action_pressed("enter_portal"):
			get_tree().change_scene_to_file(FOREST_SCENE_PATH)
		return
	if mobile_controls.handle_input(event, get_viewport_rect().size):
		if mobile_controls.consume_interaction_pressed():
			_try_interact()
		queue_redraw()
		return
	if event.is_action_pressed("enter_portal"):
		if ending_visible:
			get_tree().change_scene_to_file(FOREST_SCENE_PATH)
			return
		_try_interact()

func _draw() -> void:
	if fixture_error_text != "":
		_draw_fixture_error()
		return
	_draw_bakery()
	for object_record in object_records:
		if str(object_record.get("type", "")) == "exit":
			_draw_exit()
		else:
			_draw_object(object_record)
	for npc_record in npc_records:
		_draw_npc(npc_record)
	_draw_muji()
	_draw_ui()
	mobile_controls.draw(self, get_viewport_rect().size)

func _load_manifest() -> Dictionary:
	if not FileAccess.file_exists(CHAPTER_MANIFEST_PATH):
		return {"validationErrors": ["Missing Bakery Day chapter manifest."]}
	var file := FileAccess.open(CHAPTER_MANIFEST_PATH, FileAccess.READ)
	if file == null:
		return {"validationErrors": ["Could not open Bakery Day chapter manifest."]}
	var parsed = JSON.parse_string(file.get_as_text())
	if typeof(parsed) != TYPE_DICTIONARY:
		return {"validationErrors": ["Invalid Bakery Day chapter manifest JSON."]}
	return parsed

func _apply_manifest(next_manifest: Dictionary) -> void:
	objectives = next_manifest.get("objectives", [])
	npc_records = []
	object_records = []
	target_positions = {}
	var spawn: Dictionary = next_manifest.get("playerSpawn", {})
	muji_position = _point_from_dictionary(spawn)
	for npc in next_manifest.get("npcs", []):
		var npc_record: Dictionary = npc
		npc_records.append(npc_record)
		target_positions[str(npc_record.get("id", ""))] = _point_from_dictionary(npc_record.get("position", {}))
	for object_item in next_manifest.get("interactiveObjects", []):
		var object_record: Dictionary = object_item
		object_records.append(object_record)
		var object_position := _point_from_dictionary(object_record.get("position", {}))
		target_positions[str(object_record.get("id", ""))] = object_position
		if str(object_record.get("type", "")) == "exit":
			exit_rect = Rect2(object_position + Vector2(-36.0, -64.0), Vector2(72.0, 128.0))

func _validate_manifest(next_manifest: Dictionary) -> Array[String]:
	var errors: Array[String] = []
	for field in ["id", "template", "entryId", "date", "title", "playerSpawn", "objectives", "npcs", "interactiveObjects", "dialogueNodes", "ending"]:
		if not next_manifest.has(field):
			errors.append("Missing field: " + field)
	if errors.size() > 0:
		return errors
	if str(next_manifest.get("template", "")) != "bakery_day":
		errors.append("Unsupported chapter template: " + str(next_manifest.get("template", "")))
	var target_ids := {}
	for npc in next_manifest.get("npcs", []):
		if typeof(npc) != TYPE_DICTIONARY:
			errors.append("NPC entry is not an object.")
			continue
		target_ids[str(npc.get("id", ""))] = true
		_validate_point(errors, npc.get("position", {}), "NPC " + str(npc.get("id", "")))
	for object_item in next_manifest.get("interactiveObjects", []):
		if typeof(object_item) != TYPE_DICTIONARY:
			errors.append("Interactive object entry is not an object.")
			continue
		target_ids[str(object_item.get("id", ""))] = true
		_validate_point(errors, object_item.get("position", {}), "Object " + str(object_item.get("id", "")))
	if not target_ids.has("exit_bakery"):
		errors.append("Missing target object: exit_bakery")
	var expected_order := 0
	var objective_ids := {}
	for objective in next_manifest.get("objectives", []):
		if typeof(objective) != TYPE_DICTIONARY:
			errors.append("Objective entry is not an object.")
			continue
		var order := int(objective.get("order", -1))
		if order != expected_order:
			errors.append("Invalid objective order at " + str(objective.get("id", "")) + ": expected " + str(expected_order))
		expected_order += 1
		objective_ids[str(objective.get("id", ""))] = true
		var target_id := str(objective.get("targetId", ""))
		if target_id != "" and not target_ids.has(target_id):
			errors.append("Missing target for objective " + str(objective.get("id", "")) + ": " + target_id)
	for node in next_manifest.get("dialogueNodes", []):
		if typeof(node) != TYPE_DICTIONARY:
			errors.append("Dialogue node entry is not an object.")
			continue
		var source := str(node.get("source", ""))
		if not VALID_DIALOGUE_SOURCES.has(source):
			errors.append("Invalid dialogue source on " + str(node.get("id", "")) + ": " + source)
		var objective_id := str(node.get("objectiveId", ""))
		if objective_id != "" and not objective_ids.has(objective_id):
			errors.append("Dialogue node references missing objective: " + objective_id)
	return errors

func _validate_point(errors: Array[String], value, label: String) -> void:
	if typeof(value) != TYPE_DICTIONARY:
		errors.append(label + " is missing a position object.")
		return
	if not value.has("x") or not value.has("y"):
		errors.append(label + " position must include x and y.")

func _point_from_dictionary(value) -> Vector2:
	if typeof(value) != TYPE_DICTIONARY:
		return Vector2.ZERO
	return Vector2(float(value.get("x", 0.0)), float(value.get("y", 0.0)))

func _movement_direction() -> Vector2:
	var direction := Vector2.ZERO
	direction.x = Input.get_axis("move_left", "move_right")
	direction.y = Input.get_axis("move_up", "move_down")
	direction += mobile_controls.touch_direction
	if abs(direction.x) > abs(direction.y):
		facing = "right" if direction.x > 0.0 else "left"
	elif abs(direction.y) > 0.0:
		facing = "down" if direction.y > 0.0 else "up"
	return direction.normalized() if direction.length() > 1.0 else direction

func _try_interact() -> void:
	var objective := _current_objective()
	var completion := str(objective.get("completion", ""))
	var target_id := str(objective.get("targetId", ""))
	if completion == "talk" and _is_near_target(target_id):
		dialogue_text = _dialogue_for_objective(str(objective.get("id", "")))
		_complete_current_objective("talk")
	elif completion == "inspect" and _is_near_target(target_id):
		dialogue_text = _dialogue_for_objective(str(objective.get("id", "")))
		_complete_current_objective("inspect")

func _is_near_target(target_id: String) -> bool:
	if not target_positions.has(target_id):
		return false
	return muji_position.distance_to(target_positions[target_id]) <= INTERACTION_RADIUS

func _current_objective() -> Dictionary:
	if objective_index >= objectives.size():
		return {}
	return objectives[objective_index]

func _current_objective_completion() -> String:
	return str(_current_objective().get("completion", ""))

func _current_prompt() -> String:
	var objective := _current_objective()
	if objective.is_empty():
		return "Press E to return to Memory Forest."
	var completion := str(objective.get("completion", ""))
	var target_id := str(objective.get("targetId", ""))
	if completion == "talk" and _is_near_target(target_id):
		return "Press E to talk with " + _label_for_target(target_id) + "."
	if completion == "inspect" and _is_near_target(target_id):
		return "Press E to inspect " + _label_for_target(target_id) + "."
	return str(objective.get("prompt", "Follow the warm light."))

func _label_for_target(target_id: String) -> String:
	for npc in npc_records:
		if str(npc.get("id", "")) == target_id:
			return str(npc.get("displayName", "this person"))
	for object_record in object_records:
		if str(object_record.get("id", "")) == target_id:
			return str(object_record.get("label", "this object"))
	return "this memory"

func _complete_current_objective(completion: String) -> void:
	if _current_objective_completion() != completion:
		return
	objective_index += 1
	if objective_index >= objectives.size():
		ending_visible = true
		_save_completion()

func _dialogue_for_objective(objective_id: String) -> String:
	for node in manifest.get("dialogueNodes", []):
		if node.get("objectiveId", "") == objective_id:
			var source := str(node.get("source", "generic_contextual"))
			var prefix := "(reconstructed) " if source == "reconstructed" else ""
			return prefix + str(node.get("text", ""))
	return ""

func _save_completion() -> void:
	CompletionStore.save_completed(
		str(manifest.get("id", "chapter-fixture-001")),
		str(manifest.get("entryId", "fixture-001"))
	)

func _draw_bakery() -> void:
	draw_rect(Rect2(Vector2.ZERO, get_viewport_rect().size), Color(0.07, 0.08, 0.12))
	draw_rect(Rect2(Vector2(40.0, 110.0), Vector2(880.0, 350.0)), Color(0.18, 0.12, 0.10))
	draw_rect(Rect2(Vector2(68.0, 140.0), Vector2(824.0, 270.0)), Color(0.29, 0.20, 0.16))
	draw_rect(Rect2(Vector2(88.0, 334.0), Vector2(640.0, 54.0)), Color(0.43, 0.29, 0.18))
	draw_rect(Rect2(Vector2(112.0, 162.0), Vector2(178.0, 92.0)), Color(0.10, 0.13, 0.20))
	draw_rect(Rect2(Vector2(136.0, 182.0), Vector2(130.0, 48.0)), Color(0.92, 0.59, 0.27, 0.50))
	for i in range(9):
		draw_circle(Vector2(170.0 + float(i) * 72.0, 132.0 + float(i % 2) * 8.0), 5.0, Color(1.0, 0.70, 0.28, 0.8))

func _draw_npc(npc: Dictionary) -> void:
	var position := _point_from_dictionary(npc.get("position", {}))
	draw_circle(position + Vector2(0.0, -24.0), 16.0, Color(0.88, 0.63, 0.42))
	draw_rect(Rect2(position + Vector2(-13.0, -10.0), Vector2(26.0, 36.0)), Color(0.15, 0.20, 0.28))
	draw_line(position + Vector2(-5.0, -25.0), position + Vector2(-5.0, -22.0), Color(0.02, 0.02, 0.03), 2.0)
	draw_line(position + Vector2(5.0, -25.0), position + Vector2(5.0, -22.0), Color(0.02, 0.02, 0.03), 2.0)

func _draw_object(object_record: Dictionary) -> void:
	var position := _point_from_dictionary(object_record.get("position", {}))
	draw_rect(Rect2(position + Vector2(-34.0, 10.0), Vector2(68.0, 16.0)), Color(0.31, 0.19, 0.11))
	draw_circle(position, 22.0, Color(0.86, 0.55, 0.24))
	draw_circle(position + Vector2(7.0, -5.0), 6.0, Color(1.0, 0.78, 0.41))

func _draw_exit() -> void:
	draw_rect(exit_rect, Color(0.08, 0.10, 0.14))
	draw_rect(Rect2(exit_rect.position + Vector2(14.0, 18.0), Vector2(44.0, 92.0)), Color(0.75, 0.45, 0.18, 0.45))

func _draw_muji() -> void:
	var bob := float(walk_frame) * 2.0
	var center := muji_position + Vector2(0.0, -bob)
	var cap_color := Color(0.02, 0.05, 0.12)
	var body_color := Color(0.45, 0.58, 0.68, 0.68)
	draw_line(center + Vector2(-18.0, 16.0), center + Vector2(-28.0, 28.0 + bob), cap_color, 4.0)
	draw_line(center + Vector2(18.0, 16.0), center + Vector2(28.0, 28.0 + bob), cap_color, 4.0)
	draw_line(center + Vector2(-23.0, -3.0), center + Vector2(-36.0, 10.0), cap_color, 4.0)
	draw_line(center + Vector2(23.0, -3.0), center + Vector2(36.0, 10.0), cap_color, 4.0)
	draw_rect(Rect2(center + Vector2(-18.0, -49.0), Vector2(36.0, 14.0)), cap_color)
	draw_arc(center + Vector2(19.0, -42.0), 12.0, -1.55, 1.55, 16, cap_color, 4.0)
	draw_rect(Rect2(center + Vector2(-22.0, -35.0), Vector2(44.0, 60.0)), body_color)
	draw_rect(Rect2(center + Vector2(-14.0, -23.0), Vector2(28.0, 38.0)), Color(0.82, 0.93, 0.98, 0.23))
	draw_circle(center + Vector2(-8.0, -7.0), 3.0, Color(0.02, 0.03, 0.06))
	draw_circle(center + Vector2(8.0, -7.0), 3.0, Color(0.02, 0.03, 0.06))
	draw_arc(center + Vector2(0.0, 0.0), 9.0, 0.2, 1.2, 8, Color(0.02, 0.03, 0.06), 2.0)

func _draw_ui() -> void:
	draw_rect(Rect2(Vector2(24.0, 24.0), Vector2(540.0, 70.0)), Color(0.03, 0.04, 0.07, 0.72))
	draw_string(ThemeDB.fallback_font, Vector2(42.0, 54.0), "Objective: " + prompt_text, HORIZONTAL_ALIGNMENT_LEFT, 500.0, 18, Color(0.98, 0.92, 0.82))
	if dialogue_text != "":
		draw_rect(Rect2(Vector2(90.0, 410.0), Vector2(780.0, 92.0)), Color(0.05, 0.04, 0.05, 0.86))
		draw_string(ThemeDB.fallback_font, Vector2(118.0, 448.0), dialogue_text, HORIZONTAL_ALIGNMENT_LEFT, 720.0, 18, Color(1.0, 0.94, 0.84))
	if ending_visible:
		draw_rect(Rect2(Vector2(220.0, 130.0), Vector2(520.0, 260.0)), Color(0.02, 0.03, 0.05, 0.92))
		draw_string(ThemeDB.fallback_font, Vector2(260.0, 205.0), str(manifest.get("ending", {}).get("text", "Chapter complete.")), HORIZONTAL_ALIGNMENT_LEFT, 440.0, 20, Color(1.0, 0.86, 0.62))
		draw_string(ThemeDB.fallback_font, Vector2(260.0, 285.0), "Press E to return to Memory Forest.", HORIZONTAL_ALIGNMENT_LEFT, 440.0, 18, Color(0.86, 0.92, 0.96))

func _draw_fixture_error() -> void:
	draw_rect(Rect2(Vector2.ZERO, get_viewport_rect().size), Color(0.04, 0.04, 0.06))
	draw_rect(Rect2(Vector2(120.0, 120.0), Vector2(720.0, 280.0)), Color(0.16, 0.08, 0.08, 0.92))
	draw_string(ThemeDB.fallback_font, Vector2(160.0, 170.0), fixture_error_text, HORIZONTAL_ALIGNMENT_LEFT, 640.0, 18, Color(1.0, 0.82, 0.72))
	draw_string(ThemeDB.fallback_font, Vector2(160.0, 350.0), "Press E to return to Memory Forest.", HORIZONTAL_ALIGNMENT_LEFT, 640.0, 18, Color(0.94, 0.94, 0.90))
