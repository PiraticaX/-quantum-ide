import { Gate } from '@/store/quantumStore'

export function generateQiskitCode(numQubits: number, gates: Gate[]): string {
  const lines: string[] = [
    'from qiskit import QuantumCircuit, QuantumRegister, ClassicalRegister',
    'from qiskit_aer import AerSimulator',
    'import numpy as np',
    '',
    `# ${numQubits}-qubit quantum circuit`,
    `qr = QuantumRegister(${numQubits}, 'q')`,
    `cr = ClassicalRegister(${numQubits}, 'c')`,
    `qc = QuantumCircuit(qr, cr)`,
    '',
  ]

  const sorted = [...gates].sort((a, b) => a.slot - b.slot || a.qubit - b.qubit)
  let lastSlot = -1

  for (const gate of sorted) {
    if (gate.slot !== lastSlot) {
      if (lastSlot >= 0) lines.push('')
      lastSlot = gate.slot
    }
    const qi = gate.qubit
    const ctrl = gate.control_qubit ?? Math.max(0, qi - 1)

    switch (gate.type) {
      case 'H': lines.push(`qc.h(${qi})`); break
      case 'X': lines.push(`qc.x(${qi})`); break
      case 'Y': lines.push(`qc.y(${qi})`); break
      case 'Z': lines.push(`qc.z(${qi})`); break
      case 'S': lines.push(`qc.s(${qi})`); break
      case 'T': lines.push(`qc.t(${qi})`); break
      case 'CNOT':
      case 'CX': lines.push(`qc.cx(${ctrl}, ${qi})`); break
      case 'SWAP': lines.push(`qc.swap(${ctrl}, ${qi})`); break
      case 'RX(π/2)': lines.push(`qc.rx(np.pi / 2, ${qi})`); break
      case 'RY(π/4)': lines.push(`qc.ry(np.pi / 4, ${qi})`); break
      case 'RY(π/8)': lines.push(`qc.ry(np.pi / 8, ${qi})`); break
      case 'RZ(π/4)': lines.push(`qc.rz(np.pi / 4, ${qi})`); break
      case 'RZ(π/8)': lines.push(`qc.rz(np.pi / 8, ${qi})`); break
      case 'M': lines.push(`qc.measure(${qi}, ${qi})`); break
    }
  }

  const hasMeasure = gates.some(g => g.type === 'M')
  if (!hasMeasure) {
    lines.push('', '# Measure all qubits', 'qc.measure_all()')
  }

  lines.push(
    '',
    '# Run on Aer simulator',
    'simulator = AerSimulator()',
    'job = simulator.run(qc, shots=1024)',
    'result = job.result()',
    'counts = result.get_counts(qc)',
    '',
    'print("Measurement results:")',
    'for state, count in sorted(counts.items(), key=lambda x: -x[1]):',
    '    print(f"  |{state}⟩: {count} shots ({count/1024*100:.1f}%)")',
  )

  return lines.join('\n')
}

