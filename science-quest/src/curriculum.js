/** Course routes are explicit about scope. A route label never certifies a complete grade. */
export const pathways=[
 {grade:'K',title:'Observe & explore',focus:'Contact pushes, direction and living things’ needs',missions:['first-move','which-way','habitat-supply'],next:['Observable material properties','Local weather observations']},
 {grade:'1',title:'Light, sound & sky',focus:'Light paths, vibrations and daily shadow patterns',missions:['light-window','vibration-detective','shadow-patterns'],next:['Organism parts and their functions','Longer sky-pattern observations']},
 {grade:'2',title:'Materials & habitats',focus:'Material behavior, shelter choices and water on land',missions:['float-materials','material-scout','rain-garden'],next:['Reversible material changes','Landform comparisons']},
 {grade:'3',title:'Forces & fair tests',focus:'Controlled comparisons and balanced or unbalanced forces',missions:['keep-it-fair','tug-together','stronger-side','measure-the-rain'],next:['Magnetic interactions','Life cycles and inherited traits','Weather-hazard evidence']},
 {grade:'4',title:'Energy in motion',focus:'Ramps, stopping lanes and gentle delivery',missions:['stopping-zone','rover-rescue','gentle-delivery'],next:['Organism structures','Erosion and changing landscapes']},
 {grade:'5',title:'Matter & systems',focus:'Conservation, constrained design and a working supply route',missions:['nothing-lost','choose-a-brake','cargo-budget','new-trolley','restore-route','separate-the-mixture'],next:['Food matter pathways','Earth systems and space scales']},
 {grade:'6',title:'Measure & investigate',focus:'Thermal energy, cell exchange and controlled plant growth',missions:['warming-water','membrane-exchange','biodome-balance','melting-without-warming'],next:['Water-cycle processes','Ecosystem interactions']},
 {grade:'7',title:'Inheritance & interactions',focus:'Genotype probabilities, variation and resource limits',missions:['pea-trait-patterns','growth-detective','same-garden-different-types','different-responses-to-light','habitat-supply','moving-plates'],next:['Chemical changes and conservation of atoms','Body systems','Reproduction','Earth processes']},
 {grade:'8',title:'Signals & motion',focus:'Closed circuits, wave patterns and orbital models',missions:['closed-circuit','signal-sprint','tune-the-link','orbital-patterns','read-a-rock-clock'],next:['Force/mass investigation planning','Natural selection','Stratigraphy and fossil evidence']},
 {grade:'9',title:'Biology pathway',focus:'Introductory cell, inheritance and environment models',missions:['membrane-exchange','where-food-matter-comes-from','cells-release-energy','read-the-gene','pea-trait-patterns','population-limits','selection-over-generations'],next:['Cell division and regulation','Body-system interactions','Evolutionary evidence and speciation','Ecosystem networks']},
 {grade:'10',title:'Chemistry pathway',focus:'Introductory conservation and energy-transfer models',missions:['nothing-lost','melting-without-warming','carbon-isotopes','reaction-ratios','bonds-and-energy','shelter-designer'],next:['Molar stoichiometry and yield','Electron configurations and chemical bonding','Reaction rates and equilibrium','Acid-base chemistry']},
 {grade:'11',title:'Physics pathway',focus:'Introductory circuits, kinetic energy and storage budgets',missions:['closed-circuit','gentle-delivery','night-lab'],next:['Quantitative Newtonian motion','Momentum and collisions','Fields','Thermal and wave systems']},
 {grade:'12',title:'Integrated research',focus:'Model limits, orbital design and remote-station energy',missions:['ridge-research','outer-outpost','mission-planner','night-reserve','power-is-not-energy','uncertain-night','a-planets-energy-balance','compare-star-radiation'],next:['Observed climate-system evidence','Stellar evolution','Uncertainty analysis','Multi-discipline optimization capstone']}
];
export const preparation={
 'same-garden-different-types':['biodome-balance'],'different-responses-to-light':['same-garden-different-types'],
 'read-a-rock-clock':['carbon-isotopes'],'a-planets-energy-balance':['night-reserve'],
 'cells-release-energy':['where-food-matter-comes-from'],'read-the-gene':['pea-trait-patterns'],'selection-over-generations':['population-limits','pea-trait-patterns'],
 'reaction-ratios':['nothing-lost','carbon-isotopes'],'bonds-and-energy':['reaction-ratios'],'melting-without-warming':['warming-water'],
 'rover-rescue':['keep-it-fair'], 'choose-a-brake':['stopping-zone'], 'cargo-budget':['rover-rescue'],
 'new-trolley':['rover-rescue'], 'restore-route':['rover-rescue','stopping-zone','gentle-delivery'],
 'shelter-designer':['material-scout','warming-water'], 'growth-detective':['biodome-balance'],
 'catch-the-water':['rain-garden'], 'ridge-research':['catch-the-water'],
 'tune-the-link':['signal-sprint'], 'night-lab':['closed-circuit'],
 'night-reserve':['night-lab'],'power-is-not-energy':['night-reserve'],'uncertain-night':['power-is-not-energy'],
 'outer-outpost':['orbital-patterns'], 'mission-planner':['night-lab']
};
export function pathwayProgress(pathway,profile){const records=pathway.missions.map(id=>profile.runs[id]);return{completed:records.filter(r=>r?.completed).length,total:records.length};}
