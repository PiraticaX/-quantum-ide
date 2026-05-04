from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from quantum.simulator import QuantumSimulator
from quantum.code_gen import CodeGenerator
from quantum.code_parser import CodeParser

router = APIRouter()
simulator = QuantumSimulator()
code_gen = CodeGenerator()
code_parser = CodeParser()


class Gate(BaseModel):
    type: str
    qubit: int
    slot: int
    control_qubit: Optional[int] = None
    angle: Optional[float] = None


class CircuitPayload(BaseModel):
    num_qubits: int
    gates: List[Gate]
    shots: Optional[int] = 1024


class CodePayload(BaseModel):
    code: str


class SimulationResult(BaseModel):
    counts: Dict[str, int]
    statevector: List[List[float]]
    probabilities: Dict[str, float]
    bloch_vectors: List[Dict[str, float]]
    entropy: float
    num_qubits: int
    shots: int


@router.post("/simulate", response_model=SimulationResult)
async def simulate_circuit(payload: CircuitPayload):
    """Run quantum circuit simulation using Qiskit Aer."""
    try:
        result = simulator.run(
            num_qubits=payload.num_qubits,
            gates=payload.gates,
            shots=payload.shots or 1024
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Simulation failed: {str(e)}")


@router.post("/circuit-to-code")
async def circuit_to_code(payload: CircuitPayload):
    """Convert circuit JSON to Qiskit Python code."""
    try:
        code = code_gen.generate(
            num_qubits=payload.num_qubits,
            gates=payload.gates
        )
        return {"code": code, "language": "python", "framework": "qiskit"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Code generation failed: {str(e)}")


@router.post("/code-to-circuit")
async def code_to_circuit(payload: CodePayload):
    """Parse Qiskit Python code and extract circuit structure."""
    try:
        circuit = code_parser.parse(payload.code)
        return circuit
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Code parsing failed: {str(e)}")


@router.get("/algorithms")
async def get_algorithms():
    """Return all preloaded quantum algorithm circuits."""
    return {
        "algorithms": [
            {
                "id": "bell_state",
                "name": "Bell State",
                "description": "Creates maximal entanglement between 2 qubits",
                "qubits": 2,
                "category": "Fundamental",
                "gates": [
                    {"type": "H", "qubit": 0, "slot": 0},
                    {"type": "CNOT", "qubit": 1, "slot": 1, "control_qubit": 0},
                    {"type": "M", "qubit": 0, "slot": 2},
                    {"type": "M", "qubit": 1, "slot": 2},
                ]
            },
            {
                "id": "grover",
                "name": "Grover's Algorithm",
                "description": "Quantum search providing quadratic speedup",
                "qubits": 3,
                "category": "Search",
                "gates": [
                    {"type": "H", "qubit": 0, "slot": 0},
                    {"type": "H", "qubit": 1, "slot": 0},
                    {"type": "H", "qubit": 2, "slot": 0},
                    {"type": "X", "qubit": 2, "slot": 1},
                    {"type": "H", "qubit": 2, "slot": 2},
                    {"type": "CNOT", "qubit": 2, "slot": 3, "control_qubit": 0},
                    {"type": "CNOT", "qubit": 2, "slot": 4, "control_qubit": 1},
                    {"type": "H", "qubit": 2, "slot": 5},
                    {"type": "H", "qubit": 0, "slot": 6},
                    {"type": "H", "qubit": 1, "slot": 6},
                    {"type": "M", "qubit": 0, "slot": 7},
                    {"type": "M", "qubit": 1, "slot": 7},
                    {"type": "M", "qubit": 2, "slot": 7},
                ]
            },
            {
                "id": "qft",
                "name": "Quantum Fourier Transform",
                "description": "Discrete Fourier transform on quantum amplitudes",
                "qubits": 3,
                "category": "Transform",
                "gates": [
                    {"type": "H", "qubit": 0, "slot": 0},
                    {"type": "RZ(π/4)", "qubit": 0, "slot": 1},
                    {"type": "RZ(π/8)", "qubit": 0, "slot": 2},
                    {"type": "H", "qubit": 1, "slot": 3},
                    {"type": "RZ(π/4)", "qubit": 1, "slot": 4},
                    {"type": "H", "qubit": 2, "slot": 5},
                    {"type": "SWAP", "qubit": 0, "slot": 6, "control_qubit": 2},
                    {"type": "M", "qubit": 0, "slot": 7},
                    {"type": "M", "qubit": 1, "slot": 7},
                    {"type": "M", "qubit": 2, "slot": 7},
                ]
            },
            {
                "id": "teleportation",
                "name": "Quantum Teleportation",
                "description": "Transfer quantum state using entanglement + classical bits",
                "qubits": 3,
                "category": "Communication",
                "gates": [
                    {"type": "H", "qubit": 1, "slot": 0},
                    {"type": "CNOT", "qubit": 2, "slot": 1, "control_qubit": 1},
                    {"type": "CNOT", "qubit": 1, "slot": 2, "control_qubit": 0},
                    {"type": "H", "qubit": 0, "slot": 3},
                    {"type": "M", "qubit": 0, "slot": 4},
                    {"type": "M", "qubit": 1, "slot": 4},
                    {"type": "X", "qubit": 2, "slot": 5},
                    {"type": "Z", "qubit": 2, "slot": 6},
                    {"type": "M", "qubit": 2, "slot": 7},
                ]
            },
            {
                "id": "vqe",
                "name": "VQE Ansatz",
                "description": "Variational Quantum Eigensolver hardware-efficient ansatz",
                "qubits": 4,
                "category": "Optimization",
                "gates": [
                    {"type": "RY(π/4)", "qubit": 0, "slot": 0},
                    {"type": "RY(π/4)", "qubit": 1, "slot": 0},
                    {"type": "RY(π/4)", "qubit": 2, "slot": 0},
                    {"type": "RY(π/4)", "qubit": 3, "slot": 0},
                    {"type": "CNOT", "qubit": 1, "slot": 1, "control_qubit": 0},
                    {"type": "CNOT", "qubit": 2, "slot": 2, "control_qubit": 1},
                    {"type": "CNOT", "qubit": 3, "slot": 3, "control_qubit": 2},
                    {"type": "RY(π/8)", "qubit": 0, "slot": 4},
                    {"type": "RY(π/8)", "qubit": 1, "slot": 4},
                    {"type": "RY(π/8)", "qubit": 2, "slot": 4},
                    {"type": "RY(π/8)", "qubit": 3, "slot": 4},
                    {"type": "M", "qubit": 0, "slot": 5},
                    {"type": "M", "qubit": 1, "slot": 5},
                    {"type": "M", "qubit": 2, "slot": 5},
                    {"type": "M", "qubit": 3, "slot": 5},
                ]
            },
            {
                "id": "bernstein_vazirani",
                "name": "Bernstein-Vazirani",
                "description": "Find hidden bit string in single query",
                "qubits": 4,
                "category": "Oracle",
                "gates": [
                    {"type": "X", "qubit": 3, "slot": 0},
                    {"type": "H", "qubit": 0, "slot": 1},
                    {"type": "H", "qubit": 1, "slot": 1},
                    {"type": "H", "qubit": 2, "slot": 1},
                    {"type": "H", "qubit": 3, "slot": 1},
                    {"type": "CNOT", "qubit": 3, "slot": 2, "control_qubit": 0},
                    {"type": "CNOT", "qubit": 3, "slot": 3, "control_qubit": 2},
                    {"type": "H", "qubit": 0, "slot": 4},
                    {"type": "H", "qubit": 1, "slot": 4},
                    {"type": "H", "qubit": 2, "slot": 4},
                    {"type": "M", "qubit": 0, "slot": 5},
                    {"type": "M", "qubit": 1, "slot": 5},
                    {"type": "M", "qubit": 2, "slot": 5},
                ]
            }
        ]
    }
