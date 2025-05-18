import React, { useState, useEffect, useCallback, useRef } from 'react';
import './PollingPage.css'; // CSSのインポートを変更

// サーバーとの間でやり取りされるタスク情報の型定義
interface PollingTaskStatus {
  // 共通で含まれる可能性のあるフィールド
  taskId: string;                    // タスクの一意なID (POSTレスポンス、GETレスポンスに含まれる)
  message?: string;                   // サーバーからのメッセージ (主にPOSTレスポンスの message)
  error?: string;                     // エラー発生時のメッセージ (主にGETでタスクが見つからない場合など)

  // 主に GET /tasks/:taskId のレスポンスに含まれるフィールド
  progress?: number;                  // タスクの進捗状況 (0-100)
  status?: 'processing' | 'completed' | 'error'; // タスクの状態
  description?: string;               // タスクの説明
  lastUpdated?: string;               // 最終更新日時
  shouldContinuePolling?: boolean;    // ポーリングを継続すべきかのフラグ
  nextPollingIn?: number;             // 次のポーリングまでの推奨時間 (サーバーからは送信されるが、現在クライアントは recommendedInterval を使用)

  // 主に POST /tasks のレスポンスに含まれるフィールド
  pollingEndpoint?: string;           // ポーリングに使用するAPIエンドポイント (例: /polling/tasks/:taskId)
  recommendedInterval?: number;       // ポーリングの推奨間隔 (ミリ秒)
}

const API_BASE_URL = 'http://localhost:3000';

const PollingPage: React.FC = () => {
  // 状態管理用のstate変数
  const [task, setTask] = useState<PollingTaskStatus | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isPollingActive, setIsPollingActive] = useState<boolean>(false);
  
  // ポーリング用のタイマーID
  const pollingTimerRef = useRef<number | null>(null);

  // ポーリング処理を停止する関数
  const stopPolling = useCallback(() => {
    if (pollingTimerRef.current !== null) {
      window.clearTimeout(pollingTimerRef.current);
      pollingTimerRef.current = null;
    }
    setIsPollingActive(false);
  }, []);

  // タスクの状態をポーリングする関数
  const pollTaskStatus = useCallback(async (taskId: string, interval: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/polling/tasks/${taskId}`);
      const data: PollingTaskStatus = await response.json();
      
      if (!response.ok) {
        setError(data.error || 'タスクの取得中にエラーが発生しました');
        stopPolling();
        return;
      }
      
      setTask(data);
      
      // ポーリングを継続すべきか判断
      if (data.shouldContinuePolling) {
        pollingTimerRef.current = window.setTimeout(
          () => pollTaskStatus(taskId, interval),
          interval
        );
      } else {
        stopPolling();
        setIsLoading(false);
      }
    } catch (err) {
      setError('ポーリング中にエラーが発生しました: ' + (err instanceof Error ? err.message : String(err)));
      stopPolling();
      setIsLoading(false);
    }
  }, [stopPolling]);

  // 新しいタスクを開始する関数
  const startNewTask = useCallback(async () => {
    // 既存のポーリングを停止
    stopPolling();
    
    // 状態をリセット
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/polling/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const data: PollingTaskStatus = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'タスクの開始に失敗しました');
      }
      
      setTask(data);
      
      // ポーリングを開始
      setIsPollingActive(true);
      pollTaskStatus(data.taskId, data.recommendedInterval || 1000);
    } catch (err) {
      setError('タスクの開始中にエラーが発生しました: ' + (err instanceof Error ? err.message : String(err)));
      setIsLoading(false);
    }
  }, [stopPolling, pollTaskStatus]);

  // コンポーネントのアンマウント時にポーリングを停止
  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, [stopPolling]);

  // このコンポーネントがレンダリングするJSX
  return (
    <div className="polling-page"> {/* このページのルート要素 */} 
      <h1>Polling API Test</h1>
      {/* タスク開始ボタン。ローディング中は非活性化され、テキストも状態に応じて変化する */}
      <button onClick={startNewTask} disabled={isLoading}>
        {/* isLoadingがtrueで、まだtask.progressが存在しない(タスク開始直後)場合 */}
        {isLoading && !task?.progress ? 'タスク開始準備中...' : 
         /* isLoadingがtrueで、taskとtask.progressが存在し、かつ処理中の場合 */
         (isPollingActive && task && task.status === 'processing' ? `処理中 (${task.progress ?? 0}%)...` : 
         /* 上記以外の場合 (通常時やタスク完了/エラー後) */
         (task?.status === 'completed' ? 'タスク完了' : // タスク完了後
         (task?.status === 'error' ? 'タスクエラー' : // タスクエラー後
         '新しい長時間タスクを開始 (Polling)')))} {/* 初期状態、または完了/エラー後 */}
      </button>

      {/* error stateに値がある場合のみエラーメッセージを表示 */}
      {error && <p className="polling-page-errorText">エラー: {error}</p>}

      {/* task stateに値がある場合のみタスク情報を表示 */}
      {task && (
        <div className="polling-page-taskInfoContainer">
          <h2>タスク状況 (ID: {task.taskId})</h2>
          {/* taskオブジェクトの内容を整形されたJSON形式で表示 */}
          {/* これにはtaskId, message, progress, status, descriptionなどが含まれる */}
          <pre className="polling-page-taskJson">
            {JSON.stringify(task, null, 2)}
          </pre>
          {/* タスクのステータスが'processing'で、かつprogress情報が存在する場合のみプログレスバーを表示 */}
          {task.status === 'processing' && task.progress !== undefined && (
            <div className="polling-page-progressBarContainer">
              <div 
                className="polling-page-progressBar"
                style={{ width: `${task.progress}%`}} // progressの値に応じてバーの幅を動的に変更
              >
                {task.progress}% {/* バー内に進捗率をテキスト表示 */}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PollingPage; 