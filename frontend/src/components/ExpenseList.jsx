// 支出一覧表示コンポーネント
// 登録されたレシートデータを日付順に表示し、削除も可能

// カテゴリに対応する絵文字
const CATEGORY_EMOJI = {
  食費: '🛒',
  外食: '🍽️',
  日用品: '🧹',
  交通費: '🚃',
  娯楽: '🎮',
  医療費: '💊',
  衣服: '👕',
  その他: '📦',
};

export default function ExpenseList({ expenses, onDelete }) {
  if (expenses.length === 0) {
    return (
      <div className="expense-list empty">
        <h2>支出履歴</h2>
        <p className="empty-message">まだデータがありません。レシートをアップロードして登録してください。</p>
      </div>
    );
  }

  // 日付の新しい順に並べ替え
  const sorted = [...expenses].sort((a, b) => new Date(b.date) - new Date(a.date));

  // 合計金額を計算
  const totalAmount = expenses.reduce((sum, e) => sum + e.total, 0);

  return (
    <div className="expense-list">
      <div className="expense-list-header">
        <h2>支出履歴</h2>
        <span className="total-badge">合計: ¥{totalAmount.toLocaleString()}</span>
      </div>

      <div className="expense-cards">
        {sorted.map((expense) => (
          <div key={expense.id} className="expense-card">
            {/* カードヘッダー */}
            <div className="expense-card-header">
              <div>
                <span className="expense-store">{expense.store}</span>
                <span className="expense-date">{expense.date}</span>
              </div>
              <div className="expense-card-right">
                <span className="expense-total">¥{expense.total.toLocaleString()}</span>
                <button
                  className="btn-delete"
                  onClick={() => onDelete(expense.id)}
                  aria-label="削除"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* 商品一覧 */}
            <div className="expense-items">
              {expense.items.map((item, idx) => (
                <div key={idx} className="expense-item">
                  <span className="item-category">
                    {CATEGORY_EMOJI[item.category] || '📦'} {item.category}
                  </span>
                  <span className="item-name">{item.name}</span>
                  <span className="item-price">¥{item.price.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
