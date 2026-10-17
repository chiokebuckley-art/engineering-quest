export const VERSION = '1.0.0';
export const dimensions = ['Frame the problem','Handle evidence','Predict and test','Update explanation','Justify conclusion','Recognize limits'];
const neutral = ['neutral','neutral','neutral'];
function ev(id,title,text,type,source,time,relations,rationale){ return {id,title,text,type,source,time,relations,rationale,reliability:'Exact authored result in this fictional one-fault model.'}; }
export function mission(id='lighthouse',variant='investigator') {
 const green=id==='greenhouse', starter=variant==='starter';
 const names=green?['Water tank','Feed pipe','Sprinkler']:['Battery','Cable','Lamp'];
 const fault=green?0:1;
 const evidence=green?[
 ev('E01','Dry seedlings','The sprinkler is not watering. The valve is open.','Observation','Garden inspection','Now',neutral,'Any of the three faults could stop the water.'),
 ev('E02','Gardener’s note','“The tank was full yesterday.”','Report','Maintenance notebook','Yesterday',neutral,'A historical report does not establish the current water level.'),
 ev('E03','Pipe exterior','The pipe looks intact.','Observation','Visual inspection','Now',neutral,'An intact exterior cannot prove the inside is clear.'),
 ev('E04','Tank level','The tank is empty. In this model, a working source contains water.','Measurement','Level gauge','Now',['supports','conflicts','conflicts'],'With exactly one fault, the empty tank identifies the failed source.'),
 ev('E05','Sprinkler test','The sprinkler sprays when attached directly to a known-good water supply. The original pipe is bypassed.','Observation','Isolated sprinkler test','Now',['neutral','neutral','conflicts'],'A working sprinkler conflicts with a failed sprinkler.'),
 ev('E06','Pipe flow test','Water flows freely through the original pipe when tested with a separate supply.','Observation','Isolated flow test','Now',['neutral','conflicts','neutral'],'The original pipe is clear, so a blocked pipe is not supported.'),
 ev('E07','Water restored','Refilling only the tank restores the watering system.','Observation','Single-component intervention','Now',['supports','conflicts','conflicts'],'Changing only the source restores flow. The cause of the empty tank is still unknown.')
 ]:[
 ev('E01','A dark lighthouse','The lighthouse is off. Its switch is closed (on).','Observation','Scene inspection','Now',neutral,'The dark light is compatible with all three possible faults.'),
 ev('E02','Keeper’s note','“Battery charged yesterday.”','Report','Maintenance notebook','Yesterday',neutral,'Yesterday’s report does not measure the battery now.'),
 ev('E03','Cable inspection',starter?'The cable is visibly disconnected.':'The cable covering looks intact.','Observation','Visual inspection','Now',starter?['conflicts','supports','conflicts']:neutral,starter?'The visible break stops the connection in this one-fault model.':'The outside can look intact while the inside cannot carry current.'),
 ev('E04','Battery measurement','Battery reads 12 V. This simulation defines 11–13 V as healthy.','Measurement','Simulated meter','Now',['conflicts','neutral','neutral'],'The reading conflicts with a depleted battery under the authored rule. Voltage alone is not a universal real-world battery-health test.'),
 ev('E05','Lamp test','The lamp lights on a known-good supply. This test bypasses the original cable.','Observation','Isolated lamp test','Now',['neutral','neutral','conflicts'],'The lamp works independently of the original battery and cable.'),
 ev('E06','Cable continuity','The original cable has no continuity: an open circuit.','Observation','Simulated continuity test','Now',['conflicts','supports','conflicts'],'An open connection prevents the circuit from carrying current. Exactly one component is faulty.'),
 ev('E07','Light restored','Replacing only the cable restores the light.','Observation','Single-component intervention','Now',['conflicts','supports','conflicts'],'Keeping the battery and lamp unchanged isolates the cable as the failed component. It does not explain why the cable failed.')
 ];
 const tests=green?[
 {id:'source',name:'Check tank level',component:0,evidence:'E04',outcomes:['Tank empty','Tank contains water'],actual:0,why:'A level reading tests the water source directly.'},
 {id:'output',name:'Test sprinkler separately',component:2,evidence:'E05',outcomes:['No spray','Sprinkler sprays'],actual:1,why:'A separate supply isolates the sprinkler from the tank and pipe.'},
 {id:'connection',name:'Test pipe flow',component:1,evidence:'E06',outcomes:['Water cannot pass','Water flows freely'],actual:1,why:'A separate supply tests whether the pipe carries water.'}
 ]:[
 {id:'source',name:'Measure battery',component:0,evidence:'E04',outcomes:['Outside healthy range','Within 11–13 V'],actual:1,why:'The authored healthy range lets this test check the battery.'},
 {id:'output',name:'Test lamp separately',component:2,evidence:'E05',outcomes:['Lamp stays off','Lamp lights'],actual:1,why:'A known-good supply bypasses the original cable to test the lamp.'},
 {id:'connection',name:'Test cable continuity',component:1,evidence:'E06',outcomes:['No continuity','Continuity present'],actual:0,why:'Continuity tells us whether the cable makes a complete connection.'}
 ];
 return {id,version:VERSION,variant,title:green?'The thirsty greenhouse':'The lighthouse investigation',eyebrow:green?'CASE 02 · TRANSFER EXPEDITION':'CASE 01 · LANTERN ISLAND',brief:green?'The festival seedlings need water, but the sprinkler has stopped. Find the failed part, restore the water, and explain your evidence.':'The evening festival is almost here, but the lighthouse is dark. Explore the island workshop, test your ideas, and bring the light back.',names,fault,evidence,tests,
 hypotheses:green?['The tank is empty.','The pipe is blocked.','The sprinkler has failed.']:['The battery is depleted.','The cable connection has failed.','The lamp has failed.'],
 assumptions:green?'Exactly one of the tank, pipe, or sprinkler is faulty. The valve is open and fixed. Tests are reliable.':'Exactly one of the battery, cable, or lamp is faulty. The switch is closed and fixed. Tests are reliable.',
 rule:green?'Water flows only if the tank contains water, the pipe is clear, and the sprinkler works.':'The light turns on only if the battery is charged, the cable is connected, the switch is closed, and the lamp works.',
 repairs:green?['Refill tank','Replace pipe','Replace sprinkler']:['Replace battery','Replace cable','Replace lamp'],
 causal:green?'Without water in the tank, a clear pipe and working sprinkler cannot produce water.':'An open cable breaks the circuit, so a good battery and lamp cannot produce light.',
 unknown:green?'Why the tank became empty.':'Why the cable failed.',
 revision:green?'A reliable repeat test shows water still does not flow after refilling only the tank.':'A reliable repeat test shows the light still fails after replacing only the cable.',
 objectives:['Guess which part failed.','Restore the system only.','Identify and justify the failed part, then restore the system.'],
 objective_ids:['frame','evidence','predict','revise','justify','limits'],completion_rules:'Repair succeeds and debrief is finished.',mastery_rules:'All six dimensions independently score 2; first exposure only. Pilot threshold.',prerequisites:[],transfer_variant_id:green?null:'greenhouse',locale:'en',
 };
}
export const glossary=[['Observation','Something you directly notice.'],['Measurement','An observation made with a measuring tool.'],['Report','Information from another source; check when and how it was obtained.'],['Hypothesis','A possible explanation you can test.'],['Prediction','What you expect if an explanation is true. A sound prediction can differ from the actual result.'],['Assumption','A starting condition accepted for this investigation.'],['Conclusion','A judgment supported by evidence and reasoning.'],['Unknown','Something the current evidence has not established.']];
