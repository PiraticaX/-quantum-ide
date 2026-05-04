import axios from 'axios'
import { Gate, SimulationResult, Algorithm } from '@/store/quantumStore'

const API = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
})

export interface CircuitPayload {
  num_qubits: number
  gates: Omit<Gate, 'id'>[]
  shots?: number
}

export const api = {
  simulate: async (payload: CircuitPayload): Promise<SimulationResult> => {
    const { data } = await API.post<SimulationResult>('/simulate', payload)
    return data
  },

  circuitToCode: async (payload: CircuitPayload): Promise<string> => {
    const { data } = await API.post<{ code: string }>('/circuit-to-code', payload)
    return data.code
  },

  codeToCircuit: async (code: string): Promise<{
    num_qubits: number
    gates: Omit<Gate, 'id'>[]
  }> => {
    const { data } = await API.post('/code-to-circuit', { code })
    return data
  },

  getAlgorithms: async (): Promise<Algorithm[]> => {
    const { data } = await API.get<{ algorithms: Algorithm[] }>('/algorithms')
    return data.algorithms
  },

  health: async (): Promise<boolean> => {
    try {
      await axios.get(
        (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000').replace('/api/v1', '') + '/health'
      )
      return true
    } catch {
      return false
    }
  }
}
