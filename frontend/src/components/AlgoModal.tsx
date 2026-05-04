import { useQuantumStore, Algorithm } from '@/store/quantumStore'
import { useEffect, useRef } from 'react'

const CATEGORY_COLORS: Record<string, string> = {
  Fundamental: '#4F8CFF',
  Search: '#7CFFB2',
  Transform: '#FFB84F',
  Communication: '#CC88FF',
  Optimization: '#FF88CC',
  Oracle: '#FF9988',
}

function AlgoCard({ algo, onLoad }: { algo: Algorithm; onLoad: () => void }) {
  const catColor = CATEGORY_COLORS[algo.category] || '#9AA4B2'
  return (
    <div
      onClick={onLoad}
      style={{
        padding: '14px 16px', borderRadius: 8, cursor: 'pointer',
        background: '#161C26', border: '1px solid #1E2A3A',
        transition: 'all 0.15s'
      }}
      onMouseEnter={e => {
        e.currentTarget.style.background = '#1A2234'
        e.currentTarget.style.borderColor = '#243048'
        e.currentTarget.style.transform = 'translateY(-1px)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = '#161C26'
        e.currentTarget.style.borderColor = '#1E2A3A'
        e.currentTarget.style.transform = 'none'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: '#E6EDF3' }}>{algo.name}</span>
        <span style={{
          fontSize: 9, fontWeight: 600, padding: '2px 7px', borderRadius: 10,
          background: `${catColor}18`, color: catColor, border: `1px solid ${catColor}30`,
          textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap', marginLeft: 8
        }}>
          {algo.category}
        </span>
      </div>
      <p style={{ fontSize: 11, color: '#6B7280', marginBottom: 10, lineHeight: 1.5 }}>
        {algo.description}
      </p>
      <div style={{ display: 'flex', gap: 8 }}>
        <Chip label={`${algo.qubits} qubits`} />
        <Chip label={`${algo.gates.length} gates`} />
      </div>
    </div>
  )
}

function Chip({ label }: { label: string }) {
  return (
    <span style={{
      fontSize: 10, padding: '2px 8px', borderRadius: 5,
      background: '#1A2234', border: '1px solid #243048', color: '#9AA4B2',
      fontFamily: 'JetBrains Mono, monospace'
    }}>
      {label}
    </span>
  )
}

export function AlgoModal() {
  const { algorithms, showAlgoModal, setShowAlgoModal, loadAlgorithm, addLog } = useQuantumStore()
  const overlayRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowAlgoModal(false)
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

  if (!showAlgoModal) return null

  // Group by category
  const byCategory: Record<string, Algorithm[]> = {}
  for (const algo of algorithms) {
    if (!byCategory[algo.category]) byCategory[algo.category] = []
    byCategory[algo.category].push(algo)
  }

  return (
    <div
      ref={overlayRef}
      onClick={e => { if (e.target === overlayRef.current) setShowAlgoModal(false) }}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000, backdropFilter: 'blur(4px)', animation: 'fadeIn 0.15s ease-out'
      }}
    >
      <div style={{
        width: 680, maxWidth: '95vw', maxHeight: '80vh',
        background: '#121821', borderRadius: 12, border: '1px solid #243048',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
        boxShadow: '0 24px 64px rgba(0,0,0,0.6), 0 0 0 1px rgba(79,140,255,0.1)',
        animation: 'slideUp 0.2s ease-out'
      }}>
        {/* Modal header */}
        <div style={{
          padding: '16px 20px', borderBottom: '1px solid #1E2A3A',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexShrink: 0
        }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#E6EDF3', marginBottom: 2 }}>
              Algorithm Library
            </div>
            <div style={{ fontSize: 11, color: '#6B7280' }}>
              {algorithms.length} prebuilt quantum algorithms · Click to load into workspace
            </div>
          </div>
          <button
            onClick={() => setShowAlgoModal(false)}
            style={{
              width: 28, height: 28, borderRadius: 6, background: '#1A2234',
              border: '1px solid #243048', color: '#9AA4B2', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 14, transition: 'all 0.15s'
            }}
            onMouseEnter={e => { e.currentTarget.style.color = '#E6EDF3'; e.currentTarget.style.background = '#243048' }}
            onMouseLeave={e => { e.currentTarget.style.color = '#9AA4B2'; e.currentTarget.style.background = '#1A2234' }}
          >
            ×
          </button>
        </div>

        {/* Algorithm grid */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
          {Object.keys(byCategory).length === 0 ? (
            <div style={{ textAlign: 'center', color: '#6B7280', fontSize: 12, padding: '40px 0' }}>
              Loading algorithms...
            </div>
          ) : (
            Object.entries(byCategory).map(([category, algos]) => (
              <div key={category} style={{ marginBottom: 20 }}>
                <div style={{
                  fontSize: 10, color: CATEGORY_COLORS[category] || '#9AA4B2',
                  textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: 700,
                  marginBottom: 10, paddingBottom: 6,
                  borderBottom: `1px solid ${CATEGORY_COLORS[category] || '#9AA4B2'}20`
                }}>
                  {category}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {algos.map(algo => (
                    <AlgoCard
                      key={algo.id}
                      algo={algo}
                      onLoad={() => {
                        loadAlgorithm(algo)
                        addLog(`Loaded algorithm: ${algo.name} (${algo.qubits} qubits, ${algo.gates.length} gates)`, 'success')
                      }}
                    />
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '10px 20px', borderTop: '1px solid #1E2A3A',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexShrink: 0
        }}>
          <span style={{ fontSize: 11, color: '#6B7280' }}>Press Esc to close</span>
          <button
            onClick={() => setShowAlgoModal(false)}
            style={{
              padding: '6px 16px', borderRadius: 6, fontSize: 12, fontWeight: 500,
              background: '#1A2234', border: '1px solid #243048', color: '#9AA4B2',
              cursor: 'pointer', transition: 'all 0.15s'
            }}
            onMouseEnter={e => e.currentTarget.style.color = '#E6EDF3'}
            onMouseLeave={e => e.currentTarget.style.color = '#9AA4B2'}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
