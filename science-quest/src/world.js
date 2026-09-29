/** Earned world changes are durable rewards, separate from mastery/retention state. */
export const worldUpgrades=[
 ['harbor-crane','motion','first-move','Cargo crane','⚙',18,62],['harbor-route','motion','rover-rescue','Rover route','↗',34,63],['harbor-hub','motion','restore-route','Supply network','✦',43,52],
 ['materials-bench','matter','nothing-lost','Recovery bench','⚗',17,42],['shelter-wall','matter','material-scout','Insulated workshop','▥',27,40],['research-shelter','matter','shelter-designer','Research shelter','⌂',31,34],
 ['habitat-garden','living','habitat-supply','Habitat garden','♧',69,78],['biodome-plants','living','biodome-balance','Growing biodome','❀',77,65],['trait-nursery','living','pea-trait-patterns','Pea nursery','♣',84,77],
 ['ridge-garden','earth','rain-garden','Rain garden','♧',10,26],['ridge-catchment','earth','catch-the-water','Water collector','◒',16,28],['ridge-station','earth','ridge-research','Weather station','⚑',23,22],
 ['coast-lantern','signal','light-window','Signal lantern','☀',73,31],['coast-link','signal','tune-the-link','Island link','ϟ',83,43],['coast-power','signal','night-lab','Powered night lab','✦',87,35],
 ['station-sundial','orbit','shadow-patterns','Sundial','◷',43,21],['station-telescope','orbit','orbital-patterns','Telescope','⌕',52,23],['station-research','orbit','mission-planner','Remote outpost','✧',58,17]
].map(([id,region,mission,name,icon,x,y])=>({id,region,mission,name,icon,x,y}));
export const decorations=[
 {id:'compass',mission:'first-move',name:'Explorer’s compass',icon:'✦'},
 {id:'mini-rover',mission:'rover-rescue',name:'Model rover',icon:'⚙'},
 {id:'seedling',mission:'biodome-balance',name:'Biodome seedling',icon:'♧'},
 {id:'crystal',mission:'nothing-lost',name:'Matter collection',icon:'◇'},
 {id:'lantern',mission:'light-window',name:'Little lantern',icon:'☀'},
 {id:'telescope',mission:'orbital-patterns',name:'Mini telescope',icon:'⌕'}
];
export const workshopSlots=['Window shelf','Work bench','Display stand'];
export function reconcileWorld(profile,now=Date.now()){
 profile.world??={upgrades:[],decorations:[],placements:{}};
 profile.world.upgrades??=[];profile.world.decorations??=[];profile.world.placements??={};
 const gained=[];
 for(const item of worldUpgrades)if(profile.runs[item.mission]?.completed&&!profile.world.upgrades.some(x=>x.id===item.id)){profile.world.upgrades.push({id:item.id,earnedAt:now});gained.push(item.name);}
 for(const item of decorations)if(profile.runs[item.mission]?.completed&&!profile.world.decorations.includes(item.id))profile.world.decorations.push(item.id);
 return gained;
}
export function placeDecoration(profile,id,slot){reconcileWorld(profile);if(!profile.world.decorations.includes(id))throw Error('Earn this decoration through its mission first.');if(!workshopSlots.includes(slot))throw Error('Choose a workshop placement.');for(const key of Object.keys(profile.world.placements))if(profile.world.placements[key]===id)delete profile.world.placements[key];profile.world.placements[slot]=id;}
