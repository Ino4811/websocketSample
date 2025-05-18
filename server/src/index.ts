import { Hono } from 'hono'
import { cors } from 'hono/cors'
import polling from './routes/polling'
import httpRoutes from './routes/http'
import { websocketRoutes, bunWebsocket } from './routes/websocket'

const app = new Hono()

// CORSミドルウェアを追加
app.use('/*', cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  exposeHeaders: ['Content-Length', 'X-Kuma-Revision'],
  maxAge: 600,
  credentials: true
}))

// ルートの統合
app.route('/polling', polling)
app.route('/http', httpRoutes)
app.route('/ws', websocketRoutes)

// ルートエンドポイント
app.get('/', (c) => {
  return c.text('Hello Hono!')
})

export default {
  fetch: app.fetch,
  websocket: bunWebsocket,
}
