import { useQuantumStore } from '@/store/quantumStore'
import { BlochSphere } from './BlochSphere'
import { ProbHistogram } from './ProbHistogram'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ borderBottom: '1px solid #1E2A3A' }}>
      <div style={{
        padding: '8px 12px 6px', display: 'flex', alignItems: 'center', gap: 6
      }}>
        <span style={{ fontSize: 10, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.7px', fontWeight: 600 }}>
          {title}
        </span>
      </div>
      <div style={{ padding: '0 12px 12px' }}>
        {children}
      </div>
    </div>
  )
}

function EmptyState({ label }: { label: string }) {
  return (
    <div style={{
      padding: '12px 0', textAlign: 'center', color: '#3A4A5C',
      fontSize: 11, fontStyle: 'italic'
    }}>
      {label}
    </div>
  )
}

export function VisualizationPanel() {
  const { simResult, numQubits, isSimulating } = useQuantumStore()

  const blochVectors = simResult?.bloch_vectors ?? Array.from({ length: numQubits }, () => ({ x: 0, y: 0, z: 1 }))
  const counts = simResult?.counts ?? {}
  const statevec = simResult?.statevector ?? []
  const shots = simResult?.shots ?? 1024

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#121821', overflowY: 'auto' }}>
      {/* Header */}
      <div style={{
        padding: '8px 12px', background: '#161C26', borderBottom: '1px solid #1E2A3A',
        display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, fontWeight: 600,
        color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.7px', flexShrink: 0
      }}>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <circle cx="6" cy="6" r="4" stroke="currentColor" strokeWidth="1.5"/>
          <line x1="6" y1="2" x2="6" y2="10" stroke="currentColor" strokeWidth="1" opacity="0.5"/>
          <line x1="2" y1="6" x2="10" y2="6" stroke="currentColor" strokeWidth="1" opacity="0.5"/>
        </svg>
        Visualization
        {isSimulating && (
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{
              width: 8, height: 8, borderRadius: '50%',
              border: '1.5px solid rgba(124,255,178,0.4)', borderTopColor: '#7CFFB2',
              animation: 'spin-slow 0.8s linear infinite'
            }} />
            <span style={{ fontSize: 10, color: '#7CFFB2' }}>Computing</span>
          </div>
        )}
        {simResult && !isSimulating && (
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#7CFFB2' }} />
            <span style={{ fontSize: 10, color: '#7CFFB2' }}>{shots} shots</span>
          </div>
        )}
      </div>

      {/* Bloch Spheres */}
      <Section title="Bloch Spheres">
        {blochVectors.length === 0 ? (
          <EmptyState label="Run simulation to render Bloch spheres" />
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center', paddingTop: 4 }}>
            {blochVectors.slice(0, numQubits).map((bv, i) => (
              <BlochSphere
                key={i}
                x={bv.x} y={bv.y} z={bv.z}
                label={`|q${i}⟩`}
                size={simResult ? 88 : 80}
              />
            ))}
          </div>
        )}
      </Section>

      {/* Probability Distribution */}
      <Section title="Measurement Probabilities">
        {Object.keys(counts).length === 0 ? (
          <EmptyState label="Probabilities appear after simulation" />
        ) : (
          <>
            <ProbHistogram counts={counts} shots={shots} />
            <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
              {Object.entries(counts)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 6)
                .map(([state, count]) => {
                  const pct = count / shots * 100
                  return (
                    <div key={state} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{
                        fontSize: 11, fontFamily: 'JetBrains Mono, monospace',
                        color: '#9AA4B2', minWidth: 40, letterSpacing: 1
                      }}>|{state}⟩</span>
                      <div style={{
                        flex: 1, height: 8, background: '#0B0F14',
                        borderRadius: 4, overflow: 'hidden', border: '1px solid #1E2A3A'
                      }}>
                        <div style={{
                          height: '100%', borderRadius: 4,
                          width: `${pct}%`,
                          background: `linear-gradient(90deg, #4F8CFF, #7CFFB2)`,
                          transition: 'width 0.5s ease'
                        }} />
                      </div>
                      <span style={{ fontSize: 10, color: '#6B7280', minWidth: 36, textAlign: 'right' }}>
                        {pct.toFixed(1)}%
                      </span>
                    </div>
                  )
                })}
            </div>
          </>
        )}
      </Section>

      {/* State Vector */}
      <Section title="State Vector">
        {statevec.length === 0 ? (
          <EmptyState label="State vector appears after simulation" />
        ) : (
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }}>
            {statevec
              .map(([re, im], i) => ({ re, im, prob: re * re + im * im, i }))
              .filter(({ prob }) => prob > 0.001)
              .slice(0, 8)
              .map(({ re, im, prob, i }) => {
                const state = i.toString(2).padStart(numQubits, '0')
                const imStr = im >= 0 ? `+${im.toFixed(3)}i` : `${im.toFixed(3)}i`
                return (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '3px 0', borderBottom: '1px solid rgba(255,255,255,0.03)'
                  }}>
                    <span style={{ color: '#6B7280' }}>|{state}⟩</span>
                    <span style={{ color: '#4F8CFF', fontSize: 10 }}>
                      {re.toFixed(3)}{imStr}
                    </span>
                    <span style={{ color: '#7CFFB2', fontSize: 10 }}>
                      {(prob * 100).toFixed(1)}%
                    </span>
                  </div>
                )
              })}
          </div>
        )}
      </Section>

      {/* Entropy */}
      {simResult && (
        <Section title="Circuit Metrics">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <MetricRow label="Von Neumann Entropy" value={`${simResult.entropy} bits`} color="#4F8CFF" />
            <MetricRow label="Hilbert Space Dim" value={`2^${simResult.num_qubits} = ${1 << simResult.num_qubits}`} color="#9AA4B2" />
            <MetricRow label="Shots" value={`${simResult.shots.toLocaleString()}`} color="#9AA4B2" />
            <MetricRow
              label="Distinct Outcomes"
              value={`${Object.keys(simResult.counts).length}`}
              color={Object.keys(simResult.counts).length > 1 ? '#7CFFB2' : '#FFB84F'}
            />
          </div>
        </Section>
      )}
    </div>
  )
}

function MetricRow({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontSize: 11, color: '#6B7280' }}>{label}</span>
      <span style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', color, fontWeight: 600 }}>
        {value}
      </span>
    </div>
  )
}
