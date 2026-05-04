import { useQuantumStore, GateType } from '@/store/quantumStore'
import { GATE_META } from '@/utils/circuitUtils'
import { useCallback, useState } from 'react'

const GATE_ORDER: GateType[] = ['H', 'X', 'Y', 'Z', 'S', 'T', 'CNOT', 'SWAP', 'RX(π/2)', 'RY(π/4)', 'RZ(π/4)', 'M']

const PanelHeader = ({ children, actions }: { children: React.ReactNode; actions?: React.ReactNode }) => (
  <div style={{
    padding: '8px 12px', background: '#161C26', borderBottom: '1px solid #1E2A3A',
    display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, fontWeight: 600,
    color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.7px', flexShrink: 0
  }}>
    {children}
    {actions && <div style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>{actions}</div>}
  </div>
)

function GateChip({ type }: { type: GateType }) {
  const meta = GATE_META[type]
  const { setDraggingGate } = useQuantumStore()

  return (
    <div
      draggable
      onDragStart={e => {
        e.dataTransfer.setData('gate', type)
        setDraggingGate(type)
      }}
      onDragEnd={() => setDraggingGate(null)}
      title={meta.desc}
      style={{
        padding: '5px 10px', borderRadius: 6,
        background: '#161C26', border: `1px solid ${meta.border}`,
        color: meta.color, fontSize: 11, fontWeight: 700,
        cursor: 'grab', userSelect: 'none', transition: 'all 0.12s',
        minWidth: 38, textAlign: 'center'
      }}
      onMouseEnter={e => {
        e.currentTarget.style.background = `${meta.color}12`
        e.currentTarget.style.transform = 'translateY(-1px)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = '#161C26'
        e.currentTarget.style.transform = 'none'
      }}
    >
      {meta.label}
    </div>
  )
}

function DropSlot({ qubit, slot }: { qubit: number; slot: number }) {
  const { placeGate, draggingGate } = useQuantumStore()
  const [over, setOver] = useState(false)

  return (
    <div
      onDragOver={e => { e.preventDefault(); setOver(true) }}
      onDragLeave={() => setOver(false)}
      onDrop={e => {
        e.preventDefault()
        setOver(false)
        const gate = e.dataTransfer.getData('gate') as GateType
        if (gate) placeGate({ type: gate, qubit, slot })
      }}
      style={{
        width: 38, height: 38, borderRadius: 6, flexShrink: 0,
        border: `1.5px dashed ${over && draggingGate ? '#4F8CFF' : '#1E2A3A'}`,
        background: over && draggingGate ? 'rgba(79,140,255,0.06)' : 'transparent',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'default', transition: 'all 0.1s'
      }}
    >
      {over && draggingGate && (
        <div style={{ width: 16, height: 16, borderRadius: 3, background: 'rgba(79,140,255,0.3)' }} />
      )}
    </div>
  )
}

function PlacedGate({ gate }: { gate: ReturnType<typeof useQuantumStore.getState>['gates'][0] }) {
  const { removeGate, selectedGate, setSelectedGate } = useQuantumStore()
  const meta = GATE_META[gate.type] || GATE_META['H']
  const isSelected = selectedGate === gate.id

  return (
    <div
      onClick={() => setSelectedGate(isSelected ? null : gate.id)}
      onContextMenu={e => { e.preventDefault(); removeGate(gate.id) }}
      title={`${meta.desc}\nRight-click to remove`}
      style={{
        height: 38, minWidth: 38, padding: '0 8px', borderRadius: 6, flexShrink: 0,
        background: isSelected ? `${meta.color}20` : '#161C26',
        border: `1px solid ${isSelected ? meta.color : meta.border}`,
        color: meta.color, fontSize: 11, fontWeight: 700,
        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all 0.12s', userSelect: 'none',
        boxShadow: isSelected ? `0 0 8px ${meta.color}30` : 'none'
      }}
      onMouseEnter={e => {
        if (!isSelected) {
          e.currentTarget.style.background = `${meta.color}15`
          e.currentTarget.style.borderColor = meta.color
        }
      }}
      onMouseLeave={e => {
        if (!isSelected) {
          e.currentTarget.style.background = '#161C26'
          e.currentTarget.style.borderColor = meta.border
        }
      }}
    >
      {meta.label}
    </div>
  )
}

