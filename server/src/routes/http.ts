import { Hono } from 'hono'

const http = new Hono()

// 10秒間のタスクを実行し、完了結果を返すエンドポイント
http.get('/', async (c) => {
  const startTime = Date.now();
  const taskId = crypto.randomUUID(); // UUIDを生成

  // 10秒間の処理をシミュレート
  await new Promise(resolve => setTimeout(resolve, 10000));
  const endTime = Date.now();
  
  return c.json({
    message: '10秒間のタスクが100%完了しました。',
    taskId: taskId, // 生成したUUIDを使用
    status: 'completed',
    progress: 100,
    startTime: new Date(startTime).toISOString(),
    endTime: new Date(endTime).toISOString(),
    durationMilliseconds: endTime - startTime
  });
});

export default http 