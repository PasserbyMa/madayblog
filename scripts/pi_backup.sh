#!/bin/bash
# ================================================================
# Ma_Blog - Raspberry Pi 백업 & 상태 전송 스크립트
# 위치: ~/backup/pi_backup.sh
# 실행: crontab -e → 0 * * * * /home/pi/backup/pi_backup.sh
# ================================================================

# ── 설정 (환경에 맞게 수정) ──────────────────────────────────────
MONGO_URI="mongodb+srv://..."          # 블로그 MongoDB 연결 문자열
BLOG_URL="https://your-blog.com"       # 블로그 도메인
API_KEY="your-internal-api-key"        # INTERNAL_API_KEY 값
BACKUP_BASE="/home/pi/backups"         # 백업 저장 폴더
KEEP_DAYS=7                            # 백업 보관 일수
# ────────────────────────────────────────────────────────────────

mkdir -p "$BACKUP_BASE"

# ── 1. mongodump 백업 ────────────────────────────────────────────
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="$BACKUP_BASE/$TIMESTAMP"

mongodump --uri="$MONGO_URI" --out="$BACKUP_DIR" --quiet 2>/dev/null
DUMP_EXIT=$?

if [ $DUMP_EXIT -ne 0 ]; then
    BACKUP_SIZE="ERROR"
    BACKUP_TIME=$(date -u +%Y-%m-%dT%H:%M:%SZ)
else
    BACKUP_SIZE=$(du -sh "$BACKUP_DIR" 2>/dev/null | cut -f1)
    BACKUP_TIME=$(date -u +%Y-%m-%dT%H:%M:%SZ)
fi

# ── 2. 오래된 백업 삭제 ──────────────────────────────────────────
find "$BACKUP_BASE" -maxdepth 1 -type d -mtime +$KEEP_DAYS -exec rm -rf {} + 2>/dev/null

# ── 3. 백업 개수 ─────────────────────────────────────────────────
BACKUP_COUNT=$(find "$BACKUP_BASE" -maxdepth 1 -type d | grep -v "^$BACKUP_BASE$" | wc -l)

# ── 4. 디스크 정보 ───────────────────────────────────────────────
DISK_TOTAL=$(df -h "$BACKUP_BASE"  | awk 'NR==2{print $2}')
DISK_USED=$(df -h "$BACKUP_BASE"   | awk 'NR==2{print $3}')
DISK_AVAIL=$(df -h "$BACKUP_BASE"  | awk 'NR==2{print $4}')
DISK_PERCENT=$(df "$BACKUP_BASE"   | awk 'NR==2{print $5}' | tr -d '%')

# ── 5. 시스템 상태 ───────────────────────────────────────────────
CPU=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | tr -d '%us,')
MEM_TOTAL=$(free -m | awk 'NR==2{print $2}')
MEM_USED=$(free -m  | awk 'NR==2{print $3}')
TEMP=$(vcgencmd measure_temp 2>/dev/null | cut -d= -f2 | tr -d "'C")
TEMP="${TEMP:-N/A}"

# ── 6. 블로그 API로 전송 ─────────────────────────────────────────
curl -s -X POST "$BLOG_URL/api/system/raspberry" \
    -H "Authorization: Bearer $API_KEY" \
    -H "Content-Type: application/json" \
    -d "{
        \"backup\": {
            \"lastTime\": \"$BACKUP_TIME\",
            \"size\": \"$BACKUP_SIZE\",
            \"count\": $BACKUP_COUNT
        },
        \"disk\": {
            \"total\": \"$DISK_TOTAL\",
            \"used\": \"$DISK_USED\",
            \"avail\": \"$DISK_AVAIL\",
            \"percent\": $DISK_PERCENT
        },
        \"system\": {
            \"cpu\": ${CPU:-0},
            \"memUsed\": $MEM_USED,
            \"memTotal\": $MEM_TOTAL,
            \"temp\": \"${TEMP}'C\"
        }
    }" > /dev/null 2>&1

echo "[$BACKUP_TIME] backup=$BACKUP_SIZE disk=${DISK_USED}/${DISK_TOTAL} cpu=${CPU}% temp=${TEMP}C" \
    >> "$BACKUP_BASE/pi_backup.log"
