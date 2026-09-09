#!/bin/sh
# certbot 인증서 갱신 성공 후 자동 실행되는 deploy hook
# 위치: certbot/conf/renewal-hooks/deploy/reload-nginx.sh
#
# 설치 방법:
#   sudo cp scripts/certbot-deploy-hook.sh certbot/conf/renewal-hooks/deploy/reload-nginx.sh
#   sudo chmod +x certbot/conf/renewal-hooks/deploy/reload-nginx.sh
#
# 역할: 갱신된 인증서를 Nginx가 즉시 인식하도록 reload
# 배경: certbot과 Nginx가 별도 컨테이너라 갱신 후 reload를 수동으로 해야 하는 문제 발생
#       (참고: https://www.madayblog.com/post/cloudflare-526-certbot-nginx-reload)

docker exec mablog_proxy nginx -s reload
