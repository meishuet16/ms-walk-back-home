# May 23 “我到了，你呢” Implementation Plan

## Tasks

1. Register the approved chapter and fictional diary fixture.
   - Add the chapter definition, reflection choices, echo copy, individual frame registries, and canonical closure.
   - Add the editable diary entry and register the chapter in ChapterRegistry.

2. Extend the shared authored runtime.
   - Add per-action sprite cycles and visual-scale interpolation to CutsceneSystem.
   - Render actor visual scale through SceneActorRenderer.
   - Preserve legacy authored moves when no cycle is supplied.

3. Wire scene 523.
   - Register both authored layouts and preload all frame assets.
   - Consume hostel-lobby-arrival only within the matching chapter/event visit.
   - Route diary-memory, main replay, reflection checkpoints, and echo anchors through the existing authored-scene lifecycle.

4. Implement the approved choreography.
   - Preserve Portrait canonical directions and derive Landscape directions from layout geometry.
   - Keep MS, ET, and Tung Ern separate; despawn the pair between the outbound and return sequences.
   - Use idle frames after stops and the four-frame walking cycle during movement.

5. Add regression coverage.
   - Verify layouts, trigger booleans, diary linkage, actor/frame registries, dialogue ownership, physical return ordering, Landscape routing, pair identity, and scale/cycle behavior.

6. Verify.
   - Run typecheck, build, focused tests, full prototype tests, and agent-browser checks in Portrait and Landscape.
   - Keep unrelated existing failures separate from the May 23 result and do not push.

