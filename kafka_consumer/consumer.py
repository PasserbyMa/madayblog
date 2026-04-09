"""
Kafka nginx-logs consumer → MongoDB visitor_stats
- nginx-logs 토픽 구독
- 봇/공격 트래픽 필터링
- MongoDB visitor_stats 컬렉션에 저장
"""

import json
import os
import re
import time
from datetime import datetime, timezone

from kafka import KafkaConsumer
from pymongo import MongoClient, ASCENDING
from pymongo.errors import ConnectionFailure

# ── 환경변수 ──────────────────────────────────────────
KAFKA_BOOTSTRAP   = os.getenv("KAFKA_BOOTSTRAP", "mablog_kafka:9092")
KAFKA_TOPIC       = os.getenv("KAFKA_TOPIC", "nginx-logs")
KAFKA_GROUP_ID    = os.getenv("KAFKA_GROUP_ID", "visitor-stats-consumer")
MONGO_URI         = os.getenv("MONGO_URI", "mongodb://mongoAdmin:mongoA96547852!@db:27017/maBlog_DataTable?authSource=admin")
MONGO_DB          = os.getenv("MONGO_DB", "maBlog_DataTable")
MONGO_COLLECTION  = os.getenv("MONGO_COLLECTION", "visitor_stats")

# ── 봇/공격 필터 ─────────────────────────────────────
# 공격성 경로 패턴
BOT_PATH_PATTERNS = re.compile(
    r"(/cgi-bin|/admin|/wp-|/php|/\.env|/shell|/bin/sh|/etc/passwd"
    r"|/config\.php|/setup\.php|/install\.php|/xmlrpc\.php"
    r"|/ping\.cgi|/manager/|/solr|/actuator|/.git/|/backup)",
    re.IGNORECASE,
)

# 봇 User-Agent 패턴
BOT_UA_PATTERNS = re.compile(
    r"(zgrab|masscan|r00ts3c|sqlmap|nikto|nmap|dirbuster|scanner"
    r"|python-requests|go-http-client|curl|wget|libwww"
    r"|palo alto|censys|shodan|qualys|nessus|nuclei|dataforseo"
    r"|semrush|ahrefs|mj12bot|dotbot|petalbot|bingpreview)",
    re.IGNORECASE,
)

# UA가 아예 없거나 단순 식별자인 경우도 봇으로 처리
BOT_EMPTY_UA = re.compile(r"^(-|node|python|go|java|ruby|php)$", re.IGNORECASE)

# 정적 자산 경로 (저장은 하되 방문자 카운트에서 제외할 때 사용)
STATIC_PATH = re.compile(r"\.(css|js|ico|png|jpg|jpeg|gif|svg|woff|woff2|ttf|map)(\?.*)?$", re.IGNORECASE)


def is_bot(record: dict) -> bool:
    path       = record.get("path", "")
    ua         = record.get("user_agent", "") or ""
    status     = record.get("status", 200)
    method     = record.get("method", "GET")

    # 400 Bad Request = 대부분 봇
    if status == 400:
        return True
    # 악성 경로
    if BOT_PATH_PATTERNS.search(path):
        return True
    # UA 없음 또는 단순 식별자
    if BOT_EMPTY_UA.match(ua.strip()):
        return True
    # 봇 UA
    if BOT_UA_PATTERNS.search(ua):
        return True
    # 비정상 메서드 (CONNECT, TRACE 등)
    if method not in ("GET", "POST", "PUT", "DELETE", "PATCH", "HEAD", "OPTIONS"):
        return True

    return False


def parse_timestamp(ts_str: str) -> datetime:
    try:
        # "2026-04-06T02:30:09.000Z" 형태
        return datetime.fromisoformat(ts_str.replace("Z", "+00:00"))
    except Exception:
        return datetime.now(timezone.utc)


def setup_indexes(collection):
    """성능을 위한 인덱스 생성"""
    collection.create_index([("client_ip", ASCENDING)], background=True)
    # 30일 지난 데이터 자동 삭제 (TTL 인덱스)
    # 기존 timestamp 인덱스가 있으면 삭제 후 TTL 버전으로 재생성
    try:
        collection.drop_index("timestamp_1")
    except Exception:
        pass
    try:
        collection.create_index(
            [("timestamp", ASCENDING)],
            expireAfterSeconds=30 * 24 * 3600,
            name="ttl_30days",
            background=True,
        )
    except Exception as e:
        print(f"[Index] TTL index warning: {e}", flush=True)


def connect_mongo():
    while True:
        try:
            client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)
            client.admin.command("ping")
            print("[MongoDB] Connected", flush=True)
            return client
        except ConnectionFailure as e:
            print(f"[MongoDB] Connection failed: {e} — retrying in 5s", flush=True)
            time.sleep(5)


def connect_kafka():
    while True:
        try:
            consumer = KafkaConsumer(
                KAFKA_TOPIC,
                bootstrap_servers=KAFKA_BOOTSTRAP,
                group_id=KAFKA_GROUP_ID,
                auto_offset_reset="earliest",       # 처음 실행 시 처음부터 읽기
                enable_auto_commit=True,
                value_deserializer=lambda v: json.loads(v.decode("utf-8")),
                consumer_timeout_ms=1000,
            )
            print(f"[Kafka] Connected to {KAFKA_BOOTSTRAP}, topic={KAFKA_TOPIC}", flush=True)
            return consumer
        except Exception as e:
            print(f"[Kafka] Connection failed: {e} — retrying in 5s", flush=True)
            time.sleep(5)


def main():
    mongo_client = connect_mongo()
    db           = mongo_client[MONGO_DB]
    collection   = db[MONGO_COLLECTION]
    setup_indexes(collection)

    print("[Consumer] Starting...", flush=True)

    while True:
        consumer = connect_kafka()
        try:
            for message in consumer:
                record = message.value
                if not isinstance(record, dict):
                    continue

                # 봇/공격 필터
                if is_bot(record):
                    continue

                # 저장할 도큐먼트 구성
                doc = {
                    "client_ip":    record.get("client_ip", "-"),
                    "status":       int(record.get("status", 0)),
                    "status_category": record.get("status_category", "unknown"),
                    "method":       record.get("method", "-"),
                    "path":         record.get("path", "/"),
                    "bytes":        int(record.get("bytes", 0)),
                    "response_time": float(record.get("response_time", 0)),
                    "user_agent":   record.get("user_agent", "-"),
                    "timestamp":    parse_timestamp(record.get("@timestamp", "")),
                    "is_static":    bool(STATIC_PATH.search(record.get("path", ""))),
                }

                collection.insert_one(doc)

        except Exception as e:
            print(f"[Consumer] Error: {e} — reconnecting", flush=True)
            time.sleep(3)
        finally:
            try:
                consumer.close()
            except Exception:
                pass


if __name__ == "__main__":
    main()
