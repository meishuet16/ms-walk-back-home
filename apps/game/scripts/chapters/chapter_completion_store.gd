class_name ChapterCompletionStore
extends RefCounted

const COMPLETION_PATH := "user://chapter_completion.json"
const COMPLETION_OVERRIDE_META := "chapter_completion_path_override"

static func save_completed(chapter_id: String, entry_id: String) -> void:
	var completion_path := _completion_path()
	var completion_dir := completion_path.get_base_dir()
	if completion_dir != "":
		DirAccess.make_dir_recursive_absolute(ProjectSettings.globalize_path(completion_dir))
	var completion := {
		"chapterId": chapter_id,
		"entryId": entry_id,
		"completed": true,
		"completedAt": Time.get_datetime_string_from_system(true)
	}
	var file := FileAccess.open(completion_path, FileAccess.WRITE)
	if file != null:
		file.store_string(JSON.stringify(completion))

static func load_completed_chapters() -> Dictionary:
	var completion_path := _completion_path()
	if not FileAccess.file_exists(completion_path):
		return {}
	var file := FileAccess.open(completion_path, FileAccess.READ)
	if file == null:
		return {}
	var parsed = JSON.parse_string(file.get_as_text())
	if typeof(parsed) != TYPE_DICTIONARY:
		return {}
	if bool(parsed.get("completed", false)):
		return { str(parsed.get("chapterId", "")): true }
	return {}

static func _completion_path() -> String:
	if Engine.has_meta(COMPLETION_OVERRIDE_META):
		return str(Engine.get_meta(COMPLETION_OVERRIDE_META))
	return COMPLETION_PATH
