// カテゴリ別円グラフコンポーネント
// Chart.js を使ってカテゴリ別支出割合を可視化する

import { ArcElement, Chart as ChartJS, Legend, Tooltip } from 'chart.js';
import { Pie } from 'react-chartjs-2';

// 必要な Chart.js コンポーネントを登録
ChartJS.register(ArcElement, Tooltip, Legend);

// カテゴリ別の色定義
const CATEGORY_COLORS = {
  食費: '#FF6384',
  外食: '#FF9F40',
  日用品: '#FFCD56',
  交通費: '#4BC0C0',
  娯楽: '#9966FF',
  医療費: '#36A2EB',
  衣服: '#FF6384',
  その他: '#C9CBCF',
};

export default function CategoryChart({ expenses }) {
  if (expenses.length === 0) {
    return (
      <div className="chart-container">
        <h2>カテゴリ別支出</h2>
        <p className="empty-message">データがありません</p>
      </div>
    );
  }

  // カテゴリ別に金額を集計
  const categoryTotals = {};
  expenses.forEach((expense) => {
    expense.items.forEach((item) => {
      categoryTotals[item.category] = (categoryTotals[item.category] || 0) + item.price;
    });
  });

  const labels = Object.keys(categoryTotals);
  const data = Object.values(categoryTotals);
  const colors = labels.map((cat) => CATEGORY_COLORS[cat] || '#C9CBCF');

  const chartData = {
    labels,
    datasets: [
      {
        data,
        backgroundColor: colors,
        borderColor: colors.map((c) => c + 'CC'),
        borderWidth: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          font: { size: 12 },
          padding: 16,
        },
      },
      tooltip: {
        callbacks: {
          label: (ctx) => ` ¥${ctx.parsed.toLocaleString()}`,
        },
      },
    },
  };

  // 合計金額
  const total = data.reduce((sum, v) => sum + v, 0);

  return (
    <div className="chart-container">
      <h2>カテゴリ別支出</h2>
      <p className="chart-total">合計: ¥{total.toLocaleString()}</p>
      <div className="pie-chart-wrapper">
        <Pie data={chartData} options={options} />
      </div>
      {/* カテゴリ別金額一覧 */}
      <div className="category-summary">
        {labels.map((cat, i) => (
          <div key={cat} className="category-row">
            <span className="category-dot" style={{ backgroundColor: colors[i] }} />
            <span className="category-name">{cat}</span>
            <span className="category-amount">¥{data[i].toLocaleString()}</span>
            <span className="category-percent">
              ({Math.round((data[i] / total) * 100)}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
