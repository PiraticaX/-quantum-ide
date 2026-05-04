# QuantumIDE — Unified Quantum Development Environment

<div align="center">

![QuantumIDE](https://img.shields.io/badge/QuantumIDE-v1.0.0-4F8CFF?style=for-the-badge)
![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?style=for-the-badge&logo=fastapi)
![Qiskit](https://img.shields.io/badge/Qiskit-1.2-6929C4?style=for-the-badge&logo=ibm)

**A production-grade quantum circuit IDE with real-time simulation, visual state representation, and a full algorithm library.**

</div>

---

## Overview

QuantumIDE unifies fragmented quantum tooling into a single, polished environment. Design circuits visually, write Qiskit Python code, simulate execution with Qiskit Aer (or the built-in local simulator), and visualize quantum states — all in one place with real-time bidirectional sync.

---

## Features

### Circuit Builder
- Drag-and-drop gate palette: H, X, Y, Z, S, T, CNOT, SWAP, Rx, Ry, Rz, Measure
- Dynamic qubit management (1–8 qubits)
- Grid-based snap placement
- Right-click to remove gates
- Visual wire layout with slot-based positioning

### Code Editor
- Full Python/Qiskit syntax highlighting (pure CSS, no heavy deps)
- Live line numbers
- Tab indentation support
- Bidirectional sync: circuit → code (auto) and code → circuit (↻ Sync button)

### Simulation Engine
- **Primary**: Qiskit Aer statevector + shot-based simulation (1024 shots)
- **Fallback**: Pure TypeScript/browser local simulator (no backend required)
- Supports: H, X, Y, Z, S, T, CNOT, SWAP, Rx, Ry, Rz gates

### Visualization
- Per-qubit **Bloch sphere** rendering (HTML5 Canvas, high-DPI)
- **Probability histogram** with animated gradient bars
- **State vector amplitudes** in Dirac notation
- **Circuit metrics**: Von Neumann entropy, Hilbert space dimension, distinct outcomes

### Algorithm Library
- Bell State
- Grover's Search (3-qubit oracle)
- Quantum Fourier Transform (3-qubit)
- Quantum Teleportation
- VQE Ansatz (4-qubit hardware-efficient)
- Bernstein-Vazirani

### Output Panel
- Real-time simulation logs with timestamps
- Colored log levels: info, success, warn, error
- Results tab with top states and circuit metrics
- Backend connectivity status

---

## Architecture

```
quantum-ide/
├── frontend/                   # Next.js 14 + TypeScript
│   └── src/
│       ├── components/
│       │   ├── TopBar.tsx          # Run button, algo picker, status
│       │   ├── CircuitBuilder.tsx  # Drag-and-drop circuit editor
│       │   ├── CodeEditor.tsx      # Syntax-highlighted Python editor
│       │   ├── VisualizationPanel.tsx  # Bloch spheres + histograms
│       │   ├── OutputPanel.tsx     # Logs + results
│       │   ├── AlgoModal.tsx       # Algorithm library modal
│       │   ├── BlochSphere.tsx     # Canvas Bloch sphere renderer
│       │   └── ProbHistogram.tsx   # Canvas probability chart
│       ├── store/
│       │   └── quantumStore.ts     # Zustand global state
│       ├── utils/
│       │   ├── api.ts              # Axios API client
│       │   ├── circuitUtils.ts     # Code generation + parsing + gate metadata
│       │   └── localSimulator.ts   # Browser-side statevector simulator
│       ├── hooks/
│       │   └── useResizable.ts     # Panel drag-resize hook
│       └── pages/
│           ├── _app.tsx
│           └── index.tsx           # Main layout
│
└── backend/                    # FastAPI + Python
    ├── main.py                     # FastAPI app entry
    ├── requirements.txt
    ├── api/
    │   └── routes.py               # /simulate, /circuit-to-code, /code-to-circuit, /algorithms
    └── quantum/
        ├── simulator.py            # Qiskit Aer + NumPy fallback simulator
        ├── code_gen.py             # Circuit JSON → Qiskit Python
        └── code_parser.py          # Qiskit Python → circuit JSON
```

---

## Prerequisites

| Dependency | Version | Purpose |
|---|---|---|
| Node.js | 18+ | Frontend runtime |
| Python | 3.10+ | Backend (match statements) |
| pip | latest | Python packages |
| git | any | Clone repo |

---

## Installation

### 1. Clone the repository

```bash
git clone https://github.com/your-org/quantum-ide.git
cd quantum-ide
```

---

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate (macOS/Linux)
source venv/bin/activate

# Activate (Windows)
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

> **Note**: Qiskit and Qiskit-Aer can take a few minutes to install.

### 3. Start the backend

```bash
uvicorn main:app --reload --port 8000
```

Backend runs at: `http://localhost:8000`

API docs available at: `http://localhost:8000/docs`

---

### 4. Frontend Setup

```bash
cd ../frontend

# Install dependencies
npm install

# Copy environment config
cp .env.example .env.local
```

`.env.local` contents:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

### 5. Start the frontend

```bash
npm run dev
```

Frontend runs at: `http://localhost:3000`

---

## Usage

### Quick Start (60 seconds)

1. Open `http://localhost:3000`
2. Click **⚛ Algorithms** → select **Bell State** → it loads automatically
3. Click **▶ Run Simulation**
4. Watch the Bloch spheres update and probability bars animate

### Building a Circuit Manually

1. Drag a gate chip (e.g., **H**) from the palette onto any qubit wire slot
2. Continue adding gates — the Python code updates in real-time
3. Click **▶ Run Simulation**

### Code-First Workflow

1. Edit the Python code directly in the center editor
2. Click **↻ Sync to Circuit** — the circuit diagram updates
3. Click **▶ Run Simulation**

### Resizing Panels

Drag the thin dividers between panels to resize Circuit Builder / Code Editor / Visualization.

---

## API Reference

### `POST /api/v1/simulate`

Run a quantum circuit simulation.

```json
{
  "num_qubits": 2,
  "gates": [
    { "type": "H", "qubit": 0, "slot": 0 },
    { "type": "CNOT", "qubit": 1, "slot": 1, "control_qubit": 0 },
    { "type": "M", "qubit": 0, "slot": 2 },
    { "type": "M", "qubit": 1, "slot": 2 }
  ],
  "shots": 1024
}
```

Response:
```json
{
  "counts": { "00": 512, "11": 512 },
  "statevector": [[0.707, 0.0], [0.0, 0.0], [0.0, 0.0], [0.707, 0.0]],
  "probabilities": { "00": 0.5, "11": 0.5 },
  "bloch_vectors": [{ "x": 0.0, "y": 0.0, "z": 0.0 }, { "x": 0.0, "y": 0.0, "z": 0.0 }],
  "entropy": 1.0,
  "num_qubits": 2,
  "shots": 1024
}
```

### `POST /api/v1/circuit-to-code`

Convert circuit JSON to Qiskit Python code.

### `POST /api/v1/code-to-circuit`

Parse Qiskit Python code and extract circuit structure.

### `GET /api/v1/algorithms`

Return all preloaded algorithm definitions.

---

## Supported Gates

| Gate | Symbol | Description |
|---|---|---|
| Hadamard | H | Creates equal superposition |
| Pauli-X | X | Quantum NOT (bit flip) |
| Pauli-Y | Y | Combined bit + phase flip |
| Pauli-Z | Z | Phase flip (|1⟩ → -|1⟩) |
| S gate | S | π/2 phase shift |
| T gate | T | π/4 phase shift |
| CNOT | CX | Controlled NOT (entanglement) |
| SWAP | SW | Exchange two qubits |
| Rx(π/2) | Rx | Rotation around X-axis |
| Ry(π/4) | Ry | Rotation around Y-axis |
| Rz(π/4) | Rz | Rotation around Z-axis |
| Measure | M | Collapse to classical bit |

---

## Production Deployment

### Frontend (Vercel)

```bash
cd frontend
npm run build

# Deploy to Vercel
npx vercel --prod
```

Set environment variable in Vercel dashboard:
```
NEXT_PUBLIC_API_URL=https://your-backend.railway.app/api/v1
```

### Backend (Railway / Render / AWS)

**Railway:**
```bash
# In backend/
railway init
railway up
```

**Render:**
- Build command: `pip install -r requirements.txt`
- Start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`

**Docker:**
```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

---

## Offline Mode

QuantumIDE works **fully offline** without the backend. The frontend includes a complete statevector simulator written in TypeScript that runs in the browser. All gates, simulation, and visualization work without any network connection.

When the backend is available, it automatically uses Qiskit Aer for higher accuracy.

---

## Performance

| Operation | Target | Notes |
|---|---|---|
| Gate placement | < 16ms | Instant Zustand update |
| Code generation | < 5ms | Pure string ops |
| Local simulation (3q) | < 50ms | Browser JS |
| Qiskit simulation (3q) | < 500ms | Aer backend |
| Bloch sphere render | < 16ms | Canvas 2D |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14, React 18 |
| Language | TypeScript |
| State | Zustand 5 with Immer |
| Styling | Tailwind CSS + inline styles |
| Quantum | Qiskit 1.2, Qiskit-Aer 0.15 |
| Backend | FastAPI 0.115, Uvicorn |
| Visualization | HTML5 Canvas (custom) |
| HTTP | Axios |

---

## Future Roadmap

- [ ] Real-time multiplayer collaboration (WebSockets)
- [ ] Export circuits as QASM 3.0
- [ ] 3D Bloch sphere with Three.js
- [ ] Hardware backend integration (IBM Quantum)
- [ ] Post-Quantum Cryptography module
- [ ] Circuit depth optimizer
- [ ] Noise model simulation
- [ ] Custom gate definition

---

## License

MIT License. See `LICENSE` for details.

---

<div align="center">
Built to make quantum computing intuitive, fast, and beautiful.
</div>
