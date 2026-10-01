# Asset Licenses — ENGINEERING QUEST

Every visual asset used by the game, its source, creator and license. Regenerate with
`node scripts/build-asset-manifest.mjs` after adding assets (each asset folder keeps its own
`manifest.<folder>.json`). Icons are fetched by `node scripts/fetch-icons.mjs`.

Summary:
- **Icons** (`public/assets/icons`): game-icons.net, **CC BY 3.0** — attribution to the individual
  authors (Lorc, Delapouite, sbed, Skoll) is required and is given here and in each SVG's header comment.
- **Characters, enemies, environments, machines**: original artwork created for this project,
  released under **CC0 1.0** (public domain dedication). Each SVG carries a header comment saying so.
- **Fonts**: Orbitron and Exo 2, **SIL Open Font License 1.1**, bundled from npm (Fontsource) so the
  game never depends on an external font server.
- **Sound**: no audio files — all sound effects are synthesised at runtime with the Web Audio API
  (`src/engine/sound/SoundEngine.ts`).

No asset is loaded from a remote URL at runtime; everything ships inside `public/assets` or the bundle.

| File | Name | Source | Creator | License | URL |
|---|---|---|---|---|---|
| characters/avatar-01.svg | Apprentice Avatar 1 | Original artwork for Engineering Quest | Engineering Quest project | CC0 1.0 | — |
| characters/avatar-02.svg | Apprentice Avatar 2 | Original artwork for Engineering Quest | Engineering Quest project | CC0 1.0 | — |
| characters/avatar-03.svg | Apprentice Avatar 3 | Original artwork for Engineering Quest | Engineering Quest project | CC0 1.0 | — |
| characters/avatar-04.svg | Apprentice Avatar 4 | Original artwork for Engineering Quest | Engineering Quest project | CC0 1.0 | — |
| characters/avatar-05.svg | Apprentice Avatar 5 | Original artwork for Engineering Quest | Engineering Quest project | CC0 1.0 | — |
| characters/avatar-06.svg | Apprentice Avatar 6 | Original artwork for Engineering Quest | Engineering Quest project | CC0 1.0 | — |
| characters/dr-catalyst.svg | Dr. Catalyst | Original artwork for Engineering Quest | Engineering Quest project | CC0 1.0 | — |
| characters/engineer-volt.svg | Engineer Volt | Original artwork for Engineering Quest | Engineering Quest project | CC0 1.0 | — |
| characters/foreman-brick.svg | Foreman Brick | Original artwork for Engineering Quest | Engineering Quest project | CC0 1.0 | — |
| characters/mechanic-ada.svg | Mechanic Ada | Original artwork for Engineering Quest | Engineering Quest project | CC0 1.0 | — |
| characters/professor-newton.svg | Professor Newton | Original artwork for Engineering Quest | Engineering Quest project | CC0 1.0 | — |
| characters/professor-vector.svg | Professor Vector | Original artwork for Engineering Quest | Engineering Quest project | CC0 1.0 | — |
| enemies/crystal-wraith.svg | Crystal Wraith | Original artwork for Engineering Quest | Engineering Quest project | CC0 1.0 | — |
| enemies/division-imp.svg | Division Imp | Original artwork for Engineering Quest | Engineering Quest project | CC0 1.0 | — |
| enemies/division-titan.svg | Division Titan | Original artwork for Engineering Quest | Engineering Quest project | CC0 1.0 | — |
| enemies/fire-beast.svg | Fire Beast | Original artwork for Engineering Quest | Engineering Quest project | CC0 1.0 | — |
| enemies/forgotten-specter.svg | Forgotten Specter | Original artwork for Engineering Quest | Engineering Quest project | CC0 1.0 | — |
| enemies/gear-sentinel.svg | Gear Sentinel | Original artwork for Engineering Quest | Engineering Quest project | CC0 1.0 | — |
| enemies/multiplication-dragon.svg | Multiplication Dragon | Original artwork for Engineering Quest | Engineering Quest project | CC0 1.0 | — |
| enemies/ore-slime.svg | Ore Slime | Original artwork for Engineering Quest | Engineering Quest project | CC0 1.0 | — |
| enemies/rust-bat.svg | Rust Bat | Original artwork for Engineering Quest | Engineering Quest project | CC0 1.0 | — |
| enemies/shadow-knight.svg | Shadow Knight | Original artwork for Engineering Quest | Engineering Quest project | CC0 1.0 | — |
| enemies/stone-golem.svg | Stone Golem | Original artwork for Engineering Quest | Engineering Quest project | CC0 1.0 | — |
| enemies/tunnel-goblin.svg | Tunnel Goblin | Original artwork for Engineering Quest | Engineering Quest project | CC0 1.0 | — |
| environments/arithmetic-village.svg | Arithmetic Village | Original artwork for Engineering Quest | Engineering Quest project | CC0 1.0 | — |
| environments/division-dungeon.svg | Division Dungeon | Original artwork for Engineering Quest | Engineering Quest project | CC0 1.0 | — |
| environments/dragon-forge.svg | Dragon Forge | Original artwork for Engineering Quest | Engineering Quest project | CC0 1.0 | — |
| environments/forgotten-dungeon.svg | Dungeon of Forgotten Knowledge | Original artwork for Engineering Quest | Engineering Quest project | CC0 1.0 | — |
| environments/mines-deep.svg | Deep Mines | Original artwork for Engineering Quest | Engineering Quest project | CC0 1.0 | — |
| environments/multiplication-mines.svg | Multiplication Mines | Original artwork for Engineering Quest | Engineering Quest project | CC0 1.0 | — |
| environments/workshop-lab.svg | Workshop Laboratory | Original artwork for Engineering Quest | Engineering Quest project | CC0 1.0 | — |
| environments/world-map.svg | World Map | Original artwork for Engineering Quest | Engineering Quest project | CC0 1.0 | — |
| fonts: Exo 2 (npm @fontsource/exo-2) | Exo 2 | Google Fonts via Fontsource | Natanael Gama | SIL OFL 1.1 | [link](https://fonts.google.com/specimen/Exo+2) |
| fonts: Orbitron (npm @fontsource/orbitron) | Orbitron | Google Fonts via Fontsource | Matt McInerney | SIL OFL 1.1 | [link](https://fonts.google.com/specimen/Orbitron) |
| icons/abacus.svg | abacus | game-icons.net | delapouite | CC BY 3.0 | [link](https://game-icons.net/1x1/delapouite/abacus.html) |
| icons/anvil.svg | anvil | game-icons.net | lorc | CC BY 3.0 | [link](https://game-icons.net/1x1/lorc/anvil.html) |
| icons/backpack.svg | backpack | game-icons.net | delapouite | CC BY 3.0 | [link](https://game-icons.net/1x1/delapouite/backpack.html) |
| icons/bell.svg | ringing-bell | game-icons.net | lorc | CC BY 3.0 | [link](https://game-icons.net/1x1/lorc/ringing-bell.html) |
| icons/bolt.svg | screw | game-icons.net | delapouite | CC BY 3.0 | [link](https://game-icons.net/1x1/delapouite/screw.html) |
| icons/book.svg | book-cover | game-icons.net | delapouite | CC BY 3.0 | [link](https://game-icons.net/1x1/delapouite/book-cover.html) |
| icons/boots.svg | boots | game-icons.net | lorc | CC BY 3.0 | [link](https://game-icons.net/1x1/lorc/boots.html) |
| icons/brain.svg | brain | game-icons.net | lorc | CC BY 3.0 | [link](https://game-icons.net/1x1/lorc/brain.html) |
| icons/bridge.svg | bridge | game-icons.net | lorc | CC BY 3.0 | [link](https://game-icons.net/1x1/lorc/bridge.html) |
| icons/calendar.svg | calendar | game-icons.net | delapouite | CC BY 3.0 | [link](https://game-icons.net/1x1/delapouite/calendar.html) |
| icons/calipers.svg | measure-tape | game-icons.net | delapouite | CC BY 3.0 | [link](https://game-icons.net/1x1/delapouite/measure-tape.html) |
| icons/chest.svg | locked-chest | game-icons.net | lorc | CC BY 3.0 | [link](https://game-icons.net/1x1/lorc/locked-chest.html) |
| icons/circuit.svg | circuitry | game-icons.net | lorc | CC BY 3.0 | [link](https://game-icons.net/1x1/lorc/circuitry.html) |
| icons/cog.svg | cog | game-icons.net | lorc | CC BY 3.0 | [link](https://game-icons.net/1x1/lorc/cog.html) |
| icons/coins.svg | coins | game-icons.net | delapouite | CC BY 3.0 | [link](https://game-icons.net/1x1/delapouite/coins.html) |
| icons/compass.svg | compass | game-icons.net | lorc | CC BY 3.0 | [link](https://game-icons.net/1x1/lorc/compass.html) |
| icons/crystal.svg | crystal-growth | game-icons.net | lorc | CC BY 3.0 | [link](https://game-icons.net/1x1/lorc/crystal-growth.html) |
| icons/dashboard.svg | progression | game-icons.net | delapouite | CC BY 3.0 | [link](https://game-icons.net/1x1/delapouite/progression.html) |
| icons/divide.svg | crystal-shine | game-icons.net | lorc | CC BY 3.0 | [link](https://game-icons.net/1x1/lorc/crystal-shine.html) |
| icons/dragon.svg | dragon-head | game-icons.net | lorc | CC BY 3.0 | [link](https://game-icons.net/1x1/lorc/dragon-head.html) |
| icons/energy.svg | lightning-storm | game-icons.net | lorc | CC BY 3.0 | [link](https://game-icons.net/1x1/lorc/lightning-storm.html) |
| icons/exit.svg | exit-door | game-icons.net | delapouite | CC BY 3.0 | [link](https://game-icons.net/1x1/delapouite/exit-door.html) |
| icons/factory.svg | factory | game-icons.net | delapouite | CC BY 3.0 | [link](https://game-icons.net/1x1/delapouite/factory.html) |
| icons/fire.svg | small-fire | game-icons.net | lorc | CC BY 3.0 | [link](https://game-icons.net/1x1/lorc/small-fire.html) |
| icons/flask.svg | round-bottom-flask | game-icons.net | lorc | CC BY 3.0 | [link](https://game-icons.net/1x1/lorc/round-bottom-flask.html) |
| icons/gauge.svg | speedometer | game-icons.net | delapouite | CC BY 3.0 | [link](https://game-icons.net/1x1/delapouite/speedometer.html) |
| icons/gauntlet.svg | gauntlet | game-icons.net | delapouite | CC BY 3.0 | [link](https://game-icons.net/1x1/delapouite/gauntlet.html) |
| icons/gear.svg | gears | game-icons.net | lorc | CC BY 3.0 | [link](https://game-icons.net/1x1/lorc/gears.html) |
| icons/gloves.svg | gloves | game-icons.net | delapouite | CC BY 3.0 | [link](https://game-icons.net/1x1/delapouite/gloves.html) |
| icons/goggles.svg | steampunk-goggles | game-icons.net | delapouite | CC BY 3.0 | [link](https://game-icons.net/1x1/delapouite/steampunk-goggles.html) |
| icons/hammer.svg | claw-hammer | game-icons.net | lorc | CC BY 3.0 | [link](https://game-icons.net/1x1/lorc/claw-hammer.html) |
| icons/heart.svg | hearts | game-icons.net | skoll | CC BY 3.0 | [link](https://game-icons.net/1x1/skoll/hearts.html) |
| icons/helmet.svg | miner | game-icons.net | delapouite | CC BY 3.0 | [link](https://game-icons.net/1x1/delapouite/miner.html) |
| icons/home.svg | house | game-icons.net | delapouite | CC BY 3.0 | [link](https://game-icons.net/1x1/delapouite/house.html) |
| icons/hourglass.svg | hourglass | game-icons.net | lorc | CC BY 3.0 | [link](https://game-icons.net/1x1/lorc/hourglass.html) |
| icons/lab.svg | erlenmeyer | game-icons.net | lorc | CC BY 3.0 | [link](https://game-icons.net/1x1/lorc/erlenmeyer.html) |
| icons/lantern.svg | lantern-flame | game-icons.net | lorc | CC BY 3.0 | [link](https://game-icons.net/1x1/lorc/lantern-flame.html) |
| icons/level-up.svg | upgrade | game-icons.net | delapouite | CC BY 3.0 | [link](https://game-icons.net/1x1/delapouite/upgrade.html) |
| icons/lock.svg | padlock | game-icons.net | lorc | CC BY 3.0 | [link](https://game-icons.net/1x1/lorc/padlock.html) |
| icons/map.svg | treasure-map | game-icons.net | lorc | CC BY 3.0 | [link](https://game-icons.net/1x1/lorc/treasure-map.html) |
| icons/medal.svg | medal | game-icons.net | lorc | CC BY 3.0 | [link](https://game-icons.net/1x1/lorc/medal.html) |
| icons/mine.svg | mine-truck | game-icons.net | delapouite | CC BY 3.0 | [link](https://game-icons.net/1x1/delapouite/mine-truck.html) |
| icons/multiply.svg | cross-mark | game-icons.net | lorc | CC BY 3.0 | [link](https://game-icons.net/1x1/lorc/cross-mark.html) |
| icons/nut.svg | hexagonal-nut | game-icons.net | delapouite | CC BY 3.0 | [link](https://game-icons.net/1x1/delapouite/hexagonal-nut.html) |
| icons/ore.svg | mineral-heart | game-icons.net | lorc | CC BY 3.0 | [link](https://game-icons.net/1x1/lorc/mineral-heart.html) |
| icons/pickaxe.svg | war-pick | game-icons.net | delapouite | CC BY 3.0 | [link](https://game-icons.net/1x1/delapouite/war-pick.html) |
| icons/potion.svg | potion-ball | game-icons.net | lorc | CC BY 3.0 | [link](https://game-icons.net/1x1/lorc/potion-ball.html) |
| icons/pump.svg | water-tank | game-icons.net | delapouite | CC BY 3.0 | [link](https://game-icons.net/1x1/delapouite/water-tank.html) |
| icons/quest.svg | stairs-goal | game-icons.net | delapouite | CC BY 3.0 | [link](https://game-icons.net/1x1/delapouite/stairs-goal.html) |
| icons/reactor.svg | nuclear-plant | game-icons.net | delapouite | CC BY 3.0 | [link](https://game-icons.net/1x1/delapouite/nuclear-plant.html) |
| icons/repair.svg | auto-repair | game-icons.net | lorc | CC BY 3.0 | [link](https://game-icons.net/1x1/lorc/auto-repair.html) |
| icons/robot.svg | robot-antennas | game-icons.net | delapouite | CC BY 3.0 | [link](https://game-icons.net/1x1/delapouite/robot-antennas.html) |
| icons/rock.svg | rock | game-icons.net | lorc | CC BY 3.0 | [link](https://game-icons.net/1x1/lorc/rock.html) |
| icons/ruler.svg | stone-block | game-icons.net | lorc | CC BY 3.0 | [link](https://game-icons.net/1x1/lorc/stone-block.html) |
| icons/screwdriver.svg | screwdriver | game-icons.net | lorc | CC BY 3.0 | [link](https://game-icons.net/1x1/lorc/screwdriver.html) |
| icons/scroll.svg | scroll-unfurled | game-icons.net | lorc | CC BY 3.0 | [link](https://game-icons.net/1x1/lorc/scroll-unfurled.html) |
| icons/settings.svg | settings-knobs | game-icons.net | delapouite | CC BY 3.0 | [link](https://game-icons.net/1x1/delapouite/settings-knobs.html) |
| icons/shield.svg | shield | game-icons.net | sbed | CC BY 3.0 | [link](https://game-icons.net/1x1/sbed/shield.html) |
| icons/skill-tree.svg | family-tree | game-icons.net | delapouite | CC BY 3.0 | [link](https://game-icons.net/1x1/delapouite/family-tree.html) |
| icons/skull.svg | skull-crossed-bones | game-icons.net | lorc | CC BY 3.0 | [link](https://game-icons.net/1x1/lorc/skull-crossed-bones.html) |
| icons/snowflake.svg | snowflake-2 | game-icons.net | lorc | CC BY 3.0 | [link](https://game-icons.net/1x1/lorc/snowflake-2.html) |
| icons/sound-off.svg | speaker-off | game-icons.net | delapouite | CC BY 3.0 | [link](https://game-icons.net/1x1/delapouite/speaker-off.html) |
| icons/sound-on.svg | speaker | game-icons.net | delapouite | CC BY 3.0 | [link](https://game-icons.net/1x1/delapouite/speaker.html) |
| icons/star.svg | round-star | game-icons.net | delapouite | CC BY 3.0 | [link](https://game-icons.net/1x1/delapouite/round-star.html) |
| icons/sword.svg | broadsword | game-icons.net | lorc | CC BY 3.0 | [link](https://game-icons.net/1x1/lorc/broadsword.html) |
| icons/target.svg | target-arrows | game-icons.net | lorc | CC BY 3.0 | [link](https://game-icons.net/1x1/lorc/target-arrows.html) |
| icons/telescope.svg | telescope | game-icons.net | delapouite | CC BY 3.0 | [link](https://game-icons.net/1x1/delapouite/telescope.html) |
| icons/test-tubes.svg | test-tubes | game-icons.net | lorc | CC BY 3.0 | [link](https://game-icons.net/1x1/lorc/test-tubes.html) |
| icons/trophy.svg | trophy-cup | game-icons.net | delapouite | CC BY 3.0 | [link](https://game-icons.net/1x1/delapouite/trophy-cup.html) |
| icons/unlock.svg | unlocking | game-icons.net | lorc | CC BY 3.0 | [link](https://game-icons.net/1x1/lorc/unlocking.html) |
| icons/wrench.svg | spanner | game-icons.net | lorc | CC BY 3.0 | [link](https://game-icons.net/1x1/lorc/spanner.html) |
| machines/bridge-stage-0.svg | Bridge Stage 0 (Collapsed) | Original artwork for Engineering Quest | Engineering Quest project | CC0 1.0 | — |
| machines/bridge-stage-1.svg | Bridge Stage 1 (Supports) | Original artwork for Engineering Quest | Engineering Quest project | CC0 1.0 | — |
| machines/bridge-stage-2.svg | Bridge Stage 2 (Deck) | Original artwork for Engineering Quest | Engineering Quest project | CC0 1.0 | — |
| machines/bridge-stage-3.svg | Bridge Stage 3 (Complete) | Original artwork for Engineering Quest | Engineering Quest project | CC0 1.0 | — |
| machines/mathematical-engine.svg | Mathematical Engine | Original artwork for Engineering Quest | Engineering Quest project | CC0 1.0 | — |
| machines/measurement-bench.svg | Measurement Bench | Original artwork for Engineering Quest | Engineering Quest project | CC0 1.0 | — |
| machines/power-core-multiplication.svg | Multiplication Power Core | Original artwork for Engineering Quest | Engineering Quest project | CC0 1.0 | — |
| machines/water-pump.svg | Water Pump | Original artwork for Engineering Quest | Engineering Quest project | CC0 1.0 | — |
| machines/workshop-building.svg | Workshop Building | Original artwork for Engineering Quest | Engineering Quest project | CC0 1.0 | — |
| ui/icon-192.png | App icon 192 | Rendered from icons/gear.svg (game-icons.net, Lorc) | Lorc / Engineering Quest project | CC BY 3.0 | [link](https://game-icons.net/1x1/lorc/gears.html) |
| ui/icon-512.png | App icon 512 | Rendered from icons/gear.svg (game-icons.net, Lorc) | Lorc / Engineering Quest project | CC BY 3.0 | [link](https://game-icons.net/1x1/lorc/gears.html) |
