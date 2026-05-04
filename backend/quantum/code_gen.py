"""
Generates clean, documented Qiskit Python code from circuit JSON.
"""
import math
from typing import List, Any


class CodeGenerator:
    def generate(self, num_qubits: int, gates: List[Any]) -> str:
        lines = [
            "from qiskit import QuantumCircuit, QuantumRegister, ClassicalRegister",
            "from qiskit_aer import AerSimulator",
            "import numpy as np",
            "",
            f"# Initialize {num_qubits}-qubit circuit",
            f"qr = QuantumRegister({num_qubits}, 'q')",
            f"cr = ClassicalRegister({num_qubits}, 'c')",
            f"qc = QuantumCircuit(qr, cr)",
            "",
            "# Apply gates",
        ]

        sorted_gates = sorted(gates, key=lambda g: (g.slot, g.qubit))
        current_slot = -1

        for gate in sorted_gates:
            if gate.slot != current_slot:
                if current_slot >= 0:
                    lines.append("")
                current_slot = gate.slot
                lines.append(f"# Slot {gate.slot}")

            qi = gate.qubit
            ctrl = gate.control_qubit

            match gate.type:
                case 'H': lines.append(f"qc.h({qi})")
                case 'X': lines.append(f"qc.x({qi})")
                case 'Y': lines.append(f"qc.y({qi})")
                case 'Z': lines.append(f"qc.z({qi})")
                case 'S': lines.append(f"qc.s({qi})")
                case 'T': lines.append(f"qc.t({qi})")
                case 'CNOT' | 'CX':
                    c = ctrl if ctrl is not None else max(0, qi - 1)
                    lines.append(f"qc.cx({c}, {qi})")
                case 'SWAP':
                    c = ctrl if ctrl is not None else max(0, qi - 1)
                    lines.append(f"qc.swap({c}, {qi})")
                case 'RX(π/2)' | 'RX':
                    lines.append(f"qc.rx(np.pi / 2, {qi})")
                case 'RY(π/4)' | 'RY':
                    lines.append(f"qc.ry(np.pi / 4, {qi})")
                case 'RY(π/8)':
                    lines.append(f"qc.ry(np.pi / 8, {qi})")
                case 'RZ(π/4)' | 'RZ':
                    lines.append(f"qc.rz(np.pi / 4, {qi})")
                case 'RZ(π/8)':
                    lines.append(f"qc.rz(np.pi / 8, {qi})")
                case 'M':
                    lines.append(f"qc.measure({qi}, {qi})")

        has_measure = any(g.type == 'M' for g in gates)
        if not has_measure:
            lines.extend(["", "# Measure all qubits", "qc.measure_all()"])

        lines.extend([
            "",
            "# Run simulation",
            "simulator = AerSimulator()",
            "job = simulator.run(qc, shots=1024)",
            "result = job.result()",
            "counts = result.get_counts(qc)",
            "",
            "print('Measurement results:')",
            "for state, count in sorted(counts.items(), key=lambda x: -x[1]):",
            "    prob = count / 1024 * 100",
            f"    print(f'  |{{state}}⟩: {{count}} shots ({{prob:.1f}}%)')",
        ])

        return "\n".join(lines)
