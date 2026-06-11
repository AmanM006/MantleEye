import os
import sys

# Add agent directory to sys path so we can import backtest
agent_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "agent")
sys.path.append(agent_dir)

from backtest import MantleBacktest

if __name__ == "__main__":
    backtest = MantleBacktest()
    backtest.run_backtest()
