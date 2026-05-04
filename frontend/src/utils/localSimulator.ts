import { Gate, SimulationResult } from '@/store/quantumStore'

type Complex = { r: number; i: number }
const add = (a: Complex, b: Complex): Complex => ({ r: a.r + b.r, i: a.i + b.i })
const mul = (a: Complex, b: Complex): Complex => ({ r: a.r * b.r - a.i * b.i, i: a.r * b.i + a.i * b.r })
const scale = (a: Complex, s: number): Complex => ({ r: a.r * s, i: a.i * s })
const abs2 = (a: Complex) => a.r * a.r + a.i * a.i

function initSV(dim: number): Complex[] {
  const sv = Array.from({ length: dim }, () => ({ r: 0, i: 0 }))
  sv[0] = { r: 1, i: 0 }
  return sv
}

function applyH(sv: Complex[], qi: number, n: number): Complex[] {
  const f = 1 / Math.sqrt(2)
  const res = sv.map(c => ({ ...c }))
  const dim = sv.length
  for (let b = 0; b < dim; b++) {
    if ((b >> qi) & 1) continue
    const p = b ^ (1 << qi)
    const a = sv[b], c = sv[p]
    res[b] = scale(add(a, c), f)
    res[p] = scale({ r: a.r - c.r, i: a.i - c.i }, f)
  }
  return res
}

function applyX(sv: Complex[], qi: number): Complex[] {
  const res = sv.map(c => ({ ...c }))
  const dim = sv.length
  for (let b = 0; b < dim; b++) {
    if ((b >> qi) & 1) continue
    const p = b ^ (1 << qi)
    res[b] = sv[p]
    res[p] = sv[b]
  }
  return res
}

function applyZ(sv: Complex[], qi: number): Complex[] {
  return sv.map((a, b) => (b >> qi) & 1 ? { r: -a.r, i: -a.i } : { ...a })
}

function applyS(sv: Complex[], qi: number): Complex[] {
  return sv.map((a, b) => (b >> qi) & 1 ? mul(a, { r: 0, i: 1 }) : { ...a })
}

function applyT(sv: Complex[], qi: number): Complex[] {
  const t = { r: Math.SQRT1_2, i: Math.SQRT1_2 }
  return sv.map((a, b) => (b >> qi) & 1 ? mul(a, t) : { ...a })
}

function applyCNOT(sv: Complex[], ctrl: number, tgt: number): Complex[] {
  const res = sv.map(c => ({ ...c }))
  const dim = sv.length
  for (let b = 0; b < dim; b++) {
    if (!((b >> ctrl) & 1)) continue
    if ((b >> tgt) & 1) continue
    const p = b ^ (1 << tgt)
    res[b] = sv[p]
    res[p] = sv[b]
  }
  return res
}

function applyRX(sv: Complex[], qi: number, theta: number): Complex[] {
  const c = Math.cos(theta / 2), s = Math.sin(theta / 2)
  const res = sv.map(c2 => ({ ...c2 }))
  const dim = sv.length
  for (let b = 0; b < dim; b++) {
    if ((b >> qi) & 1) continue
    const p = b ^ (1 << qi)
    const a = sv[b], d = sv[p]
    res[b] = { r: c * a.r + s * d.i, i: c * a.i - s * d.r }
    res[p] = { r: c * d.r + s * a.i, i: c * d.i - s * a.r }
  }
  return res
}

function applyRY(sv: Complex[], qi: number, theta: number): Complex[] {
  const c = Math.cos(theta / 2), s = Math.sin(theta / 2)
  const res = sv.map(c2 => ({ ...c2 }))
  const dim = sv.length
  for (let b = 0; b < dim; b++) {
    if ((b >> qi) & 1) continue
    const p = b ^ (1 << qi)
    const a = sv[b], d = sv[p]
    res[b] = { r: c * a.r - s * d.r, i: c * a.i - s * d.i }
    res[p] = { r: s * a.r + c * d.r, i: s * a.i + c * d.i }
  }
  return res
}

