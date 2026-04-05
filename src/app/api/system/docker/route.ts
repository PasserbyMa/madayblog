import { exec } from 'child_process';

export interface DockerContainer {
    ID: string;
    Image: string;
    Command: string;
    CreatedAt: string;
    RunningFor: string;
    Ports: string;
    Status: string;
    Names: string;
}

// docker ps 실행 → 컨테이너 목록 반환
function getContainers(): Promise<DockerContainer[]> {
    return new Promise((resolve) => {
        exec("docker ps --format '{{json .}}'", (err, stdout) => {
            if (err || !stdout.trim()) return resolve([]);
            try {
                const list = stdout.trim().split('\n').map((line) => JSON.parse(line));
                resolve(list);
            } catch {
                resolve([]);
            }
        });
    });
}

export async function GET(request: Request) {
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
        async start(controller) {
            const send = async () => {
                const containers = await getContainers();
                // SSE 형식: "data: ...\n\n"
                controller.enqueue(
                    encoder.encode(`data: ${JSON.stringify(containers)}\n\n`)
                );
            };

            // 연결 즉시 첫 데이터 전송
            await send();

            // 이후 5초마다 전송
            const interval = setInterval(send, 5000);

            // 클라이언트가 연결을 끊으면 interval 정리
            request.signal.addEventListener('abort', () => {
                clearInterval(interval);
                controller.close();
            });
        },
    });

    return new Response(stream, {
        headers: {
            'Content-Type':  'text/event-stream', // SSE 필수 헤더
            'Cache-Control': 'no-cache',
            'Connection':    'keep-alive',
        },
    });
}
