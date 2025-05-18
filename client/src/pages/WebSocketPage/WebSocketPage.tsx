import React, { useState, useEffect, useCallback, useRef } from 'react';
import './WebSocketPage.css';

// WebSocketで受信するメッセージの型定義
interface WebSocketTaskStatus {
  type: 'task_progress' | 'task_completed' | 'processing_started' | 'task_result';
  taskId: string;
  progress?: number;
  status?: 'processing' | 'completed';
  description?: string;
  message?: string;
  data?: {
    message: string;
    resultValue: number;
    timestamp: string;
  };
}

const WebSocketPage: React.FC = () => {
  // 状態管理用のstate変数
  const [task, setTask] = useState<WebSocketTaskStatus | null>(null);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  
  // WebSocketの参照を保持
  const websocketRef = useRef<WebSocket | null>(null);

  // WebSocket接続を閉じる関数
  const closeWebSocket = useCallback(() => {
    if (websocketRef.current && websocketRef.current.readyState === WebSocket.OPEN) {
      websocketRef.current.close();
    }
    websocketRef.current = null;
    setIsConnected(false);
  }, []);

  // 新しいWebSocket接続を開始する関数
  const startWebSocketTask = useCallback(() => {
    // 既存の接続を閉じる
    closeWebSocket();
    
    // 状態をリセット
    setIsConnecting(true);
    setError(null);
    setTask(null);
    
    try {
      // WebSocket接続を作成
      const ws = new WebSocket('ws://localhost:3000/ws');
      websocketRef.current = ws;
      
      // 接続イベントのハンドリング
      ws.onopen = () => {
        console.log('WebSocket接続が確立されました');
        setIsConnected(true);
        setIsConnecting(false);
      };
      
      // メッセージ受信イベントのハンドリング
      ws.onmessage = (event) => {
        try {
          const data: WebSocketTaskStatus = JSON.parse(event.data);
          console.log('受信データ:', data);
          setTask(data);
        } catch (err) {
          setError('受信データの解析に失敗しました: ' + (err instanceof Error ? err.message : String(err)));
        }
      };
      
      // エラーイベントのハンドリング
      ws.onerror = (_event) => {
        setError('WebSocket接続でエラーが発生しました');
        setIsConnecting(false);
        setIsConnected(false);
      };
      
      // 接続終了イベントのハンドリング
      ws.onclose = (event) => {
        console.log(`WebSocket接続が閉じられました: コード ${event.code}, 理由: ${event.reason}`);
        setIsConnected(false);
        setIsConnecting(false);
      };
    } catch (err) {
      setError('WebSocket接続の開始に失敗しました: ' + (err instanceof Error ? err.message : String(err)));
      setIsConnecting(false);
    }
  }, [closeWebSocket]);

  // 長時間処理タスクを開始する関数
  const startLongTask = useCallback(() => {
    // 既存の接続を閉じる
    closeWebSocket();
    
    // 状態をリセット
    setIsConnecting(true);
    setError(null);
    setTask(null);
    
    try {
      // WebSocket接続を作成
      const ws = new WebSocket('ws://localhost:3000/ws/longtask');
      websocketRef.current = ws;
      
      // 接続イベントのハンドリング
      ws.onopen = () => {
        console.log('WebSocket長時間タスク接続が確立されました');
        setIsConnected(true);
        setIsConnecting(false);
      };
      
      // メッセージ受信イベントのハンドリング
      ws.onmessage = (event) => {
        try {
          const data: WebSocketTaskStatus = JSON.parse(event.data);
          console.log('受信データ:', data);
          setTask(data);
        } catch (err) {
          setError('受信データの解析に失敗しました: ' + (err instanceof Error ? err.message : String(err)));
        }
      };
      
      // エラーイベントのハンドリング
      ws.onerror = (_event) => {
        setError('WebSocket接続でエラーが発生しました');
        setIsConnecting(false);
        setIsConnected(false);
      };
      
      // 接続終了イベントのハンドリング
      ws.onclose = (event) => {
        console.log(`WebSocket接続が閉じられました: コード ${event.code}, 理由: ${event.reason}`);
        setIsConnected(false);
        setIsConnecting(false);
      };
    } catch (err) {
      setError('WebSocket接続の開始に失敗しました: ' + (err instanceof Error ? err.message : String(err)));
      setIsConnecting(false);
    }
  }, [closeWebSocket]);

  // コンポーネントのアンマウント時にWebSocket接続を閉じる
  useEffect(() => {
    return () => {
      closeWebSocket();
    };
  }, [closeWebSocket]);

  // このコンポーネントがレンダリングするJSX
  return (
    <div className="websocket-page">
      <h1>WebSocket API Test</h1>
      
      <div>
        {/* 通常タスク開始ボタン */}
        <button 
          onClick={startWebSocketTask} 
          disabled={isConnecting || isConnected}
          style={{ marginRight: '10px' }}
        >
          {isConnecting ? 'WebSocket接続中...' : 
           (isConnected && task?.type === 'task_progress' ? 
            `処理中 (${task.progress ?? 0}%)...` : 
            '通常タスクを開始 (WebSocket)')}
        </button>
        
        {/* 長時間タスク開始ボタン */}
        <button 
          onClick={startLongTask} 
          disabled={isConnecting || isConnected}
        >
          {isConnecting ? 'WebSocket接続中...' : 
           (isConnected && task?.type === 'processing_started' ? 
            '長時間処理実行中...' : 
            '長時間タスクを開始 (WebSocket)')}
        </button>
      </div>

      {/* error stateに値がある場合のみエラーメッセージを表示 */}
      {error && <p className="websocket-page-errorText">エラー: {error}</p>}

      {/* task stateに値がある場合のみタスク情報を表示 */}
      {task && (
        <div className="websocket-page-taskInfoContainer">
          <h2>タスク状況 (ID: {task.taskId})</h2>
          {/* taskオブジェクトの内容を整形されたJSON形式で表示 */}
          <pre className="websocket-page-taskJson">
            {JSON.stringify(task, null, 2)}
          </pre>
          
          {/* タスクのtypeが'task_progress'で、かつprogress情報が存在する場合のみプログレスバーを表示 */}
          {task.type === 'task_progress' && task.progress !== undefined && (
            <div className="websocket-page-progressBarContainer">
              <div 
                className="websocket-page-progressBar"
                style={{ width: `${task.progress}%` }}
              >
                {task.progress}%
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default WebSocketPage; 