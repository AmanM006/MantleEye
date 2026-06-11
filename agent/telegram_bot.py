import os
import requests
import logging

logger = logging.getLogger("mantleye-telegram")

class TelegramAlertBot:
    def __init__(self, token=None, chat_id=None):
        self.token = token or os.getenv("TELEGRAM_BOT_TOKEN")
        self.chat_id = chat_id or os.getenv("TELEGRAM_CHAT_ID")
        self.is_mock = not self.token or self.token == "your_token" or not self.chat_id or self.chat_id == "your_channel_id"

    def send_message(self, text):
        if self.is_mock:
            logger.info(f"[TELEGRAM MOCK ALERT]\n{text}\n")
            return True
        try:
            url = f"https://api.telegram.org/bot{self.token}/sendMessage"
            response = requests.post(url, json={
                "chat_id": self.chat_id,
                "text": text,
                "parse_mode": "HTML"
            }, timeout=10)
            if response.status_code == 200:
                logger.info("Telegram notification sent successfully.")
                return True
            else:
                logger.error(f"Telegram API error: {response.status_code} - {response.text}")
                return False
        except Exception as e:
            logger.error(f"Failed to send Telegram notification: {e}")
            return False

    def alert_signal(self, signal_type, asset, confidence, label, trade_intent, commit_tx_hash, estimated_pnl="+0.0%"):
        label_text = f"\n<b>Nansen Label:</b> {label}" if label else ""
        explorer_link = f"https://sepolia.mantlescan.xyz/tx/{commit_tx_hash}"
        
        text = (
            f"🔴 <b>MANTLEYE ALERT</b>\n"
            f"<b>Signal:</b> {signal_type.upper()}\n"
            f"<b>Asset:</b> {asset}\n"
            f"<b>Confidence:</b> {confidence}%\n"
            f"<b>Action:</b> {trade_intent}{label_text}\n"
            f"<b>Commit Proof:</b> <a href='{explorer_link}'>Mantle Explorer</a>\n"
            f"<b>PnL Impact:</b> {estimated_pnl}"
        )
        return self.send_message(text)

    def alert_execution(self, on_chain_tx, bybit_order_id, reveal_tx):
        on_chain_link = f"https://sepolia.mantlescan.xyz/tx/{on_chain_tx}" if on_chain_tx else "N/A"
        reveal_link = f"https://sepolia.mantlescan.xyz/tx/{reveal_tx}" if reveal_tx else "N/A"
        
        text = (
            f"✅ <b>MANTLEYE EXECUTED</b>\n"
            f"<b>On-Chain:</b> <a href='{on_chain_link}'>Explorer Link</a>\n"
            f"<b>Bybit Hedge:</b> {bybit_order_id if bybit_order_id else 'N/A'}\n"
            f"<b>Reveal Proof:</b> <a href='{reveal_link}'>Reveal Tx Link</a>"
        )
        return self.send_message(text)
