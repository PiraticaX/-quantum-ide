import { useQuantumStore } from '@/store/quantumStore'
import { parseQiskitCode } from '@/utils/circuitUtils'
import { useEffect, useRef, useState, useCallback } from 'react'

const KEYWORDS = ['from', 'import', 'def', 'class', 'return', 'if', 'else', 'for', 'in', 'range', 'print', 'True', 'False', 'None']
const BUILTINS = ['QuantumCircuit', 'QuantumRegister', 'ClassicalRegister', 'AerSimulator', 'np']

function syntaxHighlight(code: string): string {
  return code
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/(#[^\n]*)/g, '<span style="color:#6B7280;font-style:italic">$1</span>')
    .replace(/("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/g, '<span style="color:#7CFFB2">$1</span>')
    .replace(/\b(\d+\.?\d*)\b/g, '<span style="color:#FFB84F">$1</span>')
    .replace(/\b(np\.pi|np)\b/g, '<span style="color:#FFD080">$1</span>')
    .replace(
      new RegExp(`\\b(${KEYWORDS.join('|')})\\b`, 'g'),
      '<span style="color:#CC99FF">$1</span>'
    )
    .replace(
      new RegExp(`\\b(${BUILTINS.join('|')})\\b`, 'g'),
      '<span style="color:#FFD080">$1</span>'
    )
    .replace(/\b(qc\.\w+)\b/g, '<span style="color:#7AB8FF">$1</span>')
    .replace(/\b(qc|qr|cr|job|result|counts|simulator)\b/g, '<span style="color:#E6EDF3">$1</span>')
}

export function CodeEditor() {
  const { code, setCode, numQubits, gates, placeGate, setNumQubits, addLog } = useQuantumStore()
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const highlightRef = useRef<HTMLDivElement>(null)
  const [lineCount, setLineCount] = useState(1)
  const [syncing, setSyncing] = useState(false)

  useEffect(() => {
    const lines = code.split('\n').length
    setLineCount(lines)
    if (highlightRef.current) {
      highlightRef.current.innerHTML = syntaxHighlight(code) + '\n'
    }
  }, [code])

  const syncScroll = useCallback(() => {
    if (textareaRef.current && highlightRef.current) {
      highlightRef.current.scrollTop = textareaRef.current.scrollTop
      highlightRef.current.scrollLeft = textareaRef.current.scrollLeft
    }
  }, [])

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault()
      const ta = e.currentTarget
      const start = ta.selectionStart
      const end = ta.selectionEnd
      const newCode = code.substring(0, start) + '    ' + code.substring(end)
      setCode(newCode)
      requestAnimationFrame(() => {
        ta.selectionStart = ta.selectionEnd = start + 4
      })
    }
  }, [code, setCode])

  const syncFromCode = useCallback(() => {
    setSyncing(true)
    try {
      const { numQubits: n, gates: parsed } = parseQiskitCode(code)
      setNumQubits(n)
      // Clear and re-add gates
      const store = useQuantumStore.getState()
      store.clearCircuit()
      useQuantumStore.setState({ numQubits: n })
      parsed.forEach(g => store.placeGate(g))
      addLog(`Code parsed → ${n} qubits, ${parsed.length} gates extracted`, 'success')
    } catch (e: any) {
      addLog(`Parse error: ${e.message}`, 'error')
    } finally {
      setTimeout(() => setSyncing(false), 600)
    }
  }, [code])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#0B0F14' }}>
      {/* Header */}
      <div style={{
        padding: '8px 12px', background: '#161C26', borderBottom: '1px solid #1E2A3A',
        display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0
      }}>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M2 4L5 6L2 8" stroke="#6B7280" strokeWidth="1.5" strokeLinecap="round"/>
          <path d="M6 8H10" stroke="#6B7280" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
        <span style={{ fontSize: 11, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.7px' }}>
          Qiskit Editor
        </span>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 10, color: '#6B7280' }}>
            {lineCount} lines · Python · Qiskit
          </span>
          <div style={{
            width: 6, height: 6, borderRadius: '50%',
            background: '#7CFFB2', boxShadow: '0 0 4px rgba(124,255,178,0.5)'
          }} />
          <button
            onClick={syncFromCode}
            style={{
              padding: '3px 10px', fontSize: 11, fontWeight: 500, borderRadius: 5,
              border: '1px solid #243048', background: syncing ? 'rgba(79,140,255,0.1)' : '#1A2234',
              color: syncing ? '#4F8CFF' : '#9AA4B2', cursor: 'pointer', transition: 'all 0.15s',
              display: 'flex', alignItems: 'center', gap: 5
            }}
            onMouseEnter={e => { e.currentTarget.style.color = '#E6EDF3' }}
            onMouseLeave={e => { e.currentTarget.style.color = syncing ? '#4F8CFF' : '#9AA4B2' }}
          >
            {syncing ? (
              <><span style={{ animation: 'spin-slow 0.8s linear infinite', display: 'inline-block' }}>↻</span> Syncing</>
            ) : '↻ Sync to Circuit'}
          </button>
        </div>
      </div>

      {/* Editor body */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>
        {/* Line numbers */}
        <div style={{
          width: 44, background: '#0D1219', borderRight: '1px solid #1E2A3A',
          padding: '14px 0', flexShrink: 0, overflow: 'hidden', userSelect: 'none'
        }}>
          {Array.from({ length: lineCount }, (_, i) => (
            <div key={i} style={{
              height: '1.7em', lineHeight: '1.7em', fontSize: 11,
              fontFamily: 'JetBrains Mono, monospace',
              color: '#3A4A5C', textAlign: 'right', paddingRight: 10
            }}>
              {i + 1}
            </div>
          ))}
        </div>

        {/* Code area */}
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
          {/* Syntax highlighted backdrop */}
          <div
            ref={highlightRef}
            style={{
              position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
              padding: '14px 16px', margin: 0,
              fontFamily: 'JetBrains Mono, Fira Code, monospace',
              fontSize: 12, lineHeight: '1.7em',
              color: '#E6EDF3', whiteSpace: 'pre',
              overflow: 'hidden', pointerEvents: 'none',
              wordBreak: 'normal', overflowWrap: 'normal'
            }}
          />
          {/* Actual textarea (transparent, on top) */}
          <textarea
            ref={textareaRef}
            value={code}
            onChange={e => setCode(e.target.value)}
            onKeyDown={handleKeyDown}
            onScroll={syncScroll}
            spellCheck={false}
            autoComplete="off"
            autoCorrect="off"
            style={{
              position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
              padding: '14px 16px', margin: 0,
              fontFamily: 'JetBrains Mono, Fira Code, monospace',
              fontSize: 12, lineHeight: '1.7em',
              background: 'transparent', border: 'none', outline: 'none',
              color: 'transparent', caretColor: '#4F8CFF',
              resize: 'none', whiteSpace: 'pre',
              wordBreak: 'normal', overflowWrap: 'normal',
              overflowX: 'auto', overflowY: 'auto',
              tabSize: 4
            }}
          />
        </div>
      </div>

      {/* Status bar */}
      <div style={{
        height: 24, background: '#0D1219', borderTop: '1px solid #1E2A3A',
        display: 'flex', alignItems: 'center', padding: '0 14px', gap: 16, flexShrink: 0
      }}>
        <span style={{ fontSize: 10, color: '#3A4A5C' }}>UTF-8</span>
        <span style={{ fontSize: 10, color: '#3A4A5C' }}>LF</span>
        <span style={{ fontSize: 10, color: '#3A4A5C' }}>Spaces: 4</span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 12 }}>
          <span style={{ fontSize: 10, color: '#3A4A5C' }}>
            {gates.length} gates · {numQubits} qubits
          </span>
        </div>
      </div>
    </div>
  )
}
