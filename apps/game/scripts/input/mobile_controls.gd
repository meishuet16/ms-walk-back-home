extends RefCounted
class_name MobileControls

const BREAKPOINT_WIDTH := 720.0
const BREAKPOINT_HEIGHT := 480.0

var touch_direction := Vector2.ZERO
var interaction_pressed := false
var up_rect := Rect2()
var down_rect := Rect2()
var left_rect := Rect2()
var right_rect := Rect2()
var action_rect := Rect2()

func update_layout(viewport_size: Vector2) -> void:
	var base := viewport_size.y - 150.0
	left_rect = Rect2(Vector2(42.0, base + 46.0), Vector2(54.0, 54.0))
	right_rect = Rect2(Vector2(158.0, base + 46.0), Vector2(54.0, 54.0))
	up_rect = Rect2(Vector2(100.0, base - 10.0), Vector2(54.0, 54.0))
	down_rect = Rect2(Vector2(100.0, base + 102.0), Vector2(54.0, 54.0))
	action_rect = Rect2(Vector2(viewport_size.x - 120.0, base + 42.0), Vector2(76.0, 76.0))

func should_show(viewport_size: Vector2) -> bool:
	var window_size := Vector2(DisplayServer.window_get_size())
	return (
		DisplayServer.is_touchscreen_available()
		or viewport_size.x <= BREAKPOINT_WIDTH
		or viewport_size.y <= BREAKPOINT_HEIGHT
		or window_size.x <= BREAKPOINT_WIDTH
		or window_size.y <= BREAKPOINT_HEIGHT
	)

func handle_input(event: InputEvent, viewport_size: Vector2) -> bool:
	if not should_show(viewport_size):
		return false
	if event is InputEventScreenTouch:
		var touch := event as InputEventScreenTouch
		if touch.pressed:
			return _set_from_point(touch.position)
		touch_direction = Vector2.ZERO
		return true
	if event is InputEventScreenDrag:
		var drag := event as InputEventScreenDrag
		return _set_from_point(drag.position)
	if event is InputEventMouseButton:
		var mouse := event as InputEventMouseButton
		if mouse.button_index != MOUSE_BUTTON_LEFT:
			return false
		if mouse.pressed:
			return _set_from_point(mouse.position)
		touch_direction = Vector2.ZERO
		return true
	return false

func consume_interaction_pressed() -> bool:
	var pressed := interaction_pressed
	interaction_pressed = false
	return pressed

func _set_from_point(point: Vector2) -> bool:
	touch_direction = Vector2.ZERO
	if up_rect.has_point(point):
		touch_direction.y = -1.0
	elif down_rect.has_point(point):
		touch_direction.y = 1.0
	elif left_rect.has_point(point):
		touch_direction.x = -1.0
	elif right_rect.has_point(point):
		touch_direction.x = 1.0
	elif action_rect.has_point(point):
		interaction_pressed = true
	return touch_direction != Vector2.ZERO or interaction_pressed

func draw(canvas: CanvasItem, viewport_size: Vector2) -> void:
	if not should_show(viewport_size):
		return
	var pad_color := Color(0.08, 0.13, 0.16, 0.62)
	var active_color := Color(0.67, 0.86, 0.86, 0.36)
	for item in [
		[up_rect, "U", touch_direction.y < 0.0],
		[down_rect, "D", touch_direction.y > 0.0],
		[left_rect, "L", touch_direction.x < 0.0],
		[right_rect, "R", touch_direction.x > 0.0]
	]:
		var rect: Rect2 = item[0]
		canvas.draw_rect(rect, active_color if item[2] else pad_color)
		canvas.draw_string(ThemeDB.fallback_font, rect.position + Vector2(18.0, 34.0), str(item[1]), HORIZONTAL_ALIGNMENT_LEFT, 24.0, 18, Color(0.92, 0.98, 0.96))
	canvas.draw_rect(action_rect, Color(0.88, 0.62, 0.34, 0.58))
	canvas.draw_string(ThemeDB.fallback_font, action_rect.position + Vector2(25.0, 46.0), "E", HORIZONTAL_ALIGNMENT_LEFT, 28.0, 22, Color(0.08, 0.06, 0.04))
