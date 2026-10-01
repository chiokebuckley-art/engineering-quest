import type { World } from '../types';

/**
 * The full curriculum spine. Only World 1 is playable in Version 1; the rest are
 * defined now so the map, skill tree and readiness checks can show the road ahead
 * and so future modules plug in without restructuring.
 */
export const WORLDS: World[] = [
  {
    id: 'w1', order: 1, name: 'Arithmetic', subtitle: 'The Foundations', era: 'wood', status: 'playable',
    description: 'Number sense, place value, the four operations, multiplication and division facts, negatives and order of operations. Everything else is built on this.',
    skills: ['num.sense', 'add.basic', 'sub.basic', 'bonds.10', 'bonds.100', 'mult', 'div', 'neg.numbers', 'order.ops'],
  },
  {
    id: 'w2', order: 2, name: 'Engineering Numbers', subtitle: 'Fractions, Ratios & Units', era: 'stone', status: 'preview',
    description: 'Fractions, decimals, percentages, ratios, rates, exponents, roots, scientific notation, significant figures and — most importantly — unit conversion and dimensional analysis.',
    skills: ['frac', 'decimals', 'percent', 'ratio', 'exponents', 'sci.notation', 'units'],
  },
  {
    id: 'w3', order: 3, name: 'Pre-Algebra', subtitle: 'The Language of Relationships', era: 'stone', status: 'preview',
    description: 'Variables, expressions, properties, one- and multi-step equations, inequalities, the coordinate plane and patterns.',
    skills: ['prealg.expressions', 'prealg.equations', 'prealg.coordinates'],
  },
  {
    id: 'w4', order: 4, name: 'Algebra I', subtitle: 'Lines, Systems & Functions', era: 'metal', status: 'preview',
    description: 'Linear equations and inequalities, slope, systems, functions, polynomials, factoring, quadratics and radicals.',
    skills: ['alg1.linear', 'alg1.systems', 'alg1.functions', 'alg1.quadratics'],
  },
  {
    id: 'w5', order: 5, name: 'Geometry', subtitle: 'Construction & Space', era: 'metal', status: 'preview',
    description: 'Angles, triangles, polygons, circles, area, surface area, volume, similarity, the Pythagorean theorem and coordinate geometry.',
    skills: ['geo.shapes', 'geo.area', 'geo.volume', 'geo.pythagoras'],
  },
  {
    id: 'w6', order: 6, name: 'Algebra II', subtitle: 'Advanced Functions', era: 'machines', status: 'preview',
    description: 'Polynomial, rational, exponential and logarithmic functions, complex numbers, sequences, series and an introduction to matrices.',
    skills: ['alg2.functions', 'alg2.exp.log', 'alg2.complex', 'alg2.matrices'],
  },
  {
    id: 'w7', order: 7, name: 'Trigonometry', subtitle: 'Angles, Waves & Vectors', era: 'machines', status: 'preview',
    description: 'Degrees and radians, sine, cosine, tangent, the unit circle, identities, solving triangles and vector components.',
    skills: ['trig.ratios', 'trig.unit.circle', 'trig.vectors'],
  },
  {
    id: 'w8', order: 8, name: 'Precalculus', subtitle: 'The Gate to Calculus', era: 'electric', status: 'preview',
    description: 'Function transformations, models, parametric equations, sequences and series and a first look at limits.',
    skills: ['precalc.functions', 'precalc.parametric', 'precalc.limits'],
  },
  {
    id: 'w9', order: 9, name: 'Calculus I', subtitle: 'Rates of Change', era: 'electric', status: 'preview',
    description: 'Limits, continuity, derivatives and their rules, related rates, optimisation and basic integration — seen visually.',
    skills: ['calc1.limits', 'calc1.derivatives', 'calc1.applications', 'calc1.integration'],
  },
  {
    id: 'w10', order: 10, name: 'Calculus II', subtitle: 'Accumulation', era: 'automation', status: 'preview',
    description: 'Integration techniques, definite integrals, volumes, work, infinite series, Taylor series, parametric and polar coordinates.',
    skills: ['calc2.integration', 'calc2.series', 'calc2.polar'],
  },
  {
    id: 'w11', order: 11, name: 'Calculus III', subtitle: 'Three Dimensions', era: 'automation', status: 'distant',
    description: 'Vectors in space, partial derivatives, multiple integrals, gradients, vector fields, line and surface integrals.',
    skills: ['calc3.vectors', 'calc3.partials', 'calc3.multiple', 'calc3.fields'],
  },
  {
    id: 'w12', order: 12, name: 'Linear Algebra', subtitle: 'The Grid', era: 'laboratory', status: 'distant',
    description: 'Matrices, determinants, vector spaces, linear transformations, eigenvalues and eigenvectors — tied to circuits, control and robotics.',
    skills: ['linalg.matrices', 'linalg.transforms', 'linalg.eigen'],
  },
  {
    id: 'w13', order: 13, name: 'Differential Equations', subtitle: 'The Reactor', era: 'laboratory', status: 'distant',
    description: 'First- and second-order ODEs, initial value problems, growth and decay, oscillation and coupled systems modelling tanks, circuits and reactions.',
    skills: ['ode.first', 'ode.second', 'ode.systems'],
  },
  {
    id: 'w14', order: 14, name: 'Probability & Statistics', subtitle: 'The Research Station', era: 'laboratory', status: 'distant',
    description: 'Probability, random variables, distributions, confidence intervals, hypothesis testing, regression and engineering reliability.',
    skills: ['stats.probability', 'stats.distributions', 'stats.inference'],
  },
  {
    id: 'w15', order: 15, name: 'Numerical Methods', subtitle: 'Computation', era: 'future', status: 'distant',
    description: 'Root finding, numerical integration and differentiation, solving systems numerically, approximating ODEs and error analysis.',
    skills: ['num.roots', 'num.integration', 'num.ode'],
  },
  {
    id: 'w16', order: 16, name: 'Advanced Engineering Mathematics', subtitle: 'Distant Regions', era: 'future', status: 'distant',
    description: 'Vector calculus, partial differential equations, Fourier analysis, Laplace transforms, optimisation, tensors and mathematical physics.',
    skills: ['adv.vector.calc', 'adv.pde', 'adv.fourier', 'adv.laplace', 'adv.tensors'],
  },
];

export const worldById = (id: string) => WORLDS.find((w) => w.id === id);