export function parseQiskitCode(code: string): { numQubits: number; gates: Omit<Gate, 'id'>[] } {
  const gates: Omit<Gate, 'id'>[] = []
  const slotMap: Record<number, number> = {}
  let numQubits = 3

  const qrMatch = code.match(/QuantumRegister\((\d+)/)
  if (qrMatch) numQubits = parseInt(qrMatch[1])

  const patterns: [RegExp, string, number][] = [
    [/qc\.h\((\d+)\)/, 'H', 1],
    [/qc\.x\((\d+)\)/, 'X', 1],
    [/qc\.y\((\d+)\)/, 'Y', 1],
    [/qc\.z\((\d+)\)/, 'Z', 1],
    [/qc\.s\((\d+)\)/, 'S', 1],
    [/qc\.t\((\d+)\)/, 'T', 1],
    [/qc\.cx\((\d+),\s*(\d+)\)/, 'CNOT', 2],
    [/qc\.swap\((\d+),\s*(\d+)\)/, 'SWAP', 2],
    [/qc\.rx\([^,]+,\s*(\d+)\)/, 'RX(π/2)', 1],
    [/qc\.ry\(np\.pi\s*\/\s*4[^,]*,\s*(\d+)\)/, 'RY(π/4)', 1],
    [/qc\.ry\(np\.pi\s*\/\s*8[^,]*,\s*(\d+)\)/, 'RY(π/8)', 1],
    [/qc\.rz\(np\.pi\s*\/\s*4[^,]*,\s*(\d+)\)/, 'RZ(π/4)', 1],
    [/qc\.rz\(np\.pi\s*\/\s*8[^,]*,\s*(\d+)\)/, 'RZ(π/8)', 1],
    [/qc\.measure\((\d+),\s*\d+\)/, 'M', 1],
  ]

  for (const line of code.split('\n')) {
    const t = line.trim()
    if (!t || t.startsWith('#')) continue

    for (const [pattern, gateType, arity] of patterns) {
      const m = t.match(pattern)
      if (m) {
        if (arity === 1) {
          const qi = parseInt(m[1])
          const slot = slotMap[qi] ?? 0
          slotMap[qi] = slot + 1
          gates.push({ type: gateType as Gate['type'], qubit: qi, slot, control_qubit: null })
        } else {
          const ctrl = parseInt(m[1]), tgt = parseInt(m[2])
          const slot = Math.max(slotMap[ctrl] ?? 0, slotMap[tgt] ?? 0)
          slotMap[ctrl] = slot + 1
          slotMap[tgt] = slot + 1
          gates.push({ type: gateType as Gate['type'], qubit: tgt, slot, control_qubit: ctrl })
        }
        break
      }
    }
  }

  return { numQubits, gates }
}

export const GATE_META: Record<string, {
  color: string; border: string; label: string; desc: string; category: string
}> = {
  H:        { color: '#7AB8FF', border: 'rgba(122,184,255,0.35)', label: 'H',   desc: 'Hadamard – superposition',     category: 'Single' },
  X:        { color: '#FF8888', border: 'rgba(255,136,136,0.35)', label: 'X',   desc: 'Pauli-X – quantum NOT',         category: 'Single' },
  Y:        { color: '#FFD080', border: 'rgba(255,208,128,0.35)', label: 'Y',   desc: 'Pauli-Y gate',                  category: 'Single' },
  Z:        { color: '#7CFFB2', border: 'rgba(124,255,178,0.35)', label: 'Z',   desc: 'Pauli-Z – phase flip',          category: 'Single' },
  S:        { color: '#BB99FF', border: 'rgba(187,153,255,0.35)', label: 'S',   desc: 'S gate – π/2 phase',            category: 'Single' },
  T:        { color: '#FF9988', border: 'rgba(255,153,136,0.35)', label: 'T',   desc: 'T gate – π/4 phase',            category: 'Single' },
  CNOT:     { color: '#CC88FF', border: 'rgba(204,136,255,0.35)', label: 'CX',  desc: 'CNOT – controlled NOT',         category: 'Multi'  },
  SWAP:     { color: '#FF88CC', border: 'rgba(255,136,204,0.35)', label: 'SW',  desc: 'SWAP – exchange qubits',        category: 'Multi'  },
  'RX(π/2)':{ color: '#88CCFF', border: 'rgba(136,204,255,0.35)', label: 'Rx',  desc: 'Rotation X by π/2',             category: 'Rotate' },
  'RY(π/4)':{ color: '#88CCFF', border: 'rgba(136,204,255,0.35)', label: 'Ry',  desc: 'Rotation Y by π/4',             category: 'Rotate' },
  'RY(π/8)':{ color: '#88CCFF', border: 'rgba(136,204,255,0.35)', label: 'Ry⁸', desc: 'Rotation Y by π/8',             category: 'Rotate' },
  'RZ(π/4)':{ color: '#88CCFF', border: 'rgba(136,204,255,0.35)', label: 'Rz',  desc: 'Rotation Z by π/4',             category: 'Rotate' },
  'RZ(π/8)':{ color: '#88CCFF', border: 'rgba(136,204,255,0.35)', label: 'Rz⁸', desc: 'Rotation Z by π/8',             category: 'Rotate' },
  M:        { color: '#AAAAAA', border: 'rgba(170,170,170,0.25)', label: 'M',   desc: 'Measurement',                   category: 'Measure'},
}
