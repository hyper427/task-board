// 家計簿アプリ バックエンドサーバー
// Express + Claude API（ビジョン）でレシート画像を解析する

import Anthropic from '@anthropic-ai/sdk';
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import multer from 'multer';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Anthropic クライアントの初期化
const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// CORS 設定（フロントエンドからのリクエストを許可）
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
}));

app.use(express.json());

// multer 設定（画像をメモリに保存）
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 最大 10MB
  fileFilter: (_req, file, cb) => {
    // 画像ファイルのみ許可
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('画像ファイルのみアップロード可能です'));
    }
  },
});

// レシート解析用のシステムプロンプト
// プロンプトキャッシュを使って API コストを削減する
const SYSTEM_PROMPT = `あなたはレシートの内容を正確に読み取る専門アシスタントです。
レシート画像から以下の情報を抽出し、必ず JSON 形式のみで返してください。

抽出する情報:
- date: 購入日（YYYY-MM-DD形式、不明な場合は今日の日付）
- store: 店舗名（不明な場合は「不明」）
- items: 商品一覧（配列）
  - name: 商品名
  - price: 金額（数値、円）
  - category: カテゴリ（以下から選択）
- total: 合計金額（数値、円）

カテゴリの選択肢:
- 食費（スーパー、コンビニの食品・飲料など）
- 外食（レストラン、カフェ、ファストフードなど）
- 日用品（洗剤、トイレットペーパーなど生活用品）
- 交通費（電車、バス、タクシーなど）
- 娯楽（書籍、映画、ゲームなど）
- 医療費（薬、病院など）
- 衣服（洋服、靴など）
- その他（上記に当てはまらないもの）

レスポンスは必ず以下の JSON 形式のみで返してください（説明文や追加テキストは不要）:
{
  "date": "YYYY-MM-DD",
  "store": "店舗名",
  "items": [
    { "name": "商品名", "price": 金額, "category": "カテゴリ" }
  ],
  "total": 合計金額
}`;

// レシート画像解析エンドポイント
app.post('/api/analyze-receipt', upload.single('image'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: '画像ファイルが必要です' });
  }

  try {
    // 画像を Base64 エンコード
    const imageBase64 = req.file.buffer.toString('base64');
    const mediaType = req.file.mimetype;

    // Claude API でレシートを解析（プロンプトキャッシュ有効）
    const response = await client.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 1024,
      system: [
        {
          type: 'text',
          text: SYSTEM_PROMPT,
          // システムプロンプトをキャッシュして API コストを削減
          cache_control: { type: 'ephemeral' },
        },
      ],
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mediaType,
                data: imageBase64,
              },
            },
            {
              type: 'text',
              text: 'このレシートの内容をJSON形式で抽出してください。',
            },
          ],
        },
      ],
    });

    // Claude のレスポンスから JSON を抽出
    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('予期しないレスポンス形式です');
    }

    let parsedData;
    try {
      // マークダウンのコードブロック（```json ... ```）を除去してパース
      const jsonText = content.text
        .replace(/^```(?:json)?\s*/i, '')
        .replace(/\s*```\s*$/, '')
        .trim();
      parsedData = JSON.parse(jsonText);
    } catch {
      throw new Error('JSONの解析に失敗しました: ' + content.text);
    }

    res.json({ success: true, data: parsedData });
  } catch (error) {
    console.error('レシート解析エラー:', error);
    res.status(500).json({
      error: 'レシートの解析に失敗しました',
      details: error.message,
    });
  }
});

// ヘルスチェックエンドポイント
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', message: 'サーバーは正常に動作しています' });
});

app.listen(PORT, () => {
  console.log(`サーバーが起動しました: http://localhost:${PORT}`);
});
