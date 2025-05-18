import { Hono } from 'hono'

const polling = new Hono()

// 進行状況を追跡するためのMap
const pollingTasksMap = new Map<string, {
  progress: number,
  status: 'processing' | 'completed' | 'error',
  lastUpdated: Date,
  description: string
}>();

// UUIDを生成する関数
function generateTaskId(): string {
  return crypto.randomUUID(); // UUIDを生成
}

// プログレスを更新する非同期関数
async function updatePollingProgress(taskId: string) {
  let progress = 0;
  const interval = setInterval(() => {
    progress += 10;
    
    if (progress <= 100) {
      pollingTasksMap.set(taskId, {
        progress,
        status: progress === 100 ? 'completed' : 'processing',
        lastUpdated: new Date(),
        description: progress === 100 
          ? 'タスクが完了しました'
          : `処理を実行中... (${progress}% 完了)`
      });
    }

    if (progress >= 100) {
      clearInterval(interval);
      // タスク完了から1分後にMapからデータを削除
      setTimeout(() => {
        pollingTasksMap.delete(taskId);
      }, 60000);
    }
  }, 1000); // 1秒ごとに10%ずつ進捗を更新
}

// 長時間タスクを開始するエンドポイント
polling.post('/tasks', async (c) => {
  const taskId = generateTaskId();
  console.log(`[${taskId}] /polling/tasks: ポーリング可能なタスクを開始しました`);
  pollingTasksMap.set(taskId, {
    progress: 0,
    status: 'processing',
    lastUpdated: new Date(),
    description: '長時間処理タスクを実行中'
  });

  // バックグラウンドでプログレスを更新
  updatePollingProgress(taskId);

  return c.json({
    taskId,
    message: 'ポーリング可能なタスクを開始しました',
    pollingEndpoint: `/polling/tasks/${taskId}`,
    recommendedInterval: 1000, // 推奨ポーリング間隔（ミリ秒）
  });
});

// ポーリング用のステータス確認エンドポイント
polling.get('/tasks/:taskId', async (c) => {
  const taskId = c.req.param('taskId');
  const progress = pollingTasksMap.get(taskId);
  console.log(`[${taskId}] /polling/tasks/:taskId: ポーリング対象のタスクのリクエストを受け取りました`);
  console.log(`[${taskId}] /polling/tasks/:taskId: タスクの進捗状況: ${progress?.progress} タスクの状態: ${progress?.status}`);

  if (!progress) {
    return c.json({
      error: 'ポーリング対象のタスクが見つかりません',
      message: '指定されたタスクIDは存在しないか、すでに完了して削除された可能性があります'
    }, 404);
  }

  return c.json({
    ...progress,
    taskId,
    nextPollingIn: 1000, // 次のポーリングまでの推奨待機時間（ミリ秒）
    shouldContinuePolling: progress.status === 'processing'
  });
});

export default polling 