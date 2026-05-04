import type { NextPage } from 'next'
import Head from 'next/head'
import { useEffect } from 'react'
import { TopBar } from '@/components/TopBar'
import { CircuitBuilder } from '@/components/CircuitBuilder'
import { CodeEditor } from '@/components/CodeEditor'
import { VisualizationPanel } from '@/components/VisualizationPanel'
import { OutputPanel } from '@/components/OutputPanel'
import { AlgoModal } from '@/components/AlgoModal'
import { useQuantumStore } from '@/store/quantumStore'
import { api } from '@/utils/api'
import { generateQiskitCode } from '@/utils/circuitUtils'
import { useResizable } from '@/hooks/useResizable'

const Home: NextPage = () => {
  const { addLog, setAlgorithms, gates, numQubits, setCode } = useQuantumStore()
  const { leftWidth, rightWidth, onDragLeft, onDragRight } = useResizable()

  useEffect(() => {
    // Load algorithms from backend
    api.getAlgorithms()
      .then(algos => {
        setAlgorithms(algos)
        addLog(`QuantumIDE ready · ${algos.length} algorithms loaded`, 'success')
      })
      .catch(() => {
        addLog('Backend offline · Using local simulation engine', 'warn')
      })

    // Check backend health
    api.health().then(ok => {
      if (ok) addLog('Connected to Qiskit Aer backend', 'info')
    })

    addLog('Drag gates onto the circuit or load an algorithm to begin', 'info')
  }, [])

  useEffect(() => {
    // Auto-generate code when circuit changes
    const code = generateQiskitCode(numQubits, gates)
    setCode(code)
  }, [gates, numQubits])

  return (
    <>
      <Head>
        <title>QuantumIDE — Unified Quantum Development Environment</title>
        <meta name="description" content="Professional quantum circuit design, simulation, and visualization platform" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div style={{
        display: 'flex', flexDirection: 'column', height: '100vh',
        background: '#0B0F14', overflow: 'hidden'
      }}>
        <TopBar />

        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          {/* Left: Circuit Builder */}
          <div style={{ width: leftWidth, flexShrink: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <CircuitBuilder />
          </div>

          {/* Resize handle */}
          <div
            style={{ width: 3, background: '#1E2A3A', cursor: 'col-resize', flexShrink: 0, transition: 'background 0.15s', zIndex: 10 }}
            onMouseDown={onDragLeft}
            onMouseEnter={e => (e.currentTarget.style.background = '#4F8CFF')}
            onMouseLeave={e => (e.currentTarget.style.background = '#1E2A3A')}
          />

          {/* Center: Code Editor */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 280 }}>
            <CodeEditor />
          </div>

          {/* Resize handle */}
          <div
            style={{ width: 3, background: '#1E2A3A', cursor: 'col-resize', flexShrink: 0, transition: 'background 0.15s', zIndex: 10 }}
            onMouseDown={onDragRight}
            onMouseEnter={e => (e.currentTarget.style.background = '#4F8CFF')}
            onMouseLeave={e => (e.currentTarget.style.background = '#1E2A3A')}
          />

          {/* Right: Visualization */}
          <div style={{ width: rightWidth, flexShrink: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <VisualizationPanel />
          </div>
        </div>

        {/* Bottom: Output */}
        <OutputPanel />

        {/* Algorithm Modal */}
        <AlgoModal />
      </div>
    </>
  )
}

export default Home
