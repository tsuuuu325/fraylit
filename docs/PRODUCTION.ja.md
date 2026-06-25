# Fraylit 本番公開ガイド

## 事前準備チェックリスト

- [ ] テスト投稿を削除（`supabase/cleanup-before-launch.sql` を Run）
- [ ] 通知機能を使う場合 `supabase/notifications.sql` を Run 済み
- [ ] ローカルで `npm run build` が成功する
- [ ] `.env.local` は Git に含めない（`.gitignore` 済み）

---

## Step 1 — テストデータ削除（Supabase）

1. https://supabase.com/dashboard → プロジェクトを開く
2. **SQL Editor** → **New query**
3. 以下を貼り付け → **Run**

```sql
DELETE FROM public.posts;
```

---

## Step 2 — GitHub にコードを上げる

PowerShell（プロジェクトフォルダ内）:

```powershell
cd C:\Users\shoot\OneDrive\Desktop\fraylit
git init
git add .
git commit -m "Prepare Fraylit for production launch"
```

GitHub で新しい **空のリポジトリ**（README なし）を作成し:

```powershell
git branch -M main
git remote add origin https://github.com/あなたのユーザー名/fraylit.git
git push -u origin main
```

---

## Step 3 — Vercel にデプロイ

1. https://vercel.com にログイン
2. **Add New…** → **Project**
3. GitHub の `fraylit` を **Import**
4. **Environment Variables** を追加:

| Name | Value |
|------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://wtmoysrldvqjawshwris.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Settings → API → anon public |
| `NEXT_PUBLIC_SITE_URL` | デプロイ後の URL（例: `https://fraylit.vercel.app`） |

5. **Deploy** をクリック
6. 完了後、表示された URL をコピー（例: `https://fraylit-xxx.vercel.app`）

**重要:** 初回デプロイ後、`NEXT_PUBLIC_SITE_URL` を実際の URL に更新して **Redeploy** してください。

---

## Step 4 — Supabase の URL 設定

**Authentication** → **URL Configuration**

**Site URL**（本番 URL に変更）:

```
https://fraylit-xxx.vercel.app
```

**Redirect URLs** に追加:

```
https://fraylit-xxx.vercel.app/auth/callback
http://localhost:3000/auth/callback
```

（ローカル開発も続けるなら localhost は残す）

---

## Step 5 — Google OAuth（本番確認）

Google Cloud の **承認済みリダイレクト URI** は Supabase の Callback URL のままで OK:

```
https://wtmoysrldvqjawshwris.supabase.co/auth/v1/callback
```

変更不要。Supabase 経由で Google ログインが動きます。

---

## Step 6 — 本番動作確認

- [ ] トップページが開く
- [ ] 新規登録 / ログイン
- [ ] Google ログイン
- [ ] 投稿作成
- [ ] いいね・コメント
- [ ] 通知ベル（notifications.sql 実行済みの場合）
- [ ] 言語切替

---

## トラブルシューティング

| 症状 | 対処 |
|------|------|
| タイムラインエラー | Supabase で `schema.sql` を Run |
| Google ログイン失敗 | Redirect URLs に本番 `/auth/callback` があるか確認 |
| OAuth 後に login に戻る | `NEXT_PUBLIC_SITE_URL` が本番 URL と一致しているか確認 |
| 通知が来ない | `notifications.sql` を Run |

---

## おすすめ（任意）

- プロジェクトを OneDrive 外（例: `C:\dev\fraylit`）に移すと開発が安定
- 本番前に Supabase **Authentication → Email → Confirm email** の設定を決める
- カスタムドメインは Vercel → Project → **Domains** から追加
