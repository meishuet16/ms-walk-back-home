extends SceneTree

const BAKERY_SCENE := preload("res://scenes/chapters/bakery_day.tscn")
const CompletionStore := preload("res://scripts/chapters/chapter_completion_store.gd")

func _init() -> void:
	Engine.set_meta("chapter_completion_path_override", "res://../../.godot-user-data/smoke-user/chapter_completion.json")
	var chapter := BAKERY_SCENE.instantiate()
	root.add_child(chapter)
	await process_frame
	if chapter.fixture_error_text != "":
		_fail(chapter.fixture_error_text)
		return
	_move_to_target_and_interact(chapter, "npc_friend_01")
	if chapter.objective_index != 2:
		_fail("Expected talk objective to complete.")
		return
	_move_to_target_and_interact(chapter, "obj_pastry")
	if chapter.objective_index != 3:
		_fail("Expected inspect objective to complete.")
		return
	chapter.muji_position = chapter.exit_rect.get_center()
	await process_frame
	chapter._process(0.016)
	if not chapter.ending_visible:
		_fail("Expected chapter ending after walking to exit.")
		return
	var completed := CompletionStore.load_completed_chapters()
	var chapter_id := str(chapter.manifest.get("id", ""))
	if not bool(completed.get(chapter_id, false)):
		_fail("Expected completion state to persist for " + chapter_id + ".")
		return
	print("Bakery chapter smoke test completed and persisted " + chapter_id + ".")
	quit(0)

func _move_to_target_and_interact(chapter: Node, target_id: String) -> void:
	chapter.muji_position = chapter.target_positions[target_id]
	chapter._try_interact()

func _fail(message: String) -> void:
	push_error(message)
	quit(1)
