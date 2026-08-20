# Journal State Separation and Crop Rendering Design

## Goal

Fix the mobile Journal Books year routing and make Edit Journal inline image previews and Journal Reader render the exact same saved source crop, while preserving PDF export and persisted diary compatibility.

## Approved architecture

Books and Timeline will use separate navigation state. Timeline keeps its own month cursor and existing filters; Books keeps a selected year and month context. Books year buttons use a dedicated `journal-books-year` action, and Books/Reader month navigation never routes through `showTimeline()`.

Journal image crops remain percentage rectangles in the original source image:

```ts
{ x, y, width, height }
```

The values are normalized to percentages at the boundary and are not rewritten when legacy media dimensions are resolved. A shared crop render model computes the source aspect, frame aspect, and translated/scaled original-image placement. Both Edit Journal inline media and Journal Reader use the same wrapper/image structure. The image keeps its intrinsic aspect ratio and is never subjected to a second `object-fit: cover` crop.

Stored `width`/`height` values are preferred. For legacy media without dimensions, the initial render uses a safe placeholder aspect and the image `onload` handler replaces it with `naturalWidth / naturalHeight`; the saved crop remains unchanged.

PDF export code, canvas layout, media files/data URLs, video behavior, autosave, backup/restore, and existing crop records are outside the change.

## Rendering formula

For a source image with dimensions `sourceWidth × sourceHeight`, and percentage crop `x, y, width, height`:

```text
sourceAspect = sourceWidth / sourceHeight
frameAspect = (sourceWidth * width) / (sourceHeight * height)
imageWidth = frameWidth * 100 / width
imageLeft = -frameWidth * x / width
imageTop = -frameHeight * y / height
```

The wrapper uses `frameAspect`. The original image uses the computed width, intrinsic height, and the computed translations. This makes the visible source rectangle exactly `[x, y, width, height]` regardless of responsive frame size.

## Verification

Regression tests will cover Books/Timeline state isolation and navigation, the crop model for full, square, portrait, 16:9, freeform, off-center, and edge crops, legacy dimensions, persistence, and the absence of a second cover crop. Final verification will run the requested typecheck, test, build, and a manual 390×844 check for wide, square, portrait, and shifted crops.
