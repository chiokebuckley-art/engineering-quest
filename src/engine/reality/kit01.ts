/**
 * Electronics Kit 01: the lab built from the supplied photo of an ELEGOO UNO R3 starter kit lid.
 * Hotspots are the 35 printed tiles, measured on the cropped lid image (normalised 0–1). The printed chart
 * is an index: a label proves what the box says, not that every part is inside, so every card is
 * "label-confirmed" until someone checks the real part.
 */
import type { LabDef, KitComponent } from './types';
import { KIT01_COMPONENTS } from './kit01Components';

export const KIT01: LabDef = {
  id: 'electronics-kit-01',
  title: 'Electronics Lab',
  domain: 'electronics',
  version: 1,
  image: '/assets/reality/kit01-lid.jpg',
  imageW: 1122, imageH: 730,
  imageAlt: 'The lid of an ELEGOO UNO R3 starter kit: a printed chart of 35 components in 5 rows of 7, from the UNO board to NPN transistors.',
  source: 'Photo supplied by the learner (IMG_7894), cropped to the printed lid chart.',
  components: KIT01_COMPONENTS,
  hotspots: {
    A1: [0.0365, 0.1137, 0.1515, 0.2575],
    A2: [0.1702, 0.111, 0.287, 0.2562],
    A3: [0.3057, 0.1068, 0.4242, 0.2548],
    A4: [0.443, 0.1041, 0.5624, 0.2521],
    A5: [0.5829, 0.1014, 0.7032, 0.2493],
    A6: [0.7228, 0.0986, 0.8449, 0.2466],
    A7: [0.8645, 0.0973, 0.9866, 0.2438],
    B1: [0.0321, 0.274, 0.148, 0.4205],
    B2: [0.1667, 0.2726, 0.2861, 0.4205],
    B3: [0.3048, 0.2699, 0.4242, 0.4205],
    B4: [0.4412, 0.2685, 0.5624, 0.4192],
    B5: [0.5829, 0.2658, 0.705, 0.4164],
    B6: [0.7246, 0.263, 0.8485, 0.4151],
    B7: [0.869, 0.2603, 0.9938, 0.411],
    C1: [0.0276, 0.437, 0.1453, 0.5863],
    C2: [0.164, 0.437, 0.2834, 0.5863],
    C3: [0.3021, 0.437, 0.4225, 0.5863],
    C4: [0.4403, 0.4342, 0.5633, 0.5849],
    C5: [0.5811, 0.4329, 0.7068, 0.5836],
    C6: [0.7264, 0.4315, 0.852, 0.5836],
    C7: [0.8725, 0.4274, 0.9982, 0.5822],
    D1: [0.0232, 0.6041, 0.1426, 0.7562],
    D2: [0.1604, 0.6027, 0.2825, 0.7562],
    D3: [0.3021, 0.6027, 0.4234, 0.7562],
    D4: [0.4421, 0.6014, 0.5633, 0.7562],
    D5: [0.5838, 0.6, 0.7086, 0.7575],
    D6: [0.7291, 0.6, 0.8574, 0.7575],
    D7: [0.8788, 0.6, 1.0, 0.7575],
    E1: [0.0178, 0.7726, 0.1381, 0.9288],
    E2: [0.156, 0.7726, 0.2772, 0.9301],
    E3: [0.2977, 0.7726, 0.4207, 0.9315],
    E4: [0.4403, 0.7726, 0.5642, 0.9329],
    E5: [0.5847, 0.774, 0.7103, 0.9356],
    E6: [0.7308, 0.7753, 0.8627, 0.9384],
    E7: [0.8832, 0.7767, 1.0, 0.9384],
  },
};

export const componentById = (id: string): KitComponent | undefined => KIT01.components.find((c) => c.id === id);
export const componentByTile = (tile: string): KitComponent | undefined => KIT01.components.find((c) => c.tile === tile);
