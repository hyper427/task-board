// 月別支出棒グラフコンポーネント
// Chart.js を使って月ごとの支出推移を可視化する

import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Title,
  Tooltip,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

// 必要な Chart.js コンポーネントを登録
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function MonthlyChart({ expenses }) {
  if (expenses.length === 0) {
    return (
      <div className="chart-container">
        <h2>月別支出</h2>
        <p className="empty-message">データがありません</p>
      </div>
    );
  }

  // 月別に金額を集計（YYYY-MM をキーとして使用）
  const monthlyTotals = {};
  expenses.forEach((expense) => {
    const month = expense.date.substring(0, 7); // "YYYY-MM" を取得
    monthlyTotals[month] = (monthlyTotals[month] || 0) + expense.total;
  });

  // 月を昇順に並べ替え
  const sortedMonths = Object.keys(monthlyTotals).sort();
  const totals = sortedMonths.map((m) => monthlyTotals[m]);

  // 月のラベルを日本語形式に変換（例: "2024-03" → "2024年3月"）
  const labels = sortedMonths.map((m) => {
    const [year, month] = m.split('-');
    return `${year}年${parseInt(month)}月`;
  });

  const chartData = {
    labels,
    datasets: [
      {
        label: '支出合計',
        data: totals,
        backgroundColor: 'rgba(99, 132, 255, 0.7)',
        borderColor: 'rgba(99, 132, 255, 1)',
        borderWidth: 2,
        borderRadius: 4,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) => ` ¥${ctx.parsed.y.toLocaleString()}`,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value) => `¥${value.toLocaleString()}`,
        },
      },
    },
  };

  return (
    <div className="chart-container">
      <h2>月別支出</h2>
      <div className="bar-chart-wrapper">
        <Bar data={chartData} options={options} />
      </div>
    </div>
  );
}
