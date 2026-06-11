import os
import sys
import logging
from dotenv import load_dotenv

# Ensure agent directory is in path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Load environment
load_dotenv(os.path.join(os.path.dirname(__file__), "config", ".env"))
load_dotenv() # Fallback to workspace root .env

from watcher import MantleWatcher
from brain import MantleBrain
from executor import MantleExecutor

# Configure Logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("mantleye-agent")

def main():
    logger.info("Initializing MANTLEYE Autonomous Agent Network...")
    
    # 1. Initialize core modules
    watcher = MantleWatcher()
    brain = MantleBrain()
    executor = MantleExecutor()
    
    # 2. Define handler for detected anomalies
    def handle_detected_event(event):
        try:
            logger.info(f"🧠 Processing event via brain: {event['event_type']}")
            
            # Step 1: Classify event using LLM/Mock
            classification = brain.classify_event(event)
            classification["asset"] = event["details"].get("asset", "mETH / MOE Pool")
            
            # Step 2: Risk and position check
            passed, reason = brain.check_risk_and_limits(classification)
            if not passed:
                logger.warning(f"⚠️ Event risk check rejected: {reason}")
                return
                
            logger.info(f"✅ Risk check passed. Preparing on-chain commit hash...")
            
            # Step 3: Compute commit hash payload
            commit_hash, nonce, signal_type, confidence = brain.compute_commit_payload(
                classification["reasoning"],
                classification["tradeIntent"],
                classification["signalType"],
                classification["confidence"]
            )
            
            # Step 4: Execute on-chain DEX rebalance, CEX hedge, on-chain reveal, and trade logs
            executor.execute_and_log(
                classification,
                commit_hash,
                nonce,
                signal_type,
                confidence,
                event.get("nansen_label")
            )
            
        except Exception as e:
            logger.error(f"Error handling event: {e}", exc_info=True)

    # 3. Start watching (simulated or real based on connection)
    if watcher.is_connected:
        watcher.start_real_stream(handle_detected_event)
    else:
        watcher.start_simulated_stream(handle_detected_event)

if __name__ == "__main__":
    main()
