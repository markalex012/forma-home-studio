import importlib.util
import unittest
from pathlib import Path
spec = importlib.util.spec_from_file_location("checker", Path(__file__).parents[1] / "scripts/check_catalog.py")
checker = importlib.util.module_from_spec(spec)
spec.loader.exec_module(checker)
class SourceAvailabilityTest(unittest.TestCase):
    def test_requires_three_confirmed_missing_results(self):
        state = {"status": "available"}
        for i in range(2):
            state = checker.next_state(state, "missing", "today")
            self.assertEqual("available", state["status"])
        self.assertEqual("unavailable", checker.next_state(state, "missing", "today")["status"])
    def test_network_failure_never_hides_available_video(self):
        state = checker.next_state({"status": "available", "failureStreak": 2}, "unknown", "today")
        self.assertEqual("available", state["status"])
        self.assertEqual(0, state["failureStreak"])
    def test_recovered_video_returns_to_catalog(self):
        state = checker.next_state({"status": "unavailable", "failureStreak": 9}, "available", "today")
        self.assertEqual("available", state["status"])
        self.assertEqual(0, state["failureStreak"])
    def test_unknown_keeps_previously_confirmed_hidden_video(self):
        state = checker.next_state({"status": "unavailable"}, "unknown", "today")
        self.assertEqual("unavailable", state["status"])
if __name__ == "__main__":
    unittest.main()
