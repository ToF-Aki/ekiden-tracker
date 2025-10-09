# 駅伝速報システム デプロイガイド

このドキュメントでは、駅伝速報システムを本番環境にデプロイする手順を説明します。

## 📋 前提条件

- Node.js 18以上
- npm または yarn
- Gitアカウント
- Supabaseアカウント (無料)
- Railwayアカウント (無料)
- お名前.comでドメイン取得 (オプション)

---

## 🚀 デプロイ手順

### ステップ1: Supabaseのセットアップ

#### 1.1 アカウント作成
1. [Supabase](https://supabase.com/)にアクセス
2. 「Start your project」をクリック
3. GitHubアカウントでサインアップ

#### 1.2 新規プロジェクト作成
1. ダッシュボードで「New Project」をクリック
2. プロジェクト情報を入力:
   - **Name**: `ekiden-tracker`
   - **Database Password**: 強力なパスワードを生成 (保存しておく)
   - **Region**: `Northeast Asia (Tokyo)` (日本に最も近い)
   - **Pricing Plan**: `Free`
3. 「Create new project」をクリック (約2分待つ)

#### 1.3 データベース接続情報の取得
1. プロジェクトダッシュボードで「Settings」→「Database」を選択
2. 「Connection string」セクションで「URI」を選択
3. 接続文字列をコピー (例: `postgresql://postgres:[YOUR-PASSWORD]@db.xxx.supabase.co:5432/postgres`)
4. `[YOUR-PASSWORD]`を実際のパスワードに置き換える

---

### ステップ2: データベース移行 (SQLite → PostgreSQL)

#### 2.1 Prismaスキーマの更新

`prisma/schema.prisma`を編集:

```prisma
datasource db {
  provider = "postgresql"  // sqlite から変更
  url      = env("DATABASE_URL")
}
```

#### 2.2 環境変数の設定

`.env`ファイルを作成 (`.env.example`を参考に):

```env
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.xxx.supabase.co:5432/postgres"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-generated-secret-key"
NODE_ENV="development"
```

**NEXTAUTH_SECRET の生成方法:**
```bash
openssl rand -base64 32
```

#### 2.3 データベースマイグレーション

```bash
# Prismaクライアントの再生成
npx prisma generate

# マイグレーション実行
npx prisma migrate dev --name init

# 初期データの投入
node prisma/seed.js
```

#### 2.4 ローカルでの動作確認

```bash
npm run dev
```

ブラウザで `http://localhost:3000` にアクセスして動作確認

---

### ステップ3: GitHubリポジトリの準備

#### 3.1 Gitリポジトリの初期化

```bash
cd /Users/aki/Library/CloudStorage/Dropbox/14_Cursor/02_開発ツール/02_駅伝速報ツール

# Gitの初期化
git init

# すべてのファイルをステージング
git add .

# 初回コミット
git commit -m "Initial commit: 駅伝速報システム"
```

#### 3.2 GitHubリポジトリの作成

1. [GitHub](https://github.com/)にログイン
2. 右上の「+」→「New repository」をクリック
3. リポジトリ情報を入力:
   - **Repository name**: `ekiden-tracker`
   - **Description**: `駅伝大会リアルタイム速報システム`
   - **Visibility**: `Private` (推奨)
4. 「Create repository」をクリック

#### 3.3 リモートリポジトリへのプッシュ

```bash
# リモートリポジトリを追加
git remote add origin https://github.com/YOUR-USERNAME/ekiden-tracker.git

# プッシュ
git branch -M main
git push -u origin main
```

---

### ステップ4: Railwayへのデプロイ

#### 4.1 アカウント作成
1. [Railway](https://railway.app/)にアクセス
2. 「Login with GitHub」をクリック
3. GitHubアカウントで認証

#### 4.2 新規プロジェクト作成
1. ダッシュボードで「New Project」をクリック
2. 「Deploy from GitHub repo」を選択
3. `ekiden-tracker`リポジトリを選択
4. 「Deploy Now」をクリック

#### 4.3 環境変数の設定
1. プロジェクトダッシュボードで「Variables」タブを選択
2. 以下の環境変数を追加:

```
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.xxx.supabase.co:5432/postgres
NEXTAUTH_URL=https://your-app.up.railway.app
NEXTAUTH_SECRET=your-generated-secret-key
NODE_ENV=production
```

**注意:** `NEXTAUTH_URL`は後で更新します(Railwayが自動生成するURLを使用)

#### 4.4 ビルドコマンドの確認

Railwayは`package.json`の`build`スクリプトを自動実行します:
```json
"scripts": {
  "build": "prisma generate && next build"
}
```

#### 4.5 デプロイ完了の確認
1. デプロイログを確認
2. 「Deployments」タブで緑色のチェックマークを確認
3. 自動生成されたURL (例: `https://ekiden-tracker-production.up.railway.app`)をクリック

#### 4.6 データベースの初期化

Railway CLIを使用してシードを実行:

```bash
# Railway CLIのインストール
npm install -g @railway/cli

# Railwayにログイン
railway login

# プロジェクトにリンク
railway link

# シードの実行
railway run node prisma/seed.js
```

---

### ステップ5: カスタムドメインの設定

#### 5.1 お名前.comでドメイン取得
1. [お名前.com](https://www.onamae.com/)にアクセス
2. 希望のドメインを検索・購入 (例: `ekiden-event.com`)

#### 5.2 Railwayでカスタムドメイン設定
1. Railwayプロジェクトダッシュボードで「Settings」→「Domains」を選択
2. 「Custom Domain」をクリック
3. 取得したドメイン名を入力 (例: `ekiden-event.com`)
4. 表示されるCNAMEレコードをメモ

#### 5.3 お名前.comでDNS設定
1. お名前.comの「ドメイン設定」→「DNS設定」を選択
2. 対象ドメインを選択
3. CNAMEレコードを追加:
   - **ホスト名**: `@` (ルートドメインの場合) または `www`
   - **TYPE**: `CNAME`
   - **VALUE**: Railwayで表示されたCNAME値
   - **TTL**: `3600`
4. 設定を保存

#### 5.4 SSL証明書の確認
- Railwayが自動的にLet's EncryptのSSL証明書を発行します
- 通常、DNS設定後10-30分で有効になります
- `https://your-domain.com`でアクセスできることを確認

#### 5.5 環境変数の更新
Railwayの環境変数`NEXTAUTH_URL`を更新:
```
NEXTAUTH_URL=https://your-domain.com
```

---

## ✅ デプロイ後の確認事項

### 1. 管理画面へのアクセス
```
https://your-domain.com/admin/login
```
- ユーザー名: `admin`
- パスワード: `password`

### 2. イベントの作成
1. ダッシュボードで「新規イベント作成」
2. イベント情報を入力
3. チームとチェックポイントを登録

### 3. 各画面のURL確認
- **管理画面**: `https://your-domain.com/admin/dashboard`
- **チェックポイント入力**: `https://your-domain.com/checkpoint/[eventId]`
- **ライブ速報**: `https://your-domain.com/live/[eventId]`

### 4. リアルタイム機能のテスト
1. チェックポイント入力画面でゼッケン番号を入力
2. ライブ速報画面で即座に反映されることを確認

---

## 🔧 トラブルシューティング

### データベース接続エラー
- Supabaseの接続文字列が正しいか確認
- パスワードに特殊文字が含まれる場合、URLエンコードが必要

### ビルドエラー
```bash
# ローカルでビルドテスト
npm run build
```

### WebSocketが動作しない
- Railwayの環境変数を確認
- ブラウザのコンソールでエラーを確認

### ドメインが反映されない
- DNS設定が正しいか確認
- 最大24時間かかる場合があります(通常は30分程度)

---

## 📊 運用時の注意事項

### 無料枠の制限
- **Supabase**: 月間500MB、5GBデータ転送
- **Railway**: 月間500時間実行時間

### パフォーマンス監視
- Railwayダッシュボードでメモリ使用量を確認
- Supabaseダッシュボードでデータベース接続数を確認

### バックアップ
- Supabaseは自動バックアップを提供
- 重要なイベント前に手動バックアップを推奨

---

## 🎯 本番運用チェックリスト

- [ ] Supabaseプロジェクト作成完了
- [ ] データベースマイグレーション完了
- [ ] 初期管理者アカウント作成完了
- [ ] GitHubリポジトリ作成・プッシュ完了
- [ ] Railwayデプロイ完了
- [ ] 環境変数設定完了
- [ ] カスタムドメイン設定完了
- [ ] SSL証明書有効化確認
- [ ] 管理画面ログイン確認
- [ ] リアルタイム機能動作確認
- [ ] 全画面の表示確認
- [ ] モバイル表示確認

---

## 📞 サポート

問題が発生した場合:
1. Railwayのデプロイログを確認
2. ブラウザのコンソールでエラーを確認
3. 環境変数が正しく設定されているか確認

---

**デプロイ完了おめでとうございます!🎉**

