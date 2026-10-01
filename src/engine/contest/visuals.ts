/**
 * Picture types for the Contest Path games (Pattern Lab, Spatial Blocks, Counting Paths, Data, Logic Lite,
 * Multi-step %, Mirror & Grid). They join the shared `Visual` union, so every screen that draws a question
 * (Arcade, lessons, the notebook, battles) can draw them. Each is drawn by src/game/components/contest/.
 *
 * Rule for every picture: it shows the problem, never the answer. A worked picture that does show the answer
 * goes in `solutionVisual`, which only appears in "Show me how".
 */

/** Simple flat pictures that young players recognise. Drawn by ContestIcon. */
export type ContestIcon =
  | 'frog' | 'apple' | 'star' | 'fish' | 'bird' | 'car' | 'cube' | 'coin' | 'hat' | 'shirt' | 'shoe' | 'cone' | 'scoop'
  | 'cookie' | 'ball' | 'book' | 'flower' | 'cat' | 'dog' | 'robot' | 'gear' | 'person' | 'pizza' | 'juice' | 'sandwich'
  | 'tree' | 'house' | 'heart' | 'sun' | 'moon' | 'bolt' | 'key' | 'bell' | 'kite' | 'boat';
export const CONTEST_ICONS: ContestIcon[] = ['frog', 'apple', 'star', 'fish', 'bird', 'car', 'cube', 'coin', 'hat', 'shirt', 'shoe', 'cone', 'scoop', 'cookie', 'ball', 'book', 'flower', 'cat', 'dog', 'robot', 'gear', 'person', 'pizza', 'juice', 'sandwich', 'tree', 'house', 'heart', 'sun', 'moon', 'bolt', 'key', 'bell', 'kite', 'boat'];

export type ShapeName = 'circle' | 'square' | 'triangle' | 'star' | 'heart' | 'diamond' | 'hexagon' | 'moon';
export type ColorName = 'red' | 'blue' | 'yellow' | 'green' | 'purple' | 'orange';
export const SHAPES: ShapeName[] = ['circle', 'square', 'triangle', 'star', 'heart', 'diamond', 'hexagon', 'moon'];
export const COLORS: ColorName[] = ['red', 'blue', 'yellow', 'green', 'purple', 'orange'];

/** One cell of a pattern train: a coloured shape (optionally turned), a number, or both. */
export interface PatternCell { shape?: ShapeName; color?: ColorName; num?: number; rot?: 0 | 90 | 180 | 270; size?: 's' | 'm' | 'l' }

