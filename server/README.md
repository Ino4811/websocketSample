# サーバーアプリケーション

このサーバーアプリケーションは、HTTPエンドポイント、長時間実行タスクの進捗状況を確認するためのポーリングAPI、およびリアルタイム進捗通知のためのWebSocket APIを提供します。

## セットアップ

依存関係のインストール:
```sh
bun install
```

開発サーバーの起動:
```sh
bun run dev
```

サーバーは http://localhost:3000 で起動します。

## API仕様

### 1. HTTPエンドポイント

#### 1.1 5秒遅延テストエンドポイント

単純な5秒間の遅延の後、メッセージとタイムスタンプを返すテストエンドポイントです。

- **エンドポイント**: `GET /http`
- **レスポンス**:
  ```json
  {
    "message": "5秒間の処理が完了しました",
    "timestamp": "YYYY-MM-DDTHH:mm:ss.sssZ"
  }
  ```

### 2. ポーリングAPI

長時間実行タスクの進捗状況をクライアントが定期的に確認するためのAPIです。

#### 2.1 タスク開始エンドポイント

長時間実行タスクを開始し、ポーリング用のタスクIDを発行します。

- **エンドポイント**: `POST /polling/tasks`
- **リクエストボディ**: なし
- **レスポンス**:
  ```json
  {
    "taskId": "task_abc123",
    "message": "ポーリング可能なタスクを開始しました",
    "pollingEndpoint": "/polling/tasks/task_abc123",
    "recommendedInterval": 1000
  }
  ```

#### 2.2 タスク状態確認エンドポイント

指定されたタスクIDの現在の進捗状況を確認します。

- **エンドポイント**: `GET /polling/tasks/:taskId`
- **パスパラメータ**: 
  - `taskId` (string): タスク開始時に発行されたID。
- **レスポンス**:
  ```json
  {
    "progress": 30,
    "status": "processing", // "processing" | "completed" | "error"
    "lastUpdated": "YYYY-MM-DDTHH:mm:ss.sssZ",
    "description": "処理を実行中... (30% 完了)",
    "nextPollingIn": 1000, // 次のポーリングまでの推奨待機時間（ミリ秒）
    "shouldContinuePolling": true // ポーリングを継続すべきかどうかのフラグ
  }
  ```

#### 2.3 ポーリングAPIの動作詳細

1.  **タスクの進行**:
    *   タスクは1秒ごとに10%ずつ進捗が更新されます。
    *   完了までにおよそ10秒かかります。
2.  **推奨ポーリング間隔**:
    *   クライアントは`recommendedInterval`または`nextPollingIn`で示される間隔で状態確認エンドポイントを呼び出すことが推奨されます。
3.  **タスクの有効期限**:
    *   完了したタスクの情報は、完了から約1分後にサーバーから削除される可能性があります。

#### 2.4 ポーリングAPI使用例

1.  タスクの開始:
    ```sh
    curl -X POST http://localhost:3000/polling/tasks
    ```
2.  進捗状況の確認 (上記で返された`taskId`を使用):
    ```sh
    curl http://localhost:3000/polling/tasks/task_abc123
    ```

#### 2.5 ポーリングAPIエラーハンドリング

-   **無効なタスクID** (`GET /polling/tasks/:taskId`):
    *   ステータスコード: `404 Not Found`
    *   レスポンスボディ:
        ```json
        {
          "error": "ポーリング対象のタスクが見つかりません",
          "message": "指定されたタスクIDは存在しないか、すでに完了して削除された可能性があります"
        }
        ```
-   クライアントはエラーレスポンスを受け取った場合、該当タスクのポーリングを中止すべきです。

### 3. WebSocket API

長時間実行タスクの進捗をリアルタイムで受信するためのAPIです。

#### 3.1 リアルタイム進捗通知エンドポイント

- **エンドポイント**: `ws://localhost:3000/ws` (または `wss://`)

#### 3.2 WebSocket APIの接続と動作

1.  クライアントが上記エンドポイントにWebSocket接続を確立します。
2.  接続が確立されると (`onOpen`)、サーバー側で自動的に新しい長時間タスクが開始され、ユニークな`taskId`が割り当てられます。
3.  サーバーは1秒ごとにタスクの進捗状況をJSON形式のメッセージでクライアントに送信します。
4.  進捗が100%に達すると、タスクは完了となり、`task_completed`タイプのメッセージが送信された後、進捗の送信は停止します。
5.  接続が閉じるか (`onClose`)、エラーが発生した場合 (`onError`)、サーバー側で関連するリソース（タイマーなど）がクリーンアップされます。

#### 3.3 サーバーから送信されるWebSocketメッセージ形式

メッセージはJSON文字列として送信されます。

-   **進捗更新中 (`task_progress`)**:
    ```json
    {
      "type": "task_progress",
      "taskId": "ws_task_xyz789",
      "progress": 50,
      "status": "processing",
      "description": "処理を実行中... (50% 完了)"
    }
    ```
-   **タスク完了時 (`task_completed`)**:
    ```json
    {
      "type": "task_completed",
      "taskId": "ws_task_xyz789",
      "progress": 100,
      "status": "completed",
      "description": "タスクが完了しました"
    }
    ```

#### 3.4 WebSocket APIクライアント側での実装例（JavaScript）

```javascript
const socket = new WebSocket('ws://localhost:3000/ws');

socket.onopen = () => {
  console.log('WebSocket接続が開きました。');
  // 接続確立時にクライアントからサーバーへ初期メッセージを送信することも可能です。
  // socket.send(JSON.stringify({ type: 'client_ready' }));
};

socket.onmessage = (event) => {
  try {
    const message = JSON.parse(event.data);
    console.log('サーバーからのメッセージ:', message);

    if (message.type === 'task_progress') {
      console.log(`進捗: ${message.progress}%, 説明: ${message.description}`);
      // ここでUIを更新するなどの処理を行います。
    } else if (message.type === 'task_completed') {
      console.log('タスクが完了しました。');
      // タスク完了後の処理をここに記述します。
      // socket.close(); // 必要に応じてクライアント側から接続を閉じることもできます。
    }
  } catch (error) {
    console.error('受信メッセージの解析エラー:', error, event.data);
  }
};

socket.onclose = (event) => {
  if (event.wasClean) {
    console.log(`WebSocket接続が正常に閉じました。コード=${event.code}, 理由=${event.reason}`);
  } else {
    // 例: サーバープロセスが停止した場合やネットワークの問題
    console.error('WebSocket接続が予期せず切れました。');
  }
};

socket.onerror = (error) => {
  console.error('WebSocketエラーが発生しました:', error);
};
```
