/** Exploration can never modify mission evidence, trials, or completion. */
export function recordExploration(profile,key,state,now=Date.now()){
  profile.explorations??={};
  profile.explorations[key]={completed:true,completedAt:now,trials:structuredClone(state.trials||[])};
  return profile.explorations[key];
}
