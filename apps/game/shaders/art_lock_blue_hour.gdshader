shader_type canvas_item;

uniform vec4 shadow_tint : source_color = vec4(0.03, 0.07, 0.12, 1.0);
uniform vec4 warm_tint : source_color = vec4(1.0, 0.66, 0.28, 1.0);
uniform float warm_amount : hint_range(0.0, 1.0) = 0.0;
uniform float shadow_amount : hint_range(0.0, 1.0) = 0.12;

void fragment() {
	vec4 source = texture(TEXTURE, UV) * COLOR;
	vec3 cooled = mix(source.rgb, shadow_tint.rgb, shadow_amount);
	vec3 warmed = mix(cooled, warm_tint.rgb, warm_amount * source.a);
	COLOR = vec4(warmed, source.a);
}

