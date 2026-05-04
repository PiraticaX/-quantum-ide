"""
Quantum Circuit Simulator using Qiskit Aer.
Handles statevector simulation, shot-based measurement, and Bloch vector extraction.
"""
import numpy as np
from typing import List, Dict, Any, Optional
import math


class QuantumSimulator:
    """
    High-performance quantum circuit simulator.
    Uses Qiskit Aer for accurate quantum simulation when available,
    falls back to a pure-NumPy statevector engine otherwise.
    """

    def __init__(self):
        self._qiskit_available = self._check_qiskit()

    def _check_qiskit(self) -> bool:
        try:
            from qiskit import QuantumCircuit
            from qiskit_aer import AerSimulator
            return True
        except ImportError:
            return False

    def run(self, num_qubits: int, gates: List[Any], shots: int = 1024) -> Dict:
        if self._qiskit_available:
            return self._run_qiskit(num_qubits, gates, shots)
        return self._run_numpy(num_qubits, gates, shots)

    def _run_qiskit(self, num_qubits: int, gates: List[Any], shots: int) -> Dict:
        from qiskit import QuantumCircuit, QuantumRegister, ClassicalRegister
        from qiskit_aer import AerSimulator
        from qiskit_aer.primitives import Sampler

        qr = QuantumRegister(num_qubits, 'q')
        cr = ClassicalRegister(num_qubits, 'c')
        qc = QuantumCircuit(qr, cr)

        has_measure = False
        sorted_gates = sorted(gates, key=lambda g: g.slot)

        for gate in sorted_gates:
            qi = gate.qubit
            ctrl = gate.control_qubit
            angle = gate.angle or math.pi / 2

            match gate.type:
                case 'H': qc.h(qi)
                case 'X': qc.x(qi)
                case 'Y': qc.y(qi)
                case 'Z': qc.z(qi)
                case 'S': qc.s(qi)
                case 'T': qc.t(qi)
                case 'CNOT' | 'CX': qc.cx(ctrl if ctrl is not None else max(0, qi-1), qi)
                case 'SWAP': qc.swap(ctrl if ctrl is not None else max(0, qi-1), qi)
                case 'RX(π/2)' | 'RX': qc.rx(math.pi / 2, qi)
                case 'RY(π/4)' | 'RY': qc.ry(math.pi / 4, qi)
                case 'RY(π/8)': qc.ry(math.pi / 8, qi)
                case 'RZ(π/4)' | 'RZ': qc.rz(math.pi / 4, qi)
                case 'RZ(π/8)': qc.rz(math.pi / 8, qi)
                case 'M':
                    qc.measure(qi, qi)
                    has_measure = True

        if not has_measure:
            qc.measure_all()

        # Statevector simulation (no measurements)
        sv_qc = QuantumCircuit(num_qubits)
        for gate in sorted_gates:
            qi = gate.qubit
            ctrl = gate.control_qubit
            if gate.type == 'M':
                continue
            match gate.type:
                case 'H': sv_qc.h(qi)
                case 'X': sv_qc.x(qi)
                case 'Y': sv_qc.y(qi)
                case 'Z': sv_qc.z(qi)
                case 'S': sv_qc.s(qi)
                case 'T': sv_qc.t(qi)
                case 'CNOT' | 'CX': sv_qc.cx(ctrl if ctrl is not None else max(0, qi-1), qi)
                case 'SWAP': sv_qc.swap(ctrl if ctrl is not None else max(0, qi-1), qi)
                case 'RX(π/2)' | 'RX': sv_qc.rx(math.pi/2, qi)
                case 'RY(π/4)' | 'RY': sv_qc.ry(math.pi/4, qi)
                case 'RY(π/8)': sv_qc.ry(math.pi/8, qi)
                case 'RZ(π/4)' | 'RZ': sv_qc.rz(math.pi/4, qi)
                case 'RZ(π/8)': sv_qc.rz(math.pi/8, qi)

        sv_qc.save_statevector()
        sim = AerSimulator(method='statevector')
        sv_job = sim.run(sv_qc)
        sv_result = sv_job.result()
        statevec = sv_result.get_statevector()

        # Shot simulation
        shot_sim = AerSimulator()
        shot_job = shot_sim.run(qc, shots=shots)
        shot_result = shot_job.result()
        counts = dict(shot_result.get_counts())

        sv_list = [[float(a.real), float(a.imag)] for a in statevec]
        probs = {k: v / shots for k, v in counts.items()}
        bloch = [self._bloch_from_statevec(statevec, qi, num_qubits) for qi in range(num_qubits)]
        entropy = self._von_neumann_entropy(probs)

        return {
            "counts": counts,
            "statevector": sv_list,
            "probabilities": probs,
            "bloch_vectors": bloch,
            "entropy": entropy,
            "num_qubits": num_qubits,
            "shots": shots
        }

    def _run_numpy(self, num_qubits: int, gates: List[Any], shots: int) -> Dict:
        """Pure NumPy fallback simulator."""
        dim = 1 << num_qubits
        sv = np.zeros(dim, dtype=complex)
        sv[0] = 1.0

        I = np.eye(2, dtype=complex)
        H = np.array([[1, 1], [1, -1]], dtype=complex) / np.sqrt(2)
        X = np.array([[0, 1], [1, 0]], dtype=complex)
        Y = np.array([[0, -1j], [1j, 0]], dtype=complex)
        Z = np.array([[1, 0], [0, -1]], dtype=complex)
        S = np.array([[1, 0], [0, 1j]], dtype=complex)
        T = np.array([[1, 0], [0, np.exp(1j * np.pi / 4)]], dtype=complex)

        def rx(theta): return np.array([[np.cos(theta/2), -1j*np.sin(theta/2)],
                                        [-1j*np.sin(theta/2), np.cos(theta/2)]], dtype=complex)
        def ry(theta): return np.array([[np.cos(theta/2), -np.sin(theta/2)],
                                        [np.sin(theta/2), np.cos(theta/2)]], dtype=complex)
        def rz(theta): return np.array([[np.exp(-1j*theta/2), 0],
                                        [0, np.exp(1j*theta/2)]], dtype=complex)

        def apply_single(sv, gate_mat, qubit, n):
            ops = [I] * n
            ops[qubit] = gate_mat
            full = ops[0]
            for op in ops[1:]:
                full = np.kron(full, op)
            return full @ sv

        def apply_cnot(sv, ctrl, tgt, n):
            result = sv.copy()
            for b in range(1 << n):
                if (b >> (n-1-ctrl)) & 1:
                    flipped = b ^ (1 << (n-1-tgt))
                    result[flipped] = sv[b]
                    result[b] = sv[flipped]
            return result

        sorted_gates = sorted(gates, key=lambda g: g.slot)
        for gate in sorted_gates:
            qi = gate.qubit
            ctrl = gate.control_qubit
            if gate.type == 'M':
                continue
            actual_qi = num_qubits - 1 - qi
            match gate.type:
                case 'H': sv = apply_single(sv, H, actual_qi, num_qubits)
                case 'X': sv = apply_single(sv, X, actual_qi, num_qubits)
                case 'Y': sv = apply_single(sv, Y, actual_qi, num_qubits)
                case 'Z': sv = apply_single(sv, Z, actual_qi, num_qubits)
                case 'S': sv = apply_single(sv, S, actual_qi, num_qubits)
                case 'T': sv = apply_single(sv, T, actual_qi, num_qubits)
                case 'RX(π/2)' | 'RX': sv = apply_single(sv, rx(np.pi/2), actual_qi, num_qubits)
                case 'RY(π/4)' | 'RY': sv = apply_single(sv, ry(np.pi/4), actual_qi, num_qubits)
                case 'RY(π/8)': sv = apply_single(sv, ry(np.pi/8), actual_qi, num_qubits)
                case 'RZ(π/4)' | 'RZ': sv = apply_single(sv, rz(np.pi/4), actual_qi, num_qubits)
                case 'CNOT' | 'CX':
                    c = ctrl if ctrl is not None else max(0, qi-1)
                    sv = apply_cnot(sv, c, qi, num_qubits)

        probs_arr = np.abs(sv) ** 2
        samples = np.random.choice(dim, size=shots, p=probs_arr / probs_arr.sum())
        counts = {}
        for s in samples:
            key = format(s, f'0{num_qubits}b')
            counts[key] = counts.get(key, 0) + 1

        sv_list = [[float(a.real), float(a.imag)] for a in sv]
        probs = {k: v / shots for k, v in counts.items()}
        bloch = [self._bloch_numpy(sv, qi, num_qubits) for qi in range(num_qubits)]
        entropy = self._von_neumann_entropy(probs)

        return {
            "counts": counts,
            "statevector": sv_list,
            "probabilities": probs,
            "bloch_vectors": bloch,
            "entropy": entropy,
            "num_qubits": num_qubits,
            "shots": shots
        }

    def _bloch_from_statevec(self, statevec, qubit: int, n: int) -> Dict[str, float]:
        """Compute Bloch vector for a single qubit by partial trace."""
        dim = 1 << n
        rho = np.zeros((2, 2), dtype=complex)
        for b in range(dim):
            bit = (b >> (n - 1 - qubit)) & 1
            partner = b ^ (1 << (n - 1 - qubit))
            rho[bit, bit] += abs(statevec[b]) ** 2
            if partner < b:
                continue
            other_bit = 1 - bit
            rho[bit, other_bit] += statevec[b] * np.conj(statevec[partner])
        x = float(2 * rho[0, 1].real)
        y = float(2 * rho[0, 1].imag)
        z = float((rho[0, 0] - rho[1, 1]).real)
        return {"x": x, "y": y, "z": z}

    def _bloch_numpy(self, sv, qubit: int, n: int) -> Dict[str, float]:
        dim = 1 << n
        rx, ry, rz = 0.0, 0.0, 0.0
        for b in range(dim):
            bit = (b >> qubit) & 1
            partner = b ^ (1 << qubit)
            if bit == 0 and partner < dim:
                a0, a1 = sv[b], sv[partner]
                p0, p1 = abs(a0)**2, abs(a1)**2
                rz += p0 - p1
                rx += 2 * (a0.real * a1.real + a0.imag * a1.imag)
                ry += 2 * (a0.imag * a1.real - a0.real * a1.imag)
        return {"x": float(rx), "y": float(ry), "z": float(rz)}

    def _von_neumann_entropy(self, probs: Dict) -> float:
        entropy = 0.0
        for p in probs.values():
            if p > 1e-10:
                entropy -= p * math.log2(p)
        return round(entropy, 4)
