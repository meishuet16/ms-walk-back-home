extends Node2D

const PORTAL_STATES := ["locked", "imported", "playable"]

func _ready() -> void:
	print("Memory Forest fixture loaded with ", PORTAL_STATES.size(), " portal states.")
