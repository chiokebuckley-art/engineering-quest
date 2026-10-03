#!/bin/bash
set -e
mkdir -p assets/audio

generate() {
  local id="$1"
  local text="$2"
  echo "Generating audio for $id..."
  say -v Daniel -r 175 "$text" -o "assets/audio/${id}.aiff"
  afconvert "assets/audio/${id}.aiff" "assets/audio/${id}.m4a" -f mp4f -d aac
  rm "assets/audio/${id}.aiff"
}

generate "motion_harbor_video" "Welcome to Motion Harbor. Here, we investigate how forces change motion and how energy is conserved. When a supply rover rests at the top of a ramp, it holds gravitational potential energy proportional to its height: P E equals m g h. As it rolls down the ramp, this stored energy transforms directly into kinetic energy: one-half m v squared. Higher ramps produce greater exit speeds. Once on the flat harbor dock, rolling resistance exerts a continuous backward force, slowing the rover to a halt as kinetic energy transfers into thermal energy. By changing only ramp height while keeping surface friction and cart mass constant, you conduct a fair test to land the rover squarely in the delivery bay."

generate "matter_workshop_video" "Welcome to Matter Workshop, where we follow the matter and unlock chemical reactions. Everything in our universe is composed of atoms. Inside the workshop, we examine electron shells: the first shell holds up to two electrons, while the second and third shells hold up to eight. Chemical bonds form as atoms share or transfer valence electrons to achieve stable, full outer shells. During any chemical reaction in a sealed vessel, mass is strictly conserved: not a single atom is created or destroyed. By measuring stoichiometric molar ratios, activation energy, and reaction kinetics, we can predict reaction rates, utilize catalysts to lower energy barriers, and neutralize strong acids with matching alkaline bases."

generate "living_valley_video" "Welcome to Living Valley, home of the island research biodome. Living systems depend on the continuous flow of energy and the cycling of matter. Inside plant chloroplasts, photosynthesis captures solar photon energy to split water and fix carbon dioxide into glucose and oxygen: six C O two plus six H two O produces C six H twelve O six plus six O two. Cellular respiration then reverses this reaction in living cells to release metabolic energy. Across the valley's food web, carbon cycles continuously between atmospheric gases, producers, herbivores, carnivores, and decomposers, while energy diminishes at each trophic transfer. Here, we measure environmental limiting factors to keep the living biodome in balance."

generate "earthwatch_ridge_video" "Welcome to Earthwatch Ridge, our high-altitude observatory for planetary and environmental systems. Here we monitor Earth's dynamic energy balance. Incoming solar radiation is partly reflected by surface albedo and clouds, while the absorbed remainder is radiated back as thermal infrared energy. When greenhouse gases intercept this outgoing flux, the surface equilibrium temperature shifts. Down on the mountain slopes, hydrological research terraces demonstrate how dense vegetative ground cover slows rainwater runoff, allowing groundwater aquifers to recharge and preventing erosion. By analyzing over a century of NASA GISTEMP global temperature observations, we separate short-term decadal variability from long-term planetary warming trends."

generate "signal_coast_video" "Welcome to Signal Coast, where waves carry information across the archipelago and stored energy powers the night laboratory. All periodic waves obey the universal wave equation: wave speed equals frequency multiplied by wavelength. When wave speed is fixed by the medium, doubling the frequency compresses the cycles, cutting the wavelength exactly in half. Along the coast, automated transmitter beacons broadcast radio signals across the water, while our solar and battery power grid balances nighttime electrical loads. By tracking watt-hours of stored energy against hourly wattage demand, we ensure critical research equipment never loses power before dawn."

generate "orbital_station_video" "Welcome to Orbital Station, suspended high above Discovery Islands. Here we observe celestial bodies governed by gravitational mechanics. Johannes Kepler discovered that planets orbit stars along elliptical paths with the central star at one focus. In a circular orbit, gravitational attraction provides the exact centripetal force required to maintain the path. Kepler's third law proves that the square of an orbital period is directly proportional to the cube of its semi-major axis: T squared equals a cubed for a solar-mass star. Planets further from the star must travel longer paths at slower orbital velocities. Using transparent orbital models, we plan spacecraft trajectories and calculate planetary periods across the cosmos."

echo "All audio generated successfully!"
ls -lh assets/audio
