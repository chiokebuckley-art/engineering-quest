export const documentaries=[
{
 id:'motion',
 title:'Newton’s Laws & Gravitational Energy Conservation',
 subtitle:'How forces change motion and potential energy converts to kinetic work',
 region:'motion',
 regionName:'Motion Harbor',
 icon:'⚙',
 badge:'Physics · Mechanics',
 color:'#eeb947',
 poster:'./assets/motion_harbor_rover.jpg',
 audio:'./assets/audio/motion_harbor_video.m4a',
 duration:38,
 missionId:'rover-rescue',
 mathFormula:'PE = m·g·h → KE = ½m·v² | Stopping distance d = h / μ',
 summary:'Observe how gravitational potential energy transforms into kinetic energy on an inclined plane, and how rolling resistance does work against motion to bring the rover to rest.',
 keyConcepts:[
  'Gravitational Potential Energy (PE = mgh) is stored by lifting an object above a reference surface.',
  'Kinetic Energy (KE = ½mv²) increases as potential energy transforms during ramp descent.',
  'Exit velocity v = √(2gh) depends on release height, independent of cart mass in a lossless ramp model.',
  'Rolling Resistance (Fr = μmg) does negative work, transferring kinetic energy into thermal energy and sound.',
  'Fair Testing: change only height while keeping cart mass and lane friction constant.'
 ],
 realWorldContext:'NASA Jet Propulsion Laboratory engineers calibrate rover braking distances on simulated Martian soil ramps at the Mars Yard in Pasadena before landing missions on Mars.',
 chapters:[
  {time:0,title:'Field Setup at Motion Harbor',desc:'Gravitational potential energy on the launch ramp.'},
  {time:10,title:'Descent & Kinetic Transformation',desc:'PE transforms into kinetic energy; exit velocity increases with height.'},
  {time:21,title:'Braking Lane & Rolling Resistance',desc:'Friction does work against motion, transferring energy into heat.'},
  {time:30,title:'Fair Test & Target Delivery',desc:'Modulating height to land precisely in the delivery bay.'}
 ],
 captions:[
  {start:0,end:5.5,text:'Welcome to Motion Harbor. Here, we investigate how forces change motion and how energy is conserved.'},
  {start:5.5,end:12.0,text:'When a supply rover rests at the top of a ramp, it holds gravitational potential energy proportional to its height: PE equals m g h.'},
  {start:12.0,end:18.0,text:'As it rolls down the ramp, this stored energy transforms directly into kinetic energy: one-half m v squared.'},
  {start:18.0,end:22.5,text:'Higher ramps produce greater exit speeds.'},
  {start:22.5,end:29.5,text:'Once on the flat harbor dock, rolling resistance exerts a continuous backward force, slowing the rover to a halt as kinetic energy transfers into thermal energy.'},
  {start:29.5,end:38.0,text:'By changing only ramp height while keeping surface friction and cart mass constant, you conduct a fair test to land the rover squarely in the delivery bay.'}
 ]
},
{
 id:'matter',
 title:'Atomic Valence Shells & Conservation of Mass',
 subtitle:'Electron configurations, molecular bonding, and mass conservation in sealed reactions',
 region:'matter',
 regionName:'Matter Workshop',
 icon:'⚗',
 badge:'Chemistry · Reactions',
 color:'#b794e7',
 poster:'./assets/matter_workshop_chemistry.jpg',
 audio:'./assets/audio/matter_workshop_video.m4a',
 duration:38,
 missionId:'nothing-lost',
 mathFormula:'∑ m(reactants) = ∑ m(products) | Bohr Shells: 2, 8, 8',
 summary:'Explore atomic electron orbital shells, how valence configurations govern molecular bonding, and why mass is strictly conserved in sealed reaction vessels.',
 keyConcepts:[
  'Bohr Electron Shells: 2 electrons in the inner n=1 shell, up to 8 in the second and third shells.',
  'Valence electrons determine chemical reactivity and covalent/ionic bonding affinity.',
  'Law of Conservation of Mass: total atoms and total grams remain constant during physical and chemical changes.',
  'Reaction kinetics, catalysts, and stoichiometric limiting reactants determine product recovery.'
 ],
 realWorldContext:'Industrial pharmaceutical and materials synthesis relies on closed-vessel mass balances and noble metal catalysts to maximize product yield while producing zero toxic waste.',
 chapters:[
  {time:0,title:'The Atomic Architecture',desc:'Protons, neutrons, and electron shells inside Matter Workshop.'},
  {time:9,title:'Valence Shells & Bonding',desc:'The octet rule: atoms share or transfer electrons to reach stable noble gas configurations.'},
  {time:20,title:'Conservation of Mass',desc:'No atoms are created or destroyed in a sealed system.'},
  {time:29,title:'Kinetics, Catalysts & Neutralization',desc:'Catalysts lower activation energy barriers to accelerate chemical reactions.'}
 ],
 captions:[
  {start:0,end:5.5,text:'Welcome to Matter Workshop, where we follow the matter and unlock chemical reactions.'},
  {start:5.5,end:10.5,text:'Everything in our universe is composed of atoms. Inside the workshop, we examine electron shells.'},
  {start:10.5,end:17.5,text:'The first shell holds up to two electrons, while the second and third shells hold up to eight.'},
  {start:17.5,end:23.5,text:'Chemical bonds form as atoms share or transfer valence electrons to achieve stable, full outer shells.'},
  {start:23.5,end:30.5,text:'During any chemical reaction in a sealed vessel, mass is strictly conserved: not a single atom is created or destroyed.'},
  {start:30.5,end:38.0,text:'By measuring stoichiometric molar ratios, activation energy, and reaction kinetics, we can predict reaction rates, utilize catalysts to lower energy barriers, and neutralize strong acids with matching alkaline bases.'}
 ]
},
{
 id:'living',
 title:'Photosynthesis, Respiration & Trophic Carbon Flows',
 subtitle:'Chloroplast light reactions, mitochondrial respiration, and ecosystem carbon pools',
 region:'living',
 regionName:'Living Valley',
 icon:'♧',
 badge:'Biology · Ecosystems',
 color:'#85cda2',
 poster:'./assets/living_valley_biodome.jpg',
 audio:'./assets/audio/living_valley_video.m4a',
 duration:40,
 missionId:'biodome-balance',
 mathFormula:'6 CO₂ + 6 H₂O + hν → C₆H₁₂O₆ + 6 O₂ | 10% Trophic Transfer',
 summary:'Inside the geodesic biodome, trace how photons drive chloroplast photosynthesis to produce glucose and oxygen, and how carbon cycles through atmospheric, organismal, and soil pools.',
 keyConcepts:[
  'Photosynthesis: Chloroplast thylakoids convert solar photon energy and CO₂ into carbohydrates and O₂.',
  'Cellular Respiration: Mitochondria oxidize glucose to liberate metabolic ATP energy.',
  'Carbon Cycle: 6 conserved pools (atmosphere, leaf biomass, herbivore, carnivore, soil, decomposer).',
  '10% Ecological Rule: Energy diminishes across trophic levels, while matter cycles continuously.'
 ],
 realWorldContext:'Biosphere 2 and closed-loop ecological life-support systems (CELSS) on the International Space Station balance plant biomass and human carbon dioxide output to sustain human spaceflight.',
 chapters:[
  {time:0,title:'The Living Valley Biodome',desc:'Continuous flows of energy and cycling of matter.'},
  {time:9,title:'Chloroplast Light Reactions',desc:'Solar photons split water and fix carbon dioxide into glucose and oxygen.'},
  {time:21,title:'Cellular Respiration',desc:'Mitochondria reverse the reaction to release biochemical energy.'},
  {time:30,title:'The Food Web & Carbon Balance',desc:'Tracking carbon pools from producers to herbivores and decomposers.'}
 ],
 captions:[
  {start:0,end:5.5,text:'Welcome to Living Valley, home of the island research biodome.'},
  {start:5.5,end:11.5,text:'Living systems depend on the continuous flow of energy and the cycling of matter.'},
  {start:11.5,end:20.0,text:'Inside plant chloroplasts, photosynthesis captures solar photon energy to split water and fix carbon dioxide into glucose and oxygen: six C O two plus six H two O produces C six H twelve O six plus six O two.'},
  {start:20.0,end:27.0,text:'Cellular respiration then reverses this reaction in living cells to release metabolic energy.'},
  {start:27.0,end:35.0,text:'Across the valley’s food web, carbon cycles continuously between atmospheric gases, producers, herbivores, carnivores, and decomposers, while energy diminishes at each trophic transfer.'},
  {start:35.0,end:40.0,text:'Here, we measure environmental limiting factors to keep the living biodome in balance.'}
 ]
},
{
 id:'earth',
 title:'Planetary Radiation Balance, Hydrology & Climate Records',
 subtitle:'Stefan-Boltzmann equilibrium, rain-garden runoff mitigation, and NASA GISTEMP data',
 region:'earth',
 regionName:'Earthwatch Ridge',
 icon:'△',
 badge:'Earth & Space · Climatology',
 color:'#df9c75',
 poster:'./assets/earthwatch_ridge_climate.jpg',
 audio:'./assets/audio/earthwatch_ridge_video.m4a',
 duration:40,
 missionId:'rain-garden',
 mathFormula:'Fin = ¼ S₀ (1 - α) = σ Teff⁴ | NASA GISTEMP v4 (1880–2025)',
 summary:'From mountain observatory terraces to NASA global climate datasets: understand radiation equilibrium, how rain gardens mitigate runoff, and how scientists analyze observational temperature records.',
 keyConcepts:[
  'Planetary Radiation Balance: Incoming solar flux minus albedo reflection must balance thermal infrared emission.',
  'Greenhouse Effect: Atmospheric absorption traps outgoing longwave radiation, elevating surface equilibrium temperature.',
  'Watershed Hydrology: Permeable vegetated soil absorbs rainfall, recharging aquifers and dramatically reducing surface runoff.',
  'Empirical Climate Science: Analyzing real NASA GISTEMP v4 observational data from 1880 to 2025 with moving decadal averages.'
 ],
 realWorldContext:'Urban civil engineers construct bio-retention rain gardens to prevent storm sewer flooding, while NOAA and NASA Goddard Institute for Space Studies track global temperature anomalies to guide climate policy.',
 chapters:[
  {time:0,title:'Earthwatch Ridge Observatory',desc:'Monitoring Earth’s dynamic environmental and climate systems.'},
  {time:9,title:'Planetary Radiation Balance',desc:'Solar irradiance, surface albedo reflection, and greenhouse thermal equilibrium.'},
  {time:20,title:'Hydrology & Rain Gardens',desc:'Vegetative terraces intercept rainfall to prevent catastrophic runoff and erosion.'},
  {time:30,title:'Observed Climate Records',desc:'Interpreting over a century of NASA GISTEMP observational global temperature records.'}
 ],
 captions:[
  {start:0,end:5.5,text:'Welcome to Earthwatch Ridge, our high-altitude observatory for planetary and environmental systems.'},
  {start:5.5,end:11.5,text:'Here we monitor Earth’s dynamic energy balance.'},
  {start:11.5,end:19.5,text:'Incoming solar radiation is partly reflected by surface albedo and clouds, while the absorbed remainder is radiated back as thermal infrared energy.'},
  {start:19.5,end:25.5,text:'When greenhouse gases intercept this outgoing flux, the surface equilibrium temperature shifts.'},
  {start:25.5,end:33.5,text:'Down on the mountain slopes, hydrological research terraces demonstrate how dense vegetative ground cover slows rainwater runoff, allowing groundwater aquifers to recharge and preventing erosion.'},
  {start:33.5,end:40.0,text:'By analyzing over a century of NASA GISTEMP global temperature observations, we separate short-term decadal variability from long-term planetary warming trends.'}
 ]
},
{
 id:'signal',
 title:'Wave Physics, Frequency–Wavelength Invariance & Energy Grids',
 subtitle:'The universal wave equation v = f · λ, beacon propagation, and night energy storage',
 region:'signal',
 regionName:'Signal Coast',
 icon:'ϟ',
 badge:'Physics · Waves & Energy',
 color:'#72ceda',
 poster:'./assets/signal_coast_waves.jpg',
 audio:'./assets/audio/signal_coast_video.m4a',
 duration:35,
 missionId:'signal-sprint',
 mathFormula:'v = f · λ | E(Wh) = P(watts) · t(hours) | P = I²·R',
 summary:'Explore how electromagnetic wave signals transmit information across the ocean, why higher frequencies produce shorter wavelengths at constant speed, and how battery storage banks balance night power grids.',
 keyConcepts:[
  'Wave Equation: v = f · λ (propagation velocity equals frequency multiplied by wavelength).',
  'Inverse Relationship: When wave speed is held constant by the medium, doubling frequency halves wavelength.',
  'Electrical Power vs. Energy: Power (Watts = Joules/second) times time (hours) equals stored energy (Watt-hours).',
  'Grid Balancing: Night laboratory battery reserves must exceed load wattage times dark hours divided by efficiency.'
 ],
 realWorldContext:'Modern 5G telecommunications, Wi-Fi 6 networks, and island renewable micro-grids (Tesla Megapack installations) apply wave tuning and interval energy scheduling every day.',
 chapters:[
  {time:0,title:'The Coastal Signal Station',desc:'Broadcasting information across the archipelago.'},
  {time:8,title:'The Universal Wave Law',desc:'Wave speed equals frequency times wavelength.'},
  {time:17,title:'Tuning Frequencies & Wavelengths',desc:'Doubling frequency halves peak spacing when speed is fixed.'},
  {time:25,title:'Night Lab Energy Storage',desc:'Watt-hours, battery round-trip efficiency, and demand load margins.'}
 ],
 captions:[
  {start:0,end:6.0,text:'Welcome to Signal Coast, where waves carry information across the archipelago and stored energy powers the night laboratory.'},
  {start:6.0,end:13.0,text:'All periodic waves obey the universal wave equation: wave speed equals frequency multiplied by wavelength.'},
  {start:13.0,end:20.0,text:'When wave speed is fixed by the medium, doubling the frequency compresses the cycles, cutting the wavelength exactly in half.'},
  {start:20.0,end:27.5,text:'Along the coast, automated transmitter beacons broadcast radio signals across the water, while our solar and battery power grid balances nighttime electrical loads.'},
  {start:27.5,end:35.0,text:'By tracking watt-hours of stored energy against hourly wattage demand, we ensure critical research equipment never loses power before dawn.'}
 ]
},
{
 id:'orbit',
 title:'Kepler’s Laws of Planetary Motion & Gravitational Orbits',
 subtitle:'Celestial mechanics, orbital velocity vectors, and the harmonic law T² ∝ a³',
 region:'orbit',
 regionName:'Orbital Station',
 icon:'✦',
 badge:'Astrophysics · Celestial Mechanics',
 color:'#93a9ed',
 poster:'./assets/orbital_station_astronomy.jpg',
 audio:'./assets/audio/orbital_station_video.m4a',
 duration:38,
 missionId:'orbital-patterns',
 mathFormula:'T² = a³ (for 1 M☉) | v_orbit = √(G·M / r)',
 summary:'High above Discovery Islands, observe celestial mechanics in action. Discover Kepler’s Third Law: why distant planets take dramatically longer to orbit their star, and how gravitational physics shapes orbital velocity.',
 keyConcepts:[
  'Kepler’s First Law: Planets orbit in ellipses with the central star at one focus.',
  'Kepler’s Second Law: An orbital radius vector sweeps out equal areas in equal times (speed increases at perihelion).',
  'Kepler’s Third Law: The square of the orbital period T² is proportional to the cube of the orbital distance a³.',
  'Orbital Mechanics: Gravitational attraction balances centripetal acceleration: v = √(GM/r).'
 ],
 realWorldContext:'Mission planners at NASA and ESA use Keplerian orbital transfer equations (Hohmann transfers) to navigate spacecraft like the James Webb Space Telescope and Mars Perseverance.',
 chapters:[
  {time:0,title:'The High Observatory Dome',desc:'Gazing into deep space from Orbital Station.'},
  {time:9,title:'Kepler’s Orbital Geometry',desc:'Elliptical orbits and gravitational balance.'},
  {time:19,title:'The Harmonic Law (T² = a³)',desc:'Orbital period increases exponentially as orbital radius expands.'},
  {time:29,title:'Spacecraft Navigation',desc:'Calculating orbital velocity and interplanetary transfer trajectories.'}
 ],
 captions:[
  {start:0,end:6.0,text:'Welcome to Orbital Station, suspended high above Discovery Islands. Here we observe celestial bodies governed by gravitational mechanics.'},
  {start:6.0,end:12.0,text:'Johannes Kepler discovered that planets orbit stars along elliptical paths with the central star at one focus.'},
  {start:12.0,end:19.5,text:'In a circular orbit, gravitational attraction provides the exact centripetal force required to maintain the path.'},
  {start:19.5,end:27.0,text:'Kepler’s third law proves that the square of an orbital period is directly proportional to the cube of its semi-major axis: T squared equals a cubed for a solar-mass star.'},
  {start:27.0,end:32.5,text:'Planets further from the star must travel longer paths at slower orbital velocities.'},
  {start:32.5,end:38.0,text:'Using transparent orbital models, we plan spacecraft trajectories and calculate planetary periods across the cosmos.'}
 ]
}
];

export function cinemaById(id){
 return cinemaById[id]||documentaries[0];
}
documentaries.forEach(d=>{cinemaById[d.id]=d;});

export function activeCaption(doc,time){
 if(!doc?.captions)return null;
 return doc.captions.find(c=>time>=c.start&&time<=c.end)||null;
}

export function activeChapter(doc,time){
 if(!doc?.chapters)return null;
 let found=doc.chapters[0];
 for(const c of doc.chapters){
  if(time>=c.time)found=c;
  else break;
 }
 return found;
}
