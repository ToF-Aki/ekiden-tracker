# Supabase セットアップガイド

このガイドでは、Supabaseで無料のPostgreSQLデータベースをセットアップする手順を説明します。

## 📋 前提条件

- GitHubアカウント
- メールアドレス

---

## 🚀 ステップ1: Supabaseアカウントの作成

### 1.1 Supabaseにアクセス

ブラウザで以下のURLを開きます:
```
https://supabase.com/
```

### 1.2 サインアップ

1. 右上の「Start your project」をクリック
2. 「Continue with GitHub」を選択
3. GitHubアカウントでログイン
4. Supabaseへのアクセスを許可

---

## 🗄️ ステップ2: 新規プロジェクトの作成

### 2.1 プロジェクト作成画面

1. ダッシュボードで「New Project」ボタンをクリック
2. 組織を選択 (初回は自動作成されます)

### 2.2 プロジェクト情報の入力

以下の情報を入力します:

#### **Name** (プロジェクト名)
```
ekiden-tracker
```

#### **Database Password** (データベースパスワード)
- 「Generate a password」をクリックして強力なパスワードを生成
- **⚠️ 重要**: このパスワードをメモ帳などに保存してください!
- 例: `xK9mP2nQ8vL5wR3tY7uZ`

#### **Region** (リージョン)
- **Northeast Asia (Tokyo)** を選択
- 日本に最も近いサーバーで低レイテンシを実現

#### **Pricing Plan** (料金プラン)
- **Free** を選択
- 無料枠の内容:
  - データベース容量: 500MB
  - データ転送: 5GB/月
  - 同時接続数: 60

### 2.3 プロジェクト作成

1. 「Create new project」ボタンをクリック
2. プロジェクトの初期化を待つ (約2-3分)
3. 緑色のチェックマークが表示されたら完了

---

## 🔗 ステップ3: データベース接続情報の取得

### 3.1 接続文字列の確認

1. プロジェクトダッシュボードで左側メニューの「Settings」をクリック
2. 「Database」を選択
3. 「Connection string」セクションまでスクロール

### 3.2 URI形式の接続文字列をコピー

1. 「URI」タブを選択
2. 接続文字列が表示されます:
```
postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres
```

3. 「Copy」ボタンをクリック

### 3.3 パスワードの置き換え

接続文字列の`[YOUR-PASSWORD]`部分を、ステップ2.2で保存したパスワードに置き換えます:

**例:**
```
元の文字列:
postgresql://postgres.abcdefgh:[YOUR-PASSWORD]@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres

置き換え後:
postgresql://postgres.abcdefgh:xK9mP2nQ8vL5wR3tY7uZ@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres
```

**⚠️ 重要**: この完全な接続文字列を安全な場所に保存してください!

---

## 🔧 ステップ4: ローカル環境での接続テスト

### 4.1 環境変数の設定

プロジェクトの`.env`ファイルを編集:

```env
DATABASE_URL="postgresql://postgres.abcdefgh:xK9mP2nQ8vL5wR3tY7uZ@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"
NODE_ENV="development"
```

### 4.2 Prismaクライアントの再生成

ターミナルで以下のコマンドを実行:

```bash
cd /Users/aki/Library/CloudStorage/Dropbox/14_Cursor/02_開発ツール/02_駅伝速報ツール

npx prisma generate
```

### 4.3 データベースマイグレーション

```bash
npx prisma migrate dev --name init
```

**期待される出力:**
```
Environment variables loaded from .env
Prisma schema loaded from prisma/schema.prisma
Datasource "db": PostgreSQL database "postgres", schema "public" at "aws-0-ap-northeast-1.pooler.supabase.com:6543"

Applying migration `20241009000000_init`

The following migration(s) have been created and applied from new schema changes:

migrations/
  └─ 20241009000000_init/
    └─ migration.sql

Your database is now in sync with your schema.

✔ Generated Prisma Client (5.20.0) to ./node_modules/@prisma/client in 123ms
```

### 4.4 初期データの投入

```bash
node prisma/seed.js
```

**期待される出力:**
```
✅ 管理者ユーザーを作成しました
   ユーザー名: admin
   パスワード: password
```

---

## ✅ ステップ5: 接続確認

### 5.1 Prisma Studioでの確認

```bash
npx prisma studio
```

ブラウザで `http://localhost:5555` が開き、データベースの内容を確認できます。

### 5.2 開発サーバーでの確認

```bash
npm run dev
```

ブラウザで `http://localhost:3000/admin/login` にアクセスし、ログインできることを確認:
- ユーザー名: `admin`
- パスワード: `password`

---

## 📊 ステップ6: Supabaseダッシュボードの確認

### 6.1 Table Editorで確認

1. Supabaseダッシュボードで「Table Editor」をクリック
2. 以下のテーブルが作成されていることを確認:
   - `User`
   - `Event`
   - `Team`
   - `Checkpoint`
   - `Record`
   - `_prisma_migrations`

### 6.2 データの確認

1. `User`テーブルを選択
2. `admin`ユーザーが存在することを確認

---

## 🔒 セキュリティのベストプラクティス

### パスワード管理
- データベースパスワードは絶対に公開しない
- `.env`ファイルは`.gitignore`に含める
- 定期的にパスワードを変更 (推奨)

### 接続文字列の保護
- GitHubにプッシュしない
- チームメンバーとは安全な方法で共有
- 本番環境では環境変数として設定

---

## 🐛 トラブルシューティング

### エラー: "Can't reach database server"

**原因**: 接続文字列が間違っている

**解決策**:
1. Supabaseダッシュボードで接続文字列を再確認
2. パスワードが正しく置き換えられているか確認
3. ファイアウォールがポート6543をブロックしていないか確認

### エラー: "password authentication failed"

**原因**: パスワードが間違っている

**解決策**:
1. Supabaseダッシュボードで「Settings」→「Database」
2. 「Reset Database Password」でパスワードをリセット
3. 新しいパスワードで接続文字列を更新

### エラー: "SSL connection required"

**原因**: SSL接続が必要

**解決策**:
接続文字列の末尾に`?sslmode=require`を追加:
```
postgresql://postgres.xxx:password@xxx.supabase.com:6543/postgres?sslmode=require
```

### マイグレーションエラー

**解決策**:
```bash
# データベースをリセット
npx prisma migrate reset

# 再度マイグレーション
npx prisma migrate dev --name init
```

---

## 📈 無料枠の制限

### データベース容量
- **制限**: 500MB
- **76チーム想定**: 約10MB使用
- **余裕**: 十分

### データ転送量
- **制限**: 5GB/月
- **大会1回**: 約160MB
- **余裕**: 月30回以上の大会が可能

### 同時接続数
- **制限**: 60接続
- **76チーム想定**: 約55-206接続
- **注意**: ピーク時は制限に近づく可能性あり

---

## 🎯 次のステップ

Supabaseのセットアップが完了したら、次は:

1. **GitHubリポジトリの作成** → [DEPLOYMENT.md](./DEPLOYMENT.md)のステップ3へ
2. **Railwayへのデプロイ** → [DEPLOYMENT.md](./DEPLOYMENT.md)のステップ4へ

---

## 📞 サポート

Supabaseに関する詳細情報:
- 公式ドキュメント: https://supabase.com/docs
- コミュニティ: https://github.com/supabase/supabase/discussions

---

**セットアップ完了おめでとうございます!🎉**

次は [DEPLOYMENT.md](./DEPLOYMENT.md) に従ってRailwayへのデプロイを進めましょう。

