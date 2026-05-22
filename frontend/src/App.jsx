// 家計簿アプリのメインコンポーネント
// レシートのアップロード・解析・一覧表示・グラフ表示を統括する

import { useEffect, useState } from 'react';
import CategoryChart from './components/CategoryChart';
import ExpenseList from './components/ExpenseList';
import MonthlyChart from './components/MonthlyChart';
import ReceiptUpload from './components/ReceiptUpload';
import './App.css';

// ローカルストレージのキー
const STORAGE_KEY = 'kakeibo_expenses';

// バックエンドの URL（Viteプロキシ経由のため空文字列）
const API_BASE = '';

export default function App() {
  // 支出データ（ローカルストレージから読み込み）
  const [expenses, setExpenses] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // 解析中フラグ
  const [isLoading, setIsLoading] = useState(false);
  // エラーメッセージ
  const [error, setError] = useState(null);
  // 警告メッセージ一覧
  const [warnings, setWarnings] = useState([]);
  // アクティブなタブ
  const [activeTab, setActiveTab] = useState('upload');

  // expenses が変わるたびにローカルストレージへ保存
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
  }, [expenses]);

  // 受け取ったデータを検証して警告リストを返す
  const validateExpense = (data, existingExpenses) => {
    const issues = [];

    // 負の金額チェック：商品単価・合計いずれかが負の場合
    const negativeItems = (data.items || []).filter((item) => item.price < 0);
    if (negativeItems.length > 0 || data.total < 0) {
      const detail = negativeItems.length > 0
        ? negativeItems.map((i) => `${i.name}（¥${i.price.toLocaleString()}）`).join('、')
        : `合計 ¥${data.total.toLocaleString()}`;
      issues.push({ type: 'negative', message: `負の金額が含まれています: ${detail}` });
    }

    // 重複チェック：同一の日付・合計金額が既に登録済みの場合
    const duplicate = existingExpenses.find(
      (e) => e.date === data.date && e.total === data.total
    );
    if (duplicate) {
      issues.push({
        type: 'duplicate',
        message: `同じ日付・金額のレシートが既に登録されています（${data.date} ¥${data.total.toLocaleString()}）`,
      });
    }

    return issues;
  };

  // レシート画像を解析してデータを追加する
  const handleAnalyze = async (imageFile) => {
    setIsLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('image', imageFile);

      const res = await fetch(`${API_BASE}/api/analyze-receipt`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'サーバーエラーが発生しました');
      }

      const { data } = await res.json();

      // 検証を実行
      const issues = validateExpense(data, expenses);
      const duplicateIssue = issues.find((i) => i.type === 'duplicate');
      const negativeIssue = issues.find((i) => i.type === 'negative');

      // 重複がある場合は登録前に確認
      if (duplicateIssue) {
        const confirmed = confirm(
          `⚠️ ${duplicateIssue.message}\n\nそれでも登録しますか？`
        );
        if (!confirmed) return;
      }

      // 一意のIDを付与してデータを追加
      const newExpense = {
        ...data,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
      };

      setExpenses((prev) => [newExpense, ...prev]);

      // 負の金額がある場合は登録後に警告を追加
      if (negativeIssue) {
        setWarnings((prev) => [...prev, negativeIssue.message]);
      }

      setActiveTab('list'); // 登録後は一覧タブへ移動
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // 支出データを削除する
  const handleDelete = (id) => {
    if (confirm('このデータを削除しますか？')) {
      setExpenses((prev) => prev.filter((e) => e.id !== id));
    }
  };

  // タブの定義
  const tabs = [
    { id: 'upload', label: '📄 読み込み' },
    { id: 'list', label: `📋 一覧 (${expenses.length})` },
    { id: 'chart', label: '📊 グラフ' },
  ];

  return (
    <div className="app">
      <header className="app-header">
        <h1>🏠 家計簿アプリ</h1>
        <p>レシートを読み込んで支出を管理しましょう</p>
      </header>

      {/* タブナビゲーション */}
      <nav className="tab-nav">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {/* エラー表示 */}
      {error && (
        <div className="error-banner">
          <span>⚠️ {error}</span>
          <button onClick={() => setError(null)}>✕</button>
        </div>
      )}

      {/* 警告表示（複数件対応） */}
      {warnings.map((msg, idx) => (
        <div key={idx} className="warning-banner">
          <span>⚠️ {msg}</span>
          <button onClick={() => setWarnings((prev) => prev.filter((_, i) => i !== idx))}>✕</button>
        </div>
      ))}

      {/* タブコンテンツ */}
      <main className="app-main">
        {activeTab === 'upload' && (
          <ReceiptUpload onAnalyze={handleAnalyze} isLoading={isLoading} />
        )}

        {activeTab === 'list' && (
          <ExpenseList expenses={expenses} onDelete={handleDelete} />
        )}

        {activeTab === 'chart' && (
          <div className="charts-grid">
            <CategoryChart expenses={expenses} />
            <MonthlyChart expenses={expenses} />
          </div>
        )}
      </main>
    </div>
  );
}
