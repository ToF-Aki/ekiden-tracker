# 駅伝速報システム (Ekiden Tracker)

リアルタイムで駅伝大会の進行状況を追跡・表示するWebアプリケーションです。

## 🎯 主な機能

- **管理画面**: イベント・チーム・チェックポイントの管理
- **チェックポイント入力**: iPad等でゼッケン番号を入力
- **ライブ速報**: リアルタイムで各チームの進行状況を表示
- **WebSocket**: Socket.IOによる即時更新
- **モバイル対応**: スマートフォン・タブレットで快適に閲覧

## 🛠️ 技術スタック

- **フロントエンド**: Next.js 15 (App Router), React 18, TypeScript, Tailwind CSS
- **バックエンド**: Next.js API Routes, Node.js
- **データベース**: PostgreSQL (Supabase)
- **リアルタイム通信**: Socket.IO
- **認証**: NextAuth.js
- **ORM**: Prisma
- **デプロイ**: Railway

## 📦 必要な環境

- Node.js 18以上
- npm または yarn
- PostgreSQL (本番環境)

## 🚀 ローカル開発環境のセットアップ

### 1. リポジトリのクローン

```bash
git clone https://github.com/YOUR-USERNAME/ekiden-tracker.git
cd ekiden-tracker
```

### 2. 依存関係のインストール

```bash
npm install
```

### 3. 環境変数の設定

`.env.example`をコピーして`.env`を作成:

```bash
cp .env.example .env
```

`.env`ファイルを編集:

```env
DATABASE_URL="file:./prisma/dev.db"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"
NODE_ENV="development"
```

### 4. データベースのセットアップ

```bash
# Prismaクライアントの生成
npx prisma generate

# データベースマイグレーション
npx prisma migrate dev --name init

# 初期データの投入
node prisma/seed.js
```

### 5. 開発サーバーの起動

```bash
npm run dev
```

ブラウザで `http://localhost:3000` にアクセス

## 🔑 デフォルトログイン情報

- **ユーザー名**: `admin`
- **パスワード**: `password`

**⚠️ 本番環境では必ず変更してください!**

## 📱 画面構成

### 管理画面
- **ログイン**: `/admin/login`
- **ダッシュボード**: `/admin/dashboard`
- **イベント管理**: `/admin/events/[eventId]`

### 一般画面
- **チェックポイント入力**: `/checkpoint/[eventId]`
- **ライブ速報**: `/live/[eventId]`

## 🌐 本番環境へのデプロイ

詳細な手順は [DEPLOYMENT.md](./DEPLOYMENT.md) を参照してください。

### 簡易手順

1. **Supabase**でPostgreSQLデータベースを作成
2. **GitHub**にリポジトリをプッシュ
3. **Railway**でデプロイ
4. 環境変数を設定
5. データベースマイグレーションを実行
6. カスタムドメインを設定 (オプション)

## 📊 システム要件 (76チーム想定)

### 同時接続数
- 管理者: 1-2人
- チェックポイントスタッフ: 4人
- 閲覧者: 50-200人
- **合計**: 約55-206接続

### データ転送量
- 大会全体: 約160MB
- Supabase無料枠: 5GB/月 (十分)
- Railway無料枠: 100GB/月 (十分)

## 🔧 開発コマンド

```bash
# 開発サーバー起動
npm run dev

# 本番ビルド
npm run build

# 本番サーバー起動
npm start

# Lintチェック
npm run lint

# Prismaスタジオ (データベースGUI)
npx prisma studio

# データベースリセット
npx prisma migrate reset
```

## 📁 プロジェクト構造

```
ekiden-tracker/
├── prisma/
│   ├── schema.prisma      # データベーススキーマ
│   ├── seed.js            # 初期データ
│   └── dev.db             # SQLite (開発環境)
├── src/
│   ├── app/
│   │   ├── admin/         # 管理画面
│   │   ├── api/           # APIルート
│   │   ├── checkpoint/    # チェックポイント入力
│   │   ├── live/          # ライブ速報
│   │   └── layout.tsx     # ルートレイアウト
│   ├── hooks/
│   │   └── useSocket.ts   # Socket.IOフック
│   └── lib/
│       ├── auth.ts        # NextAuth設定
│       ├── prisma.ts      # Prismaクライアント
│       └── socket.ts      # Socket.IO設定
├── server.js              # カスタムサーバー
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.ts
├── DEPLOYMENT.md          # デプロイガイド
└── README.md
```

## 🔒 セキュリティ

- **認証**: NextAuth.jsによる管理者認証
- **パスワード**: bcryptjsでハッシュ化
- **環境変数**: 機密情報は環境変数で管理
- **HTTPS**: 本番環境では自動SSL証明書

## 🐛 トラブルシューティング

### データベース接続エラー
```bash
# Prismaクライアントの再生成
npx prisma generate

# マイグレーションの再実行
npx prisma migrate reset
```

### Socket.IO接続エラー
- ブラウザのコンソールでエラーを確認
- `server.js`が正しく起動しているか確認

### ビルドエラー
```bash
# node_modulesを削除して再インストール
rm -rf node_modules package-lock.json
npm install
```

## 📝 ライセンス

このプロジェクトは私的利用を目的としています。

## 🤝 サポート

問題が発生した場合:
1. [DEPLOYMENT.md](./DEPLOYMENT.md)のトラブルシューティングを確認
2. GitHubのIssuesで報告
3. ログファイルを確認

## 🎉 使用例

### 1. イベント作成
管理画面でイベント情報を登録

### 2. チーム登録
76チーム分のゼッケン番号、チーム名、メンバー名を入力

### 3. チェックポイント設定
1km, 2km, 3km, 4kmの4地点を設定

### 4. 大会当日
- スタッフがiPadでチェックポイント入力画面を開く
- 観客がスマホでライブ速報画面を開く
- ランナーが通過するたびにゼッケン番号を入力
- リアルタイムで全員の画面に反映

---

**開発者**: Aki  
**作成日**: 2025年10月  
**バージョン**: 1.0.0
