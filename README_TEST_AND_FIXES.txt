ARCANE ALCHEMIST — GAMEPLAY FIX PACKAGE

Games included
1. Arcane Alchemist (Potion Lab)
2. Ball Sorter
3. Two-Hand Duel
4. Healthy Sorter
5. Two-Player Sorter
6. Grab & Drop

Changes in this revision
- Corrected mirrored-camera target coordinates for Ball Sorter and Healthy Sorter. The visible upper target is on the mirrored camera's right side, and the visible lower target is on its left side.
- Corrected the same mirrored-coordinate mismatch for Two-Player Sorter target detection.
- Corrected Grab & Drop delivery zones to match the positions of the visible mirrored camera targets. Pinch threshold is slightly more tolerant, and the cursor/orb continue to use arena-relative coordinates.
- Made hand pose classification more tolerant by lowering the finger-extension ratio threshold and improving peace-sign detection. Two-Hand Duel uses the recognized PEACE pose as scissors.
- Preserved the existing layout, artwork, Potion Lab, scoring, and game selection.

Validation performed in this package
- JavaScript syntax check passed for index.html and potion-lab.html.
- ZIP integrity check passed.
- Local image references were checked against files included in this package.

Not yet verified
I cannot simulate the phone camera or confirm real-world gesture recognition in this environment. Please test each game on the published HTTPS page in bright, even lighting. If a gesture is still missed, report which game and the text shown under the camera (Detected: ...).

Deployment
Extract the ZIP and upload the contents of the Move-Game-main folder to the root of the existing GitHub Pages repository, replacing the old files. Keep potion-lab.html and all image assets. Commit to the main branch, then refresh the site on your phone.

REVISION 3 (gesture games fix)
- Fixed unclosed <section id="home"> that nested the game screen inside the hidden home screen.
- Ball/Healthy/Two-Player Sorter: detection zones now match the visible targets (upper-left, lower-right of the mirrored camera view); any detected hand can score.
- Grab & Drop: drop zones corrected to match the arena targets; pinch is now relative to hand size with hysteresis, so it no longer drops mid-drag.
- Two-Hand Duel: hands ordered left/right by screen position, rock with side thumb accepted, brief flicker no longer restarts the countdown.
- Camera overlay text no longer mirrored; GPU->CPU fallback for hand tracking; Play Again now resets the round.
- Images enhanced (2x resolution, denoised, sharpened).

REVISION 4
- Ball Sorter / Healthy Sorter: the ball (or food) now FOLLOWS your index fingertip in both the arena and the camera view. Carry it to the matching target (red ball -> RED upper-left, blue ball -> BLUE lower-right; nourishing food -> NOURISH, treats -> TREAT). Wrong target = no points and the streak resets.
- Grab & Drop: easier pinch, bigger grab radius, live status ("Open / Pinching - cursor is on the orb"), orb returns to centre if the hand is lost.
- Two-Hand Duel: more robust finger detection, debounced countdown, live readout "Detected: left X . right Y".
