
class BaseAgent:
    def run(self, state: dict) -> dict:
        raise NotImplementedError("runメソッドを実装してください。")