function applyRZ(sv: Complex[], qi: number, theta: number): Complex[] {
  const phase0 = { r: Math.cos(theta / 2), i: -Math.sin(theta / 2) }
  const phase1 = { r: Math.cos(theta / 2), i: Math.sin(theta / 2) }
  return sv.map((a, b) => (b >> qi) & 1 ? mul(a, phase1) : mul(a, phase0))
}

function getBlochVector(sv: Complex[], qi: number, n: number) {
  let rx = 0, ry = 0, rz = 0
  const dim = 1 << n
  for (let b = 0; b < dim; b++) {
    if ((b >> qi) & 1) continue
    const p = b ^ (1 << qi)
    const a0 = sv[b], a1 = sv[p]
    const p0 = abs2(a0), p1 = abs2(a1)
    rz += p0 - p1
    rx += 2 * (a0.r * a1.r + a0.i * a1.i)
    ry += 2 * (a0.i * a1.r - a0.r * a1.i)
  }
  return {
    x: Math.max(-1, Math.min(1, rx)),
    y: Math.max(-1, Math.min(1, ry)),
    z: Math.max(-1, Math.min(1, rz))
  }
}

export function localSimulate(numQubits: number, gates: Gate[]): SimulationResult {
  const dim = 1 << numQubits
  let sv = initSV(dim)
  const sorted = [...gates].sort((a, b) => a.slot - b.slot || a.qubit - b.qubit)

  for (const gate of sorted) {
    if (gate.type === 'M') continue
    const qi = gate.qubit
    const ctrl = gate.control_qubit ?? Math.max(0, qi - 1)

    switch (gate.type) {
      case 'H': sv = applyH(sv, qi, numQubits); break
      case 'X': sv = applyX(sv, qi); break
      case 'Y': sv = applyX(applyZ(sv, qi), qi); break
      case 'Z': sv = applyZ(sv, qi); break
      case 'S': sv = applyS(sv, qi); break
      case 'T': sv = applyT(sv, qi); break
      case 'CNOT': case 'CX': sv = applyCNOT(sv, ctrl, qi); break
      case 'RX(π/2)': sv = applyRX(sv, qi, Math.PI / 2); break
      case 'RY(π/4)': sv = applyRY(sv, qi, Math.PI / 4); break
      case 'RY(π/8)': sv = applyRY(sv, qi, Math.PI / 8); break
      case 'RZ(π/4)': sv = applyRZ(sv, qi, Math.PI / 4); break
      case 'RZ(π/8)': sv = applyRZ(sv, qi, Math.PI / 8); break
    }
  }

  const probs = sv.map(abs2)
  const total = probs.reduce((s, p) => s + p, 0)
  const normProbs = probs.map(p => p / total)

  // Shot-based sampling
  const shots = 1024
  const counts: Record<string, number> = {}
  for (let i = 0; i < shots; i++) {
    let r = Math.random(), cum = 0, chosen = 0
    for (let j = 0; j < dim; j++) {
      cum += normProbs[j]
      if (r <= cum) { chosen = j; break }
    }
    const key = chosen.toString(2).padStart(numQubits, '0')
    counts[key] = (counts[key] || 0) + 1
  }

  const probabilities: Record<string, number> = {}
  for (const [k, v] of Object.entries(counts)) probabilities[k] = v / shots

  let entropy = 0
  for (const p of Object.values(probabilities)) {
    if (p > 1e-10) entropy -= p * Math.log2(p)
  }

  const statevector = sv.map(a => [a.r, a.i] as [number, number])
  const bloch_vectors = Array.from({ length: numQubits }, (_, qi) => getBlochVector(sv, qi, numQubits))

  return {
    counts,
    statevector,
    probabilities,
    bloch_vectors,
    entropy: Math.round(entropy * 1000) / 1000,
    num_qubits: numQubits,
    shots
  }
}
