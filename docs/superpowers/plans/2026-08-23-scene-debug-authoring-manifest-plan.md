# Scene Debug Authoring Manifest v1 implementation plan

1. Add focused tests for manifest parsing/validation/conversion, safe assets, duplicate references, transactional Auto Author, draft collision review, preview-only imports, constraints, viewport transforms, and runtime serialization.
2. Implement SceneDebugAuthoringManifest.ts as the JSON v1 boundary.
3. Implement SceneDebugAutoAuthor.ts with explicit existing-layout protection and editor-only metadata.
4. Implement SceneDebugConstraints.ts and SceneDebugViewport.ts as pure modules.
5. Integrate manifest validation, Auto Author summary/apply, preview-only imports, and the existing manual tools into SceneDebugEditor.ts.
6. Refactor Scene Debug CSS into independent sidebar and viewport panes with responsive behavior.
7. Run focused tests, typecheck, build, full suite, git diff --check, and browser/manual acceptance without saving authored JSON.

Verification must confirm that public/scene-layouts JSON is unchanged, 405.zip deletion remains pre-existing, runtime serialization retains the existing schema, and pre-existing failures are reported separately.

