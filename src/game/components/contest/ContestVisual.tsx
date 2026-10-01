import type { ContestVisual } from '../../../engine/contest/visuals';
import { PatternTrain, GrowingFigure, MachineTable } from './PatternViz';
import { IsoStack, PaintCube } from './BlocksViz';
import { MenuGroups, GridPaths, LineUp } from './PathsViz';
import { Pictograph, PieChart, VennDiagram } from './DataViz';
import { LogicGrid, Speakers, Scene } from './LogicViz';
import { PercentSteps } from './PercentViz';
import { GridShape, Tangram } from './GridViz';
import { Objects } from './ObjectsViz';

/** Draws any Contest Path picture. `small` is for the pictures inside tap-to-answer buttons. */
export function ContestVisualView({ visual, small }: { visual: ContestVisual; small?: boolean }) {
  switch (visual.type) {
    case 'pattern': return <PatternTrain v={visual} small={small} />;
    case 'growing': return <GrowingFigure v={visual} small={small} />;
    case 'machine': return <MachineTable v={visual} small={small} />;
    case 'iso': return <IsoStack v={visual} small={small} />;
    case 'paintcube': return <PaintCube v={visual} small={small} />;
    case 'menu': return <MenuGroups v={visual} small={small} />;
    case 'gridpath': return <GridPaths v={visual} small={small} />;
    case 'lineup': return <LineUp v={visual} small={small} />;
    case 'picto': return <Pictograph v={visual} small={small} />;
    case 'pie': return <PieChart v={visual} small={small} />;
    case 'venn': return <VennDiagram v={visual} small={small} />;
    case 'logicgrid': return <LogicGrid v={visual} small={small} />;
    case 'speakers': return <Speakers v={visual} small={small} />;
    case 'scene': return <Scene v={visual} small={small} />;
    case 'pctsteps': return <PercentSteps v={visual} small={small} />;
    case 'gridshape': return <GridShape v={visual} small={small} />;
    case 'tangram': return <Tangram v={visual} small={small} />;
    case 'objects': return <Objects v={visual} small={small} />;
  }
}
