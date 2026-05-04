import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { subscribeWithSelector } from 'zustand/middleware'

export type GateType =
  | 'H' | 'X' | 'Y' | 'Z' | 'S' | 'T'
  | 'CNOT' | 'CX' | 'SWAP'
  | 'RX(π/2)' | 'RY(π/4)' | 'RY(π/8)' | 'RZ(π/4)' | 'RZ(π/8)'
  | 'M'

export interface Gate {
  id: string
  type: GateType
  qubit: number
  slot: number
  control_qubit?: number | null
  angle?: number | null
}

export interface SimulationResult {
  counts: Record<string, number>
  statevector: [number, number][]
  probabilities: Record<string, number>
  bloch_vectors: { x: number; y: number; z: number }[]
  entropy: number
  num_qubits: number
  shots: number
}

export interface LogEntry {
  id: string
  timestamp: string
  message: string
  type: 'info' | 'success' | 'warn' | 'error'
}

export interface Algorithm {
  id: string
  name: string
  description: string
  qubits: number
  category: string
  gates: Omit<Gate, 'id'>[]
}

interface QuantumStore {
  // Circuit state
  numQubits: number
  gates: Gate[]
  selectedGate: string | null
  draggingGate: GateType | null

  // Code state
  code: string
  codeEdited: boolean

  // Simulation state
  simResult: SimulationResult | null
  isSimulating: boolean
  simError: string | null

  // UI state
  logs: LogEntry[]
  algorithms: Algorithm[]
  activePanel: 'circuit' | 'code'
  showAlgoModal: boolean

  // Actions
  setNumQubits: (n: number) => void
  addQubit: () => void
  removeQubit: () => void
  placeGate: (gate: Omit<Gate, 'id'>) => void
  removeGate: (id: string) => void
  clearCircuit: () => void
  setSelectedGate: (id: string | null) => void
  setDraggingGate: (gate: GateType | null) => void

  setCode: (code: string) => void
  setCodeEdited: (v: boolean) => void

  setSimResult: (result: SimulationResult | null) => void
  setIsSimulating: (v: boolean) => void
  setSimError: (e: string | null) => void

  addLog: (message: string, type: LogEntry['type']) => void
  clearLogs: () => void

  setAlgorithms: (algos: Algorithm[]) => void
  loadAlgorithm: (algo: Algorithm) => void
  setShowAlgoModal: (v: boolean) => void
  setActivePanel: (panel: 'circuit' | 'code') => void
}

let gateIdCounter = 0
const newId = () => `gate_${++gateIdCounter}_${Date.now()}`
const timestamp = () => new Date().toLocaleTimeString('en', { hour12: false })

export const useQuantumStore = create<QuantumStore>()(
  subscribeWithSelector(
    immer((set, get) => ({
      numQubits: 3,
      gates: [],
      selectedGate: null,
      draggingGate: null,
      code: '',
      codeEdited: false,
      simResult: null,
      isSimulating: false,
      simError: null,
      logs: [],
      algorithms: [],
      activePanel: 'circuit',
      showAlgoModal: false,

      setNumQubits: (n) => set(s => { s.numQubits = Math.max(1, Math.min(8, n)) }),
      addQubit: () => set(s => { if (s.numQubits < 8) s.numQubits++ }),
      removeQubit: () => set(s => {
        if (s.numQubits > 1) {
          s.numQubits--
          s.gates = s.gates.filter(g => g.qubit < s.numQubits)
        }
      }),

      placeGate: (gate) => set(s => {
        // Remove any existing gate at same position
        s.gates = s.gates.filter(g => !(g.qubit === gate.qubit && g.slot === gate.slot))
        s.gates.push({ ...gate, id: newId() })
      }),

      removeGate: (id) => set(s => {
        s.gates = s.gates.filter(g => g.id !== id)
      }),

      clearCircuit: () => set(s => {
        s.gates = []
        s.simResult = null
        s.simError = null
        s.numQubits = 3
      }),

      setSelectedGate: (id) => set(s => { s.selectedGate = id }),
      setDraggingGate: (gate) => set(s => { s.draggingGate = gate }),
      setCode: (code) => set(s => { s.code = code }),
      setCodeEdited: (v) => set(s => { s.codeEdited = v }),
      setSimResult: (result) => set(s => { s.simResult = result }),
      setIsSimulating: (v) => set(s => { s.isSimulating = v }),
      setSimError: (e) => set(s => { s.simError = e }),

      addLog: (message, type) => set(s => {
        s.logs.push({ id: newId(), timestamp: timestamp(), message, type })
        if (s.logs.length > 200) s.logs.shift()
      }),
      clearLogs: () => set(s => { s.logs = [] }),

      setAlgorithms: (algos) => set(s => { s.algorithms = algos }),
      loadAlgorithm: (algo) => set(s => {
        s.numQubits = algo.qubits
        s.gates = algo.gates.map(g => ({ ...g, id: newId() }))
        s.simResult = null
        s.simError = null
        s.showAlgoModal = false
      }),
      setShowAlgoModal: (v) => set(s => { s.showAlgoModal = v }),
      setActivePanel: (panel) => set(s => { s.activePanel = panel }),
    }))
  )
)