export function CircuitBuilder() {
  const { numQubits, gates, addQubit, removeQubit, setDraggingGate } = useQuantumStore()

  const getMaxSlots = () => {
    const max = gates.reduce((m, g) => Math.max(m, g.slot + 1), 0)
    return Math.max(max, 5)
  }

  const getGateAt = (qubit: number, slot: number) =>
    gates.find(g => g.qubit === qubit && g.slot === slot)

  const slots = getMaxSlots()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#121821' }}>
      <PanelHeader
        actions={
          <>
            <SmallBtn onClick={removeQubit} disabled={numQubits <= 1}>− q</SmallBtn>
            <SmallBtn onClick={addQubit} disabled={numQubits >= 8}>+ q</SmallBtn>
          </>
        }
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <rect x="1" y="5" width="10" height="2" rx="1" fill="currentColor"/>
          <rect x="3" y="2" width="2" height="8" rx="1" fill="currentColor"/>
          <rect x="7" y="2" width="2" height="8" rx="1" fill="currentColor"/>
        </svg>
        Circuit Builder
      </PanelHeader>

      {/* Gate palette */}
      <div style={{
        padding: '10px 12px', display: 'flex', flexWrap: 'wrap', gap: 6,
        borderBottom: '1px solid #1E2A3A', background: '#0F1620'
      }}>
        {GATE_ORDER.map(type => <GateChip key={type} type={type} />)}
      </div>

      {/* Legend */}
      <div style={{ padding: '6px 12px', borderBottom: '1px solid #1E2A3A', display: 'flex', gap: 12 }}>
        {['Single', 'Multi', 'Rotate', 'Measure'].map(cat => (
          <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{
              width: 6, height: 6, borderRadius: 2,
              background: cat === 'Single' ? '#7AB8FF' : cat === 'Multi' ? '#CC88FF' : cat === 'Rotate' ? '#88CCFF' : '#AAAAAA'
            }} />
            <span style={{ fontSize: 10, color: '#6B7280' }}>{cat}</span>
          </div>
        ))}
        <span style={{ fontSize: 10, color: '#6B7280', marginLeft: 'auto' }}>Right-click gate to remove</span>
      </div>

      {/* Circuit grid */}
      <div style={{ flex: 1, overflow: 'auto', padding: '16px 12px' }}>
        {Array.from({ length: numQubits }, (_, qi) => (
          <div key={qi} style={{ display: 'flex', alignItems: 'center', marginBottom: 12, position: 'relative' }}>
            {/* Qubit label */}
            <div style={{
              width: 32, fontSize: 11, color: '#6B7280', fontWeight: 600,
              textAlign: 'right', paddingRight: 8, fontFamily: 'JetBrains Mono, monospace',
              flexShrink: 0
            }}>
              |q{qi}⟩
            </div>

            {/* Wire + gates */}
            <div style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center', gap: 6 }}>
              {/* Wire line behind gates */}
              <div style={{
                position: 'absolute', left: 0, right: 0, top: '50%',
                height: 1.5, background: '#1E2A3A', transform: 'translateY(-50%)', zIndex: 0
              }} />
              {/* Initial state */}
              <div style={{
                fontSize: 10, color: '#6B7280', fontFamily: 'JetBrains Mono,monospace',
                marginRight: 2, flexShrink: 0, position: 'relative', zIndex: 1
              }}>─</div>

              {Array.from({ length: slots }, (_, si) => {
                const gate = getGateAt(qi, si)
                return (
                  <div key={si} style={{ position: 'relative', zIndex: 1 }}>
                    {gate ? <PlacedGate gate={gate} /> : <DropSlot qubit={qi} slot={si} />}
                  </div>
                )
              })}

              {/* Terminal */}
              <div style={{
                fontSize: 10, color: '#6B7280', marginLeft: 2, flexShrink: 0, position: 'relative', zIndex: 1
              }}>─</div>
            </div>
          </div>
        ))}

        {/* Measurement indicator */}
        {gates.filter(g => g.type === 'M').length === 0 && (
          <div style={{
            marginTop: 8, padding: '6px 10px', borderRadius: 6,
            background: 'rgba(255,184,79,0.06)', border: '1px solid rgba(255,184,79,0.2)',
            fontSize: 11, color: '#FFB84F', display: 'flex', alignItems: 'center', gap: 6
          }}>
            <span>⚠</span> No measurement gates — qc.measure_all() will be added automatically
          </div>
        )}
      </div>
    </div>
  )
}

function SmallBtn({ onClick, disabled, children }: { onClick: () => void; disabled?: boolean; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: '2px 8px', fontSize: 10, fontWeight: 600, borderRadius: 4,
        border: '1px solid #1E2A3A', background: disabled ? 'transparent' : '#1A2234',
        color: disabled ? '#3A4258' : '#9AA4B2', cursor: disabled ? 'default' : 'pointer',
        transition: 'all 0.12s'
      }}
    >
      {children}
    </button>
  )
}
