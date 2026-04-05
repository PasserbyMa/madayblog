#!/bin/bash
# ================================================================
# Ma_Blog - Raspberry Pi 백업 & 상태 전송 스크립트
# 위치: ~/backup/pi_backup.sh
# ================================================================

OCI_USER="ubuntu"
OCI_HOST="129.154.55.20"
BLOG_URL="https://madayblog.com"
API_KEY="ebab091fbb70a3dc84f3a615b467a2f4bae01718e054f1a208110a25dee22ef2"
BACKUP_BASE="/home/makecool0/backups"
KEEP_DAYS=7

# ── 1. 백업 폴더 생성 ────────────────────────────────────────────
mkdir -p "$BACKUP_BASE"

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_BASE/mablog_${TIMESTAMP}.tar.gz"
BACKUP_TIME=$(date -u +%Y-%m-%dT%H:%M:%SZ)

# ── 2. OCI 서버에서 mongodump 실행 후 Pi로 전송 ──────────────────
ssh -o StrictHostKeyChecking=no ${OCI_USER}@${OCI_HOST} \
    "docker exec mablog_mongodb mongodump \
        --uri='mongodb://mongoAdmin:mongoA96547852!@localhost:27017/maBlog_DataTable?authSource=admin' \
        --out=/tmp/mablog_dump --quiet && \
     docker cp mablog_mongodb:/tmp/mablog_dump /tmp/mablog_dump_host && \
     tar -czf /tmp/mablog_backup.tar.gz -C /tmp mablog_dump_host && \
     docker exec mablog_mongodb rm -rf /tmp/mablog_dump && \
     rm -rf /tmp/mablog_dump_host"

SCP_EXIT=$?

if [ $SCP_EXIT -eq 0 ]; then
    scp -o StrictHostKeyChecking=no \
        ${OCI_USER}@${OCI_HOST}:/tmp/mablog_backup.tar.gz \
        "$BACKUP_FILE"
    BACKUP_SIZE=$(du -sh "$BACKUP_FILE" 2>/dev/null | cut -f1)
    # OCI 임시 파일 정리
    ssh -o StrictHostKeyChecking=no ${OCI_USER}@${OCI_HOST} \
        "rm -f /tmp/mablog_backup.tar.gz"
else
    BACKUP_SIZE="ERROR"
fi

# ── 3. 오래된 백업 삭제 ──────────────────────────────────────────
find "$BACKUP_BASE" -name "mablog_*.tar.gz" -mtime +$KEEP_DAYS -delete 2>/dev/null

# ── 4. 백업 개수 ─────────────────────────────────────────────────
BACKUP_COUNT=$(find "$BACKUP_BASE" -name "mablog_*.tar.gz" | wc -l)

# ── 5. 디스크 정보 ───────────────────────────────────────────────
DISK_TOTAL=$(df -h "$BACKUP_BASE"   | awk 'NR==2{print $2}')
DISK_USED=$(df -h "$BACKUP_BASE"    | awk 'NR==2{print $3}')
DISK_AVAIL=$(df -h "$BACKUP_BASE"   | awk 'NR==2{print $4}')
DISK_PERCENT=$(df "$BACKUP_BASE"    | awk 'NR==2{gsub(/%/,""); print $5}')

# ── 6. 시스템 상태 ───────────────────────────────────────────────
CPU=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | tr -d '%us,')
MEM_TOTAL=$(free -m | awk 'NR==2{print $2}')
MEM_USED=$(free -m  | awk 'NR==2{print $3}')
TEMP=$(vcgencmd measure_temp 2>/dev/null | cut -d= -f2 | tr -d "'C")
TEMP="${TEMP:-N/A}"

# ── 7. 블로그 API로 전송 ─────────────────────────────────────────
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
            \"percent\": ${DISK_PERCENT:-0}
        },
        \"system\": {
            \"cpu\": ${CPU:-0},
            \"memUsed\": ${MEM_USED:-0},
            \"memTotal\": ${MEM_TOTAL:-1},
            \"temp\": \"${TEMP}'C\"
        }
    }"

# ── 8. 로그 ──────────────────────────────────────────────────────
echo "[$BACKUP_TIME] size=$BACKUP_SIZE count=$BACKUP_COUNT disk=${DISK_USED}/${DISK_TOTAL} cpu=${CPU}% temp=${TEMP}C" \
    >> "$BACKUP_BASE/backup.log"
