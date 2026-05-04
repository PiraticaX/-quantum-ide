import { useQuantumStore } from '@/store/quantumStore'
import { api } from '@/utils/api'
import { localSimulate } from '@/utils/localSimulator'
import { useState, useCallback } from 'react'

export function TopBar() {
  const {
    numQubits, gates, isSimulating, setIsSimulating, setSimResult,
    simResult, addLog, clearCircuit, setShowAlgoModal, simError
  } = useQuantumStore()
  const [backendOnline, setBackendOnline] = useState<boolean | null>(null)

  const gateCount = gates.length

  const runSimulation = useCallback(async () => {
    if (isSimulating) return
    if (gates.length === 0) {
      addLog('Add gates to the circuit before simulating', 'warn')
      return
    }

    setIsSimulating(true)
    addLog(`Simulating ${numQubits}-qubit circuit (${gateCount} gates, 1024 shots)…`, 'info')

    const payload = {
      num_qubits: numQubits,
      gates: gates.map(({ id, ...g }) => g),
      shots: 1024
    }

    try {
      const result = await api.simulate(payload)
      setSimResult(result)
      const top = Object.entries(result.counts).sort((a, b) => b[1] - a[1])[0]
      addLog(
        `Simulation complete · Most probable: |${top[0]}⟩ (${(top[1] / 1024 * 100).toFixed(1)}%) · Entropy: ${result.entropy} bits`,
        'success'
      )
      setBackendOnline(true)
    } catch {
      addLog('Backend unavailable · Running local NumPy simulator…', 'warn')
      try {
        const result = localSimulate(numQubits, gates)
        setSimResult(result)
        const top = Object.entries(result.counts).sort((a, b) => b[1] - a[1])[0]
        addLog(`Local simulation complete · |${top[0]}⟩ most probable (${(top[1] / 1024 * 100).toFixed(1)}%)`, 'success')
        setBackendOnline(false)
      } catch (err2: any) {
        addLog(`Simulation error: ${err2.message}`, 'error')
      }
    } finally {
      setIsSimulating(false)
    }
  }, [gates, numQubits, isSimulating])

  return (
    <div style={{
      height: 44, background: '#161C26', borderBottom: '1px solid #1E2A3A',
      display: 'flex', alignItems: 'center', padding: '0 16px', gap: 14,
      flexShrink: 0, zIndex: 100
    }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{
          width: 22, height: 22, borderRadius: 6, background: 'rgba(79,140,255,0.15)',
          border: '1px solid rgba(79,140,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <circle cx="6" cy="6" r="4" stroke="#4F8CFF" strokeWidth="1.5"/>
            <circle cx="6" cy="6" r="1.5" fill="#7CFFB2"/>
            <line x1="2" y1="6" x2="4.5" y2="6" stroke="#4F8CFF" strokeWidth="1"/>
            <line x1="7.5" y1="6" x2="10" y2="6" stroke="#4F8CFF" strokeWidth="1"/>
          </svg>
        </div>
        <span style={{ fontSize: 13, fontWeight: 700, color: '#E6EDF3', letterSpacing: 0.3 }}>
          Quantum<span style={{ color: '#4F8CFF' }}>IDE</span>
        </span>
      </div>

      <div style={{ width: 1, height: 20, background: '#1E2A3A' }} />

      {/* Backend status */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
        <div style={{
          width: 6, height: 6, borderRadius: '50%',
          background: backendOnline === null ? '#6B7280' : backendOnline ? '#7CFFB2' : '#FFB84F',
          boxShadow: backendOnline ? '0 0 6px rgba(124,255,178,0.5)' : 'none',
          animation: backendOnline ? 'pulseGreen 2s infinite' : 'none'
        }} />
        <span style={{ fontSize: 11, color: '#6B7280' }}>
          {backendOnline === null ? 'Checking...' : backendOnline ? 'Qiskit Aer' : 'Local sim'}
        </span>
      </div>

      <div style={{ flex: 1 }} />

      {/* Circuit stats */}
      <span style={{ fontSize: 11, color: '#6B7280' }}>
        {numQubits}q · {gateCount} gates
        {simResult ? ` · entropy ${simResult.entropy}b` : ''}
      </span>

      {/* Algorithm Library */}
      <button
        onClick={() => setShowAlgoModal(true)}
        style={{
          padding: '5px 12px', borderRadius: 6, fontSize: 12, fontWeight: 500,
          cursor: 'pointer', border: '1px solid #1E2A3A', background: '#1A2234',
          color: '#9AA4B2', transition: 'all 0.15s'
        }}
        onMouseEnter={e => { e.currentTarget.style.color = '#E6EDF3'; e.currentTarget.style.borderColor = '#243048' }}
        onMouseLeave={e => { e.currentTarget.style.color = '#9AA4B2'; e.currentTarget.style.borderColor = '#1E2A3A' }}
      >
        ⚛ Algorithms
      </button>

      {/* Clear */}
      <button
        onClick={() => { clearCircuit(); addLog('Circuit cleared', 'info') }}
        style={{
          padding: '5px 12px', borderRadius: 6, fontSize: 12, fontWeight: 500,
          cursor: 'pointer', border: '1px solid #1E2A3A', background: 'transparent',
          color: '#9AA4B2', transition: 'all 0.15s'
        }}
        onMouseEnter={e => { e.currentTarget.style.color = '#E6EDF3' }}
        onMouseLeave={e => { e.currentTarget.style.color = '#9AA4B2' }}
      >
        Clear
      </button>

      {/* Run */}
      <button
        onClick={runSimulation}
        disabled={isSimulating}
        style={{
          padding: '6px 16px', borderRadius: 6, fontSize: 12, fontWeight: 600,
          cursor: isSimulating ? 'default' : 'pointer',
          border: '1px solid',
          borderColor: isSimulating ? 'rgba(124,255,178,0.2)' : 'rgba(124,255,178,0.4)',
          background: isSimulating ? 'rgba(124,255,178,0.05)' : 'rgba(124,255,178,0.12)',
          color: isSimulating ? 'rgba(124,255,178,0.5)' : '#7CFFB2',
          transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: 6
        }}
        onMouseEnter={e => { if (!isSimulating) e.currentTarget.style.background = 'rgba(124,255,178,0.2)' }}
        onMouseLeave={e => { e.currentTarget.style.background = isSimulating ? 'rgba(124,255,178,0.05)' : 'rgba(124,255,178,0.12)' }}
      >
        {isSimulating ? (
          <>
            <div style={{ width: 10, height: 10, border: '1.5px solid rgba(124,255,178,0.5)', borderTopColor: '#7CFFB2', borderRadius: '50%', animation: 'spin-slow 0.8s linear infinite' }} />
            Simulating…
          </>
        ) : '▶ Run Simulation'}
      </button>
    </div>
  )
}
