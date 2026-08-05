class_name ChapterCompletionStore
extends RefCounted

const COMPLETION_PATH := "user://chapter_completion.json"

static func save_completed(chapter_id: String, entry_id: String) -> void:
	var completion := {
		"chapterId": chapter_id,
		"entryId": entry_id,
		"completed": true,
		"completedAt": Time.get_datetime_string_from_system(true)
	}
	var file := FileAccess.open(COMPLETION_PATH, FileAccess.WRITE)
	if file != null:
		file.store_string(JSON.stringify(completion))

static func load_completed_chapters() -> Dictionary:
	if not FileAccess.file_exists(COMPLETION_PATH):
		return {}
	var file := FileAccess.open(COMPLETION_PATH, FileAccess.READ)
	if file == null:
		return {}
	var parsed = JSON.parse_string(file.get_as_text())
	if typeof(parsed) != TYPE_DICTIONARY:
		return {}
	if bool(parsed.get("completed", false)):
		return { str(parsed.get("chapterId", "")): true }
	return {}
