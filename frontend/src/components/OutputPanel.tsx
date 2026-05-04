import { useQuantumStore } from '@/store/quantumStore'
import { useRef, useEffect, useState } from 'react'

const LOG_COLORS = {
  info: '#9AA4B2',
  success: '#7CFFB2',
  warn: '#FFB84F',
  error: '#FF5F5F',
}

const LOG_ICONS = {
  info: '·',
  success: '✓',
  warn: '⚠',
  error: '✗',
}

export function OutputPanel() {
  const { logs, clearLogs, simResult } = useQuantumStore()
  const [tab, setTab] = useState<'logs' | 'results'>('logs')
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (tab === 'logs') bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [logs, tab])

  return (
    <div style={{
      height: 160, background: '#0B0F14', borderTop: '1px solid #1E2A3A',
      display: 'flex', flexDirection: 'column', flexShrink: 0
    }}>
      {/* Header with tabs */}
      <div style={{
        display: 'flex', alignItems: 'center',
        background: '#161C26', borderBottom: '1px solid #1E2A3A',
        padding: '0 12px', flexShrink: 0, height: 34
      }}>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ marginRight: 8 }}>
          <rect x="1" y="1" width="10" height="10" rx="2" stroke="#6B7280" strokeWidth="1.5"/>
          <path d="M3 5h6M3 7h4" stroke="#6B7280" strokeWidth="1" strokeLinecap="round"/>
        </svg>
        {(['logs', 'results'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: '4px 10px', fontSize: 11, fontWeight: 500,
              borderRadius: 4, border: 'none', cursor: 'pointer',
              background: tab === t ? '#1A2234' : 'transparent',
              color: tab === t ? '#E6EDF3' : '#6B7280',
              transition: 'all 0.15s', textTransform: 'capitalize',
              marginRight: 2
            }}
          >
            {t}
            {t === 'logs' && logs.length > 0 && (
              <span style={{
                marginLeft: 5, fontSize: 9, padding: '1px 5px',
                borderRadius: 8, background: '#243048', color: '#9AA4B2'
              }}>
                {logs.length}
              </span>
            )}
          </button>
        ))}
        <div style={{ flex: 1 }} />
        <button
          onClick={clearLogs}
          style={{
            fontSize: 10, color: '#6B7280', background: 'none', border: 'none',
            cursor: 'pointer', padding: '2px 8px', borderRadius: 4,
            transition: 'color 0.15s'
          }}
          onMouseEnter={e => e.currentTarget.style.color = '#E6EDF3'}
          onMouseLeave={e => e.currentTarget.style.color = '#6B7280'}
        >
          Clear
        </button>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'auto', padding: '6px 14px' }}>
        {tab === 'logs' && (
          <>
            {logs.length === 0 ? (
              <div style={{ color: '#3A4A5C', fontSize: 11, paddingTop: 8, fontStyle: 'italic' }}>
                No output yet. Run a simulation to see logs here.
              </div>
            ) : (
              logs.map(log => (
                <div key={log.id} style={{
                  display: 'flex', alignItems: 'baseline', gap: 8, padding: '1.5px 0',
                  borderBottom: '1px solid rgba(255,255,255,0.02)'
                }}>
                  <span style={{ fontSize: 10, color: '#3A4A5C', fontFamily: 'JetBrains Mono, monospace', flexShrink: 0 }}>
                    [{log.timestamp}]
                  </span>
                  <span style={{ fontSize: 11, color: LOG_COLORS[log.type], flexShrink: 0 }}>
                    {LOG_ICONS[log.type]}
                  </span>
                  <span style={{
                    fontSize: 11, color: LOG_COLORS[log.type],
                    fontFamily: log.type === 'error' ? 'JetBrains Mono, monospace' : 'inherit'
                  }}>
                    {log.message}
                  </span>
                </div>
              ))
            )}
            <div ref={bottomRef} />
          </>
        )}

        {tab === 'results' && (
          simResult ? (
            <div style={{ display: 'flex', gap: 24, paddingTop: 4, overflowX: 'auto' }}>
              {/* Top states */}
              <div>
                <div style={{ fontSize: 10, color: '#6B7280', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.7px' }}>
                  Top States
                </div>
                {Object.entries(simResult.counts)
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 6)
                  .map(([state, count]) => (
                    <div key={state} style={{
                      display: 'flex', gap: 12, fontSize: 11,
                      fontFamily: 'JetBrains Mono, monospace',
                      padding: '2px 0', borderBottom: '1px solid #1E2A3A'
                    }}>
                      <span style={{ color: '#7CFFB2' }}>|{state}⟩</span>
                      <span style={{ color: '#4F8CFF' }}>{count}</span>
                      <span style={{ color: '#6B7280' }}>{(count / simResult.shots * 100).toFixed(1)}%</span>
                    </div>
                  ))}
              </div>
              {/* Circuit metrics */}
              <div>
                <div style={{ fontSize: 10, color: '#6B7280', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.7px' }}>
                  Metrics
                </div>
                {[
                  ['Qubits', simResult.num_qubits],
                  ['Shots', simResult.shots.toLocaleString()],
                  ['Entropy', `${simResult.entropy} bits`],
                  ['Outcomes', Object.keys(simResult.counts).length],
                ].map(([k, v]) => (
                  <div key={k as string} style={{ display: 'flex', gap: 12, fontSize: 11, fontFamily: 'JetBrains Mono, monospace', padding: '2px 0' }}>
                    <span style={{ color: '#6B7280', minWidth: 60 }}>{k}</span>
                    <span style={{ color: '#9AA4B2' }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ color: '#3A4A5C', fontSize: 11, paddingTop: 8, fontStyle: 'italic' }}>
              No results yet. Run ▶ to simulate.
            </div>
          )
        )}
      </div>
    </div>
  )
}
