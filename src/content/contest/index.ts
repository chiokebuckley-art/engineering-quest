import type { LessonDef } from '../lessons';
import { PATTERN_LESSONS } from './patterns';
import { BLOCKS_LESSONS } from './spatialBlocks';
import { PATHS_LESSONS } from './countingPaths';
import { DATA_LESSONS } from './dataLite';
import { LOGIC_LESSONS } from './logicLite';
import { PCTMULTI_LESSONS } from './percentMulti';
import { GRID_LESSONS } from './gridShapes';

/** Every Contest Path lesson, shown on the Learn screen under each game's group. */
export const CONTEST_LESSONS: LessonDef[] = [...PATTERN_LESSONS, ...BLOCKS_LESSONS, ...PATHS_LESSONS, ...DATA_LESSONS, ...LOGIC_LESSONS, ...PCTMULTI_LESSONS, ...GRID_LESSONS];
