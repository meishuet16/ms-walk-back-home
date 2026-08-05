extends Node2D

const CHAPTER_MANIFEST_PATH := "res://chapters/bakery_day.chapter.json"
const FOREST_SCENE_PATH := "res://scenes/forest/memory_forest.tscn"
const COMPLETION_PATH := "user://chapter_completion.json"
const MUJI_SPEED := 150.0
const INTERACTION_RADIUS := 54.0
const BAKERY_BOUNDS := Rect2(Vector2(42.0, 120.0), Vector2(876.0, 330.0))

var manifest: Dictionary = {}
var objectives: Array = []
var objective_index := 0
var muji_position := Vector2(88.0, 312.0)
var friend_position := Vector2(420.0, 295.0)
var pastry_position := Vector2(610.0, 304.0)
var exit_rect := Rect2(Vector2(798.0, 250.0), Vector2(72.0, 128.0))
var prompt_text := ""
var dialogue_text := ""
var ending_visible := false
var walk_frame := 0
var walk_time := 0.0
var facing := "down"

func _ready() -> void:
	manifest = _load_manifest()
	objectives = manifest.get("objectives", [])
	var spawn := manifest.get("playerSpawn", {})
	muji_position = Vector2(float(spawn.get("x", 88.0)), float(spawn.get("y", 312.0)))
	_complete_current_objective("enter_scene")
	set_process(true)
	queue_redraw()

func _process(delta: float) -> void:
	if ending_visible:
		queue_redraw()
		return
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
	if event.is_action_pressed("enter_portal"):
		if ending_visible:
			get_tree().change_scene_to_file(FOREST_SCENE_PATH)
			return
		var completion := _current_objective_completion()
		if completion == "talk" and muji_position.distance_to(friend_position) <= INTERACTION_RADIUS:
			dialogue_text = _dialogue_for_objective("talk-to-friend-a")
			_complete_current_objective("talk")
		elif completion == "inspect" and muji_position.distance_to(pastry_position) <= INTERACTION_RADIUS:
			dialogue_text = _dialogue_for_objective("inspect-pastry")
			_complete_current_objective("inspect")

func _draw() -> void:
	_draw_bakery()
	_draw_friend()
	_draw_pastry()
	_draw_exit()
	_draw_muji()
	_draw_ui()

func _load_manifest() -> Dictionary:
	if not FileAccess.file_exists(CHAPTER_MANIFEST_PATH):
		push_error("Missing Bakery Day chapter manifest.")
		return {}
	var file := FileAccess.open(CHAPTER_MANIFEST_PATH, FileAccess.READ)
	if file == null:
		push_error("Could not open Bakery Day chapter manifest.")
		return {}
	var parsed = JSON.parse_string(file.get_as_text())
	if typeof(parsed) != TYPE_DICTIONARY:
		push_error("Invalid Bakery Day chapter manifest.")
		return {}
	return parsed

func _movement_direction() -> Vector2:
	var direction := Vector2.ZERO
	direction.x = Input.get_axis("move_left", "move_right")
	direction.y = Input.get_axis("move_up", "move_down")
	if abs(direction.x) > abs(direction.y):
		facing = "right" if direction.x > 0.0 else "left"
	elif abs(direction.y) > 0.0:
		facing = "down" if direction.y > 0.0 else "up"
	return direction.normalized() if direction.length() > 1.0 else direction

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
	if objective.get("completion", "") == "talk" and muji_position.distance_to(friend_position) <= INTERACTION_RADIUS:
		return "Press E to talk with Friend A."
	if objective.get("completion", "") == "inspect" and muji_position.distance_to(pastry_position) <= INTERACTION_RADIUS:
		return "Press E to inspect the pastry."
	return str(objective.get("prompt", "Follow the warm light."))

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
	var completion := {
		"chapterId": manifest.get("id", "chapter-fixture-001"),
		"entryId": manifest.get("entryId", "fixture-001"),
		"completed": true,
		"completedAt": Time.get_datetime_string_from_system(true)
	}
	var file := FileAccess.open(COMPLETION_PATH, FileAccess.WRITE)
	if file != null:
		file.store_string(JSON.stringify(completion))

func _draw_bakery() -> void:
	draw_rect(Rect2(Vector2.ZERO, Vector2(960.0, 540.0)), Color(0.07, 0.08, 0.12))
	draw_rect(Rect2(Vector2(40.0, 110.0), Vector2(880.0, 350.0)), Color(0.18, 0.12, 0.10))
	draw_rect(Rect2(Vector2(68.0, 140.0), Vector2(824.0, 270.0)), Color(0.29, 0.20, 0.16))
	draw_rect(Rect2(Vector2(88.0, 334.0), Vector2(640.0, 54.0)), Color(0.43, 0.29, 0.18))
	draw_rect(Rect2(Vector2(112.0, 162.0), Vector2(178.0, 92.0)), Color(0.10, 0.13, 0.20))
	draw_rect(Rect2(Vector2(136.0, 182.0), Vector2(130.0, 48.0)), Color(0.92, 0.59, 0.27, 0.50))
	for i in range(9):
		draw_circle(Vector2(170.0 + float(i) * 72.0, 132.0 + float(i % 2) * 8.0), 5.0, Color(1.0, 0.70, 0.28, 0.8))

func _draw_friend() -> void:
	draw_circle(friend_position + Vector2(0.0, -24.0), 16.0, Color(0.88, 0.63, 0.42))
	draw_rect(Rect2(friend_position + Vector2(-13.0, -10.0), Vector2(26.0, 36.0)), Color(0.15, 0.20, 0.28))
	draw_line(friend_position + Vector2(-5.0, -25.0), friend_position + Vector2(-5.0, -22.0), Color(0.02, 0.02, 0.03), 2.0)
	draw_line(friend_position + Vector2(5.0, -25.0), friend_position + Vector2(5.0, -22.0), Color(0.02, 0.02, 0.03), 2.0)

func _draw_pastry() -> void:
	draw_rect(Rect2(pastry_position + Vector2(-34.0, 10.0), Vector2(68.0, 16.0)), Color(0.31, 0.19, 0.11))
	draw_circle(pastry_position, 22.0, Color(0.86, 0.55, 0.24))
	draw_circle(pastry_position + Vector2(7.0, -5.0), 6.0, Color(1.0, 0.78, 0.41))

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
