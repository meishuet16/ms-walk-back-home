Muji Room Weather Runtime Assets

moon-phases.png
- 512x64 RGBA
- 8 columns x 1 row, 64x64 each
- order: new, waxing crescent, first quarter, waxing gibbous, full, waning gibbous, last quarter, waning crescent

clouds.png
- 384x128 RGBA
- 3 columns x 2 rows, 128x64 each
- 6 transparent cloud variants

rain-vfx.png
- 1024x256 RGBA
- 4 columns x 1 row, 256x256 each
- loop frames; tile/scale inside the window mask

window-mask-landscape.png
- 1536x1024 grayscale mask matching muji-room.png

window-mask-portrait.png
- 941x1672 grayscale mask matching muji-room-potrait.png

Runtime destination:
apps/html-prototype/public/assets/muji-room/weather/

Notes:
- White mask pixels permit weather overlay; black pixels block it.
- Keep room PNG above/below compositing order as appropriate so frame/curtains remain intact.
- CSS/code should handle tint, fog and lightning; no extra runtime PNG is required for those.
