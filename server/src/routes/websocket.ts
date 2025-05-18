import { Hono } from 'hono'
import { createBunWebSocket } from 'hono/bun'
import type { ServerWebSocket } from 'bun' // ServerWebSocket型をインポート

const wsHono = new Hono()

const { upgradeWebSocket, websocket: bunWebsocket } = createBunWebSocket<ServerWebSocket>()

// エンドポイント: /ws (既存の進捗送信エンドポイント)
wsHono.get(
  '/',
  upgradeWebSocket((c) => {
    let intervalId: Timer | undefined = undefined; // Timer型を指定
    let progress = 0;
    const taskId = crypto.randomUUID(); // UUIDを生成

    console.log(`[${taskId}] /ws: WebSocket接続準備完了`);

    return {
      onOpen: (event, ws) => {
        console.log(`[${taskId}] /ws: WebSocket接続が開きました`);
        progress = 0; // 接続時に進捗をリセット
        intervalId = setInterval(() => {
          progress += 10;
          const status = progress >= 100 ? 'completed' : 'processing';
          const description = progress >= 100 
            ? 'タスクが完了しました' 
            : `処理を実行中... (${progress}% 完了)`;

          const message = {
            type: status === 'completed' ? 'task_completed' : 'task_progress',
            taskId,
            progress,
            status,
            description,
          };
          ws.send(JSON.stringify(message));

          if (progress >= 100) {
            console.log(`[${taskId}] /ws: タスク完了、インターバルをクリア`);
            clearInterval(intervalId);
            console.log(`[${taskId}] /ws: サーバーから接続を閉じます。`);
            // 1000はNormal Closureを示すコード、第2引数はオプションの理由
            ws.close(1000, "タスク処理が正常に完了しました。"); 
          }
        }, 1000); // 1秒ごとに更新
      },
      onMessage(event, ws) {
        console.log(`[${taskId}] /ws: クライアントからのメッセージ: ${event.data}`);
        // 必要に応じてクライアントからのメッセージを処理
        // 例: ws.send(JSON.stringify({ type: 'ack', received: event.data }));
      },
      onClose: (event) => {
        console.log(`[${taskId}] /ws: WebSocket接続が閉じました。Code: ${event.code}, Reason: ${event.reason}`);
        // intervalIdがまだ存在する場合 (例えば、onOpenが完了する前にエラーやクライアント側からの切断が発生した場合など)
        // ここでもクリアを試みることで、リソースリークの可能性をさらに低減できます。
        if (intervalId) {
          clearInterval(intervalId);
          console.log(`[${taskId}] /ws: onCloseハンドラでインターバルをクリア`);
        }
      },
      onError: (err) => {
        console.error(`[${taskId}] /ws: WebSocketエラー:`, err);
        if (intervalId) {
          clearInterval(intervalId);
          console.log(`[${taskId}] /ws: エラー時にインターバルをクリア`);
        }
      }
    }
  })
)

// エンドポイント: /ws/longtask (新しい長時間処理エンドポイント)
wsHono.get(
  '/longtask',
  upgradeWebSocket((c) => {
    const taskId = crypto.randomUUID();
    let processingTimeoutId: Timer | undefined = undefined;

    console.log(`[${taskId}] /ws/longtask: WebSocket接続準備完了`);

    return {
      onOpen: (event, ws) => {
        console.log(`[${taskId}] /ws/longtask: WebSocket接続が開きました`);
        
        // 1. 処理中である旨のメッセージをクライアントに送信
        ws.send(JSON.stringify({
          type: 'processing_started',
          taskId,
          message: '長時間処理を開始しました。完了まで10秒かかります。'
        }));

        // 2. 疑似的に時間のかかる処理（10秒待機）
        processingTimeoutId = setTimeout(() => {
          console.log(`[${taskId}] /ws/longtask: 10秒間の処理が完了`);
          
          // 3. 処理結果をクライアントに転送
          const resultData = {
            type: 'task_result',
            taskId,
            data: {
              message: '長時間処理が正常に完了しました。',
              resultValue: Math.random() * 1000,
              timestamp: new Date().toISOString()
            }
          };
          ws.send(JSON.stringify(resultData));

          // 4. サーバー側から接続を閉じる
          console.log(`[${taskId}] /ws/longtask: 結果送信後、サーバーから接続を閉じます。`);
          ws.close(1000, "長時間処理が完了し、結果を送信しました。");

        }, 10000); // 10秒
      },
      onMessage(event, ws) {
        console.log(`[${taskId}] /ws/longtask: クライアントからのメッセージ: ${event.data}`);
        // このエンドポイントでは基本的にクライアントからのメッセージは処理しない想定
      },
      onClose: (event) => {
        console.log(`[${taskId}] /ws/longtask: WebSocket接続が閉じました。Code: ${event.code}, Reason: ${event.reason}`);
        // 接続が予期せず閉じた場合（例：クライアントが途中で切断）、タイマーをクリア
        if (processingTimeoutId) {
          clearTimeout(processingTimeoutId);
          console.log(`[${taskId}] /ws/longtask: onCloseハンドラで処理タイマーをクリア`);
        }
      },
      onError: (err) => {
        console.error(`[${taskId}] /ws/longtask: WebSocketエラー:`, err);
        if (processingTimeoutId) {
          clearTimeout(processingTimeoutId);
          console.log(`[${taskId}] /ws/longtask: エラー時に処理タイマーをクリア`);
        }
      }
    }
  })
)

export { wsHono as websocketRoutes, bunWebsocket } 