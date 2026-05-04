"""
Parses Qiskit Python code and extracts circuit structure.
"""
import re
from typing import Dict, List, Any


class CodeParser:
    GATE_PATTERNS = [
        (r'qc\.h\((\d+)\)', 'H', 1),
        (r'qc\.x\((\d+)\)', 'X', 1),
        (r'qc\.y\((\d+)\)', 'Y', 1),
        (r'qc\.z\((\d+)\)', 'Z', 1),
        (r'qc\.s\((\d+)\)', 'S', 1),
        (r'qc\.t\((\d+)\)', 'T', 1),
        (r'qc\.cx\((\d+),\s*(\d+)\)', 'CNOT', 2),
        (r'qc\.swap\((\d+),\s*(\d+)\)', 'SWAP', 2),
        (r'qc\.rx\([^,]+,\s*(\d+)\)', 'RX(π/2)', 1),
        (r'qc\.ry\([^,]+,\s*(\d+)\)', 'RY(π/4)', 1),
        (r'qc\.rz\([^,]+,\s*(\d+)\)', 'RZ(π/4)', 1),
        (r'qc\.measure\((\d+),\s*\d+\)', 'M', 1),
    ]

    def parse(self, code: str) -> Dict:
        gates = []
        num_qubits = 3
        slot_counter = {}

        qr_match = re.search(r'QuantumRegister\((\d+)', code)
        if qr_match:
            num_qubits = int(qr_match.group(1))

        for line in code.split('\n'):
            line = line.strip()
            if not line or line.startswith('#'):
                continue

            for pattern, gate_type, arity in self.GATE_PATTERNS:
                m = re.search(pattern, line)
                if m:
                    if arity == 1:
                        qi = int(m.group(1))
                        slot = slot_counter.get(qi, 0)
                        slot_counter[qi] = slot + 1
                        gates.append({
                            "type": gate_type,
                            "qubit": qi,
                            "slot": slot,
                            "control_qubit": None
                        })
                    elif arity == 2:
                        ctrl, tgt = int(m.group(1)), int(m.group(2))
                        slot = max(slot_counter.get(ctrl, 0), slot_counter.get(tgt, 0))
                        slot_counter[ctrl] = slot + 1
                        slot_counter[tgt] = slot + 1
                        gates.append({
                            "type": gate_type,
                            "qubit": tgt,
                            "slot": slot,
                            "control_qubit": ctrl
                        })
                    break

        return {
            "num_qubits": num_qubits,
            "gates": gates,
            "parsed_lines": len([l for l in code.split('\n') if l.strip()])
        }
