"""
Resonance Codex 3.1.3 - Core Module
Cleaned implementation with sample data support.
"""

def digital_root(n: int) -> int:
    """Calculate digital root of a number."""
    if n == 0:
        return 0
    return 1 + (n - 1) % 9

def resonance_score(freq: float, amp: float) -> float:
    """Simple resonance scoring based on frequency and amplitude."""
    return freq * amp * (1 / 9)  # normalized to digital root cycle

# Sample usage
if __name__ == "__main__":
    print("Resonance Codex 3.1.3 - Core")
    print(f"Digital root of 369: {digital_root(369)}")
