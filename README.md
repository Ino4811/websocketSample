# ネットワークアプリケーション

このリポジトリは、ウェブアプリケーションの開発環境を含むプロジェクトです。クライアントサイドとサーバーサイドの両方のコードを提供しています。

詳細なドキュメントは以下のリンクから参照できます：
- [クライアント側の詳細](./client/README.md)
- [サーバー側の詳細](./server/README.md)

## 技術スタック

### クライアント側
- **フレームワーク**: React 19
- **ビルドツール**: Vite 6
- **言語**: TypeScript
- **ルーティング**: React Router 7
- **開発環境**: ESLint, SWC (高速コンパイラ)

### サーバー側
- **実行環境**: Bun
- **フレームワーク**: Hono
- **通信プロトコル**: 
  - HTTP/RESTful API
  - WebSocket
  - ポーリング
- **言語**: TypeScript

## プロジェクト構造

```
/network
  /client           - Reactフロントエンドアプリケーション
    /src            - ソースコード
    /public         - 静的ファイル
    ...
  /server           - Honoバックエンドアプリケーション
    /src            - サーバーコード
    ...
```

## セットアップ方法

### クライアント

```bash
cd client
bun install
bun run dev
```

### サーバー

```bash
cd server
bun install
bun run dev
```

## 通信方法

このアプリケーションでは、以下の通信方法をサポートしています：

1. **HTTP/RESTful API** - 標準的なHTTPリクエスト/レスポンスモデル
2. **WebSocket** - リアルタイム双方向通信
3. **ポーリング** - 定期的なデータ取得

各通信方法の詳細については、それぞれの[クライアント](./client/README.md)と[サーバー](./server/README.md)のドキュメントを参照してください。

## ライセンス

このプロジェクトは MIT ライセンスの下で提供されています。詳細は [LICENSE](./LICENSE) ファイルを参照してください。