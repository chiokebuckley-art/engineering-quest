# Weakest Gear studio and family avatars

Choose Engineer, Ian, Myla or Ella before creating or joining a Weakest Gear game. Pass-and-play friends can choose their own character. Character selection is separate from the player's name and does not change mastery ownership. Online room hello, roster and state messages preserve the choice; older saves and invalid choices use Engineer.

The studio loads only when playing Weakest Gear. Eight separately addressable podiums are available; unused stations are hidden. The selected character stands behind its assigned podium. A warm spotlight moves toward the answering player and their podium strips glow amber. Feedback keeps the light on the previous answering finalist until the next question begins. Voting and elimination turn the player spotlight off, eliminated characters disappear, and the winner is illuminated. Reduced motion snaps the spotlight to its target.

The existing labeled player podiums and question controls stay available when WebGL or an asset fails. Selection controls use native buttons, pressed state, and labeled selects. Assets resolve under the deployment base path.

## Assets

`public/assets/weakest-gear/studio.glb` is the Blender-authored studio. `ian.glb`, `myla.glb`, and `ella.glb` are simplified stylized 3D characters, with grouped geometry for fewer draw calls. The three JPGs are selection portraits made using the built-in image-generation tool from a user-supplied family photo. The original photograph is not included. These portraits are illustrations; the 3D models are simplified interpretations and do not match the portrait detail.

Portrait prompt set: individually depict Ian (left: voluminous short dark curls, green T-shirt), Myla (middle: short swept-back light brown curls, white top with pink floral details), and Ella (right: shoulder-length dark curls, magenta sleeveless romper). Preserve recognizable reference features and age-appropriate proportions; friendly stylized 3D game portrait, front facing with relaxed arms and soft studio lighting; no text, props, or other people. Transparent background was requested, but returned portraits contain a backdrop, so they are used only as cropped selection cards.

## Validation

Nine focused tests cover avatar selection controls, randomized seating, backward-compatible defaults, normal question/feedback transitions, final feedback, voting/elimination, winner lighting, and online launch/state adoption. TypeScript and the production build pass. Blender previews verify the 3D asset layout. Browser visual inspection and real multi-device/network play remain unverified because the browser tool could not verify its security policy in this session. Existing engine scoring and mastery logic are unchanged.

The source app lives in `command-center/engineering-quest`; the separate public `engineering-quest` repository contains published build output. This source change must be merged and deployed through the normal app publishing workflow before it appears in the live app.