export type ContestVisual =
  /** Pattern Lab: a train of cells; `null` is a blank box drawn with "?", an empty cell `{}` is drawn as "…" (a gap). `under` = optional small captions under the cells ("1st", "2nd", …, "47th"). */
  | { type: 'pattern'; cells: (PatternCell | null)[]; under?: string[] }
  /** Pattern Lab: a growing figure. Each step is a list of [col, row] unit squares (row 0 at the bottom); `ask` adds a "?" step with that number. `showNew` colours the squares each step adds (worked pictures). `nums` = the step numbers drawn when they are not 1, 2, 3, … (a jump draws "…" between steps). */
  | { type: 'growing'; steps: [number, number][][]; ask?: number; showNew?: boolean; nums?: number[] }
  /** Pattern Lab: a function machine and its in → out table; '?' cells are blank. `rule` is shown only when given. */
  | { type: 'machine'; rule?: string; rows: { input: number | '?'; output: number | '?' }[] }
  /** Spatial Blocks: an isometric stack. heights[row][col] cubes stand on each square; row 0 is at the back. `ghost` is the worked picture: the towers stood side by side (back row first) so every cube shows, the cubes hidden in the stack in pink, each tower's height on its top. `box` draws an open box that many cubes tall around the whole grid (Fill the box); with `ghost` the cubes still needed show as see-through pink cubes. `highlight` colours those faces teal. `layers` also draws the stack's layers pulled apart under it, top layer first, each a flat slab (with `ghost`: only the slabs, each with its number of cubes). */
  | { type: 'iso'; heights: number[][]; ghost?: boolean; highlight?: 'top' | 'front' | 'side'; box?: number; layers?: boolean }
  /** Spatial Blocks: a big n × n × n cube painted on the outside; `cut` draws it cut into unit cubes, coloured by how many painted faces each has, with the unpainted inside block lifted out beside it (worked picture, with a key). */
  | { type: 'paintcube'; n: number; cut?: boolean }
  /** Counting: groups to combine (outfits, menus). `tree` draws the branches too (worked pictures only). Rule extras (item names): `marks` = items the question names (gold ring); `crossed` = an item the question rules out (red ring and ✕); `bans` = two items that never go together (red rings, and a "never together" card under the menu). */
  | { type: 'menu'; groups: { label: string; items: { name: string; icon: ContestIcon; color?: ColorName }[] }[]; tree?: boolean; marks?: string[]; crossed?: string[]; bans?: [string, string][] }
  /** Counting: a w × h grid of streets from start (bottom-left) to finish (top-right); `blocked` corners cannot be used. `path` = one example route drawn in teal. `counts` writes the number of routes into each corner (worked pictures only). */
  | { type: 'gridpath'; w: number; h: number; blocked?: [number, number][]; path?: [number, number][]; counts?: boolean }
  /** Counting: things to put in order (`row`) or to pair up (`pairs`, drawn round a circle). Row extras: `places` = the spots to fill, drawn as slots under the row ("1st", "Gold"); `fixed` = [item, place]: that item already stands in that spot; `together` = two items that must stand side by side, drawn holding hands; `apart` = two items that must not stand side by side (red ✕ arc); `mark` = items the question names (gold ring). `lines` (pairs) joins every two (worked pictures only). Pairs extras: `late` = this item arrives late (drawn outside the circle with a "late" tag); `skip` = this pair does not pair up (red ✕ line). */
  | { type: 'lineup'; items: { name: string; icon: ContestIcon; color?: ColorName }[]; mode: 'row' | 'pairs'; places?: string[]; fixed?: [number, number]; together?: [number, number]; apart?: [number, number]; mark?: number[]; lines?: boolean; late?: number; skip?: [number, number] }
  /** Data: a pictograph (each icon is worth `key`; a count that is not a whole number of icons ends in a half icon) or, with `tally`, a tally chart. `bar` = draw a bar chart instead, with a grid line every `bar` units. Extras: `ask` = this row's amount is to find (drawn "?"); `values` prints each row's amount and `highlight` colours rows (worked pictures, or when the amounts are given); `line` = a dashed level line at that amount (bar charts, e.g. the mean). */
  | { type: 'picto'; title: string; icon: ContestIcon; key: number; rows: { label: string; n: number }[]; tally?: boolean; bar?: number; ask?: number; values?: boolean; highlight?: number[]; line?: number }
  /** Data: a pie chart. Slices in any unit; `showPct` prints each share as a percent. `parts` draws faint guide lines cutting the pie into that many equal parts (count the eighths). `ask` = this slice's share is to find (drawn "?"). */
  | { type: 'pie'; title?: string; slices: { label: string; v: number }[]; showPct?: boolean; highlight?: number; parts?: number; ask?: number }
  /** Data: a 2- or 3-circle Venn diagram. Region keys: 'A', 'B', 'AB', 'none' (and 'C', 'AC', 'BC', 'ABC' with three sets); a key left out is drawn blank. '?' is to find. `sizes` = how many are in each whole circle, printed under its name. */
  | { type: 'venn'; sets: string[]; counts: Record<string, number | '?'>; total?: number | '?'; sizes?: (number | '?')[] }
  /** Logic: a who-has-what grid with ✓ / ✗ marks found so far. */
  | { type: 'logicgrid'; rows: string[]; cols: string[]; marks?: ('yes' | 'no' | null)[][] }
  /** Logic: people and what each one says (truth-teller and fibber puzzles). */
  | { type: 'speakers'; people: { name: string; says: string; icon?: ContestIcon }[] }
  /** Logic: a picture of things to test statements against. When every item has n = 1 they stand in one row, left to right in list order (next to, between); otherwise each item is a group. `title` is a caption over the picture ("Mia's bag"). A `hidden` item is a closed box that may hold some of that thing (its `n` is not shown): nobody can see how many. */
  | { type: 'scene'; items: { icon: ContestIcon; color?: ColorName; n: number; label?: string; hidden?: boolean }[]; title?: string }
  /**
   * Multi-step percent: a bar for the start amount and each percent step in turn. Amounts after the steps are hidden unless `reveal`.
   * Step kinds: 'off' takes that percent away (what is left goes on), 'on' adds that percent, 'take' keeps that percent of it (a part of a part).
   * `ask: 'pct'` asks for a percent instead: the amounts show and the step percents are hidden ("?%") unless `reveal`.
   * `grid` draws a start of 100 as a 10 × 10 hundred grid with the first step's share shaded.
   * A unit of '$' writes money ($80, $38.88); a unit of '%' writes every amount as a percent of the start (100%).
   */
  | { type: 'pctsteps'; start: number; unit: string; steps: { label: string; pct: number; kind: 'off' | 'on' | 'take' }[]; reveal?: boolean; ask?: 'pct'; grid?: boolean }
  /**
   * Mirror & Grid: shaded squares [col, row] on a w × h grid (row 0 at the bottom); `axis` draws a mirror line at a grid line; `ghost` squares are drawn dashed.
   * Optional extras (Mirror & Grid only; points are in grid units, (0, 0) = the bottom-left corner of the grid):
   * `halves` = half squares [col, row, corner], the triangle whose square corner sits at corner 0 bottom-left, 1 bottom-right, 2 top-right or 3 top-left;
   * `sides` = length labels on stretches of the outline, from grid point a to grid point b (written outside the shape; "?" = still to find);
   * `plain` = no grid lines: a figure drawn to scale and read by its labels; `poly` = a polygon (named shapes, triangles on the grid);
   * `lines` = dashed teal lines (lines of symmetry, cuts, a box around a triangle) for worked pictures; `count` numbers the shaded squares (worked pictures).
   */
  | { type: 'gridshape'; w: number; h: number; cells: [number, number][]; axis?: { dir: 'v' | 'h'; at: number }; ask?: 'perimeter' | 'area' | 'mirror' | 'lines'; ghost?: [number, number][]; halves?: [number, number, 0 | 1 | 2 | 3][]; sides?: { a: [number, number]; b: [number, number]; text: string }[]; plain?: boolean; poly?: [number, number][]; lines?: [[number, number], [number, number]][]; count?: boolean }
  /**
   * Tangram lite: a picture made of pieces placed on a 4 × 4 square grid; `outline` hides the cuts.
   * Optional extras (Mirror & Grid only): a `ghost` piece is the gap to fill, drawn dashed with "?"; `marks` writes on each piece its number
   * ('count') or its size in small triangles ('area') (worked pictures). A `dim` piece is drawn faded and gets no mark (worked pictures:
   * the pieces a count leaves out).
   */
  | { type: 'tangram'; pieces: { kind: 'tri-s' | 'tri-m' | 'tri-l' | 'square' | 'para'; x: number; y: number; rot: 0 | 90 | 180 | 270; color?: ColorName; ghost?: boolean; dim?: boolean }[]; outline?: boolean; marks?: 'count' | 'area' }
  /**
   * Small-number stories: groups of pictures in rows of five; `leaving` groups are drawn walking away with an arrow.
   * Optional extras (track shell): `arriving` groups are drawn coming in with an arrow towards the first group;
   * a `hidden` group is a closed box with "?" (its `n` is not shown); `title` is a caption over the picture.
   */
  | { type: 'objects'; groups: { icon: ContestIcon; n: number; label?: string; leaving?: boolean; color?: ColorName; arriving?: boolean; hidden?: boolean }[]; title?: string };

export const CONTEST_VISUAL_TYPES = ['pattern', 'growing', 'machine', 'iso', 'paintcube', 'menu', 'gridpath', 'lineup', 'picto', 'pie', 'venn', 'logicgrid', 'speakers', 'scene', 'pctsteps', 'gridshape', 'tangram', 'objects'] as const;
export const isContestVisual = (v: { type: string }): v is ContestVisual => (CONTEST_VISUAL_TYPES as readonly string[]).includes(v.type);
