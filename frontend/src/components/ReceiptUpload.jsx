// レシート画像のアップロードコンポーネント
// ドラッグ＆ドロップとクリックでのファイル選択に対応

import { useRef, useState } from 'react';

export default function ReceiptUpload({ onAnalyze, isLoading }) {
  const [dragOver, setDragOver] = useState(false);
  const [preview, setPreview] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);

  // ファイルが選択されたときの処理
  const handleFileSelect = (file) => {
    if (!file || !file.type.startsWith('image/')) {
      alert('画像ファイルを選択してください');
      return;
    }
    setSelectedFile(file);
    // プレビュー画像を生成
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target.result);
    reader.readAsDataURL(file);
  };

  const handleInputChange = (e) => {
    const file = e.target.files[0];
    if (file) handleFileSelect(file);
  };

  // ドラッグ＆ドロップの処理
  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => setDragOver(false);

  // 解析ボタンクリック
  const handleAnalyze = () => {
    if (selectedFile) {
      onAnalyze(selectedFile);
    }
  };

  // リセット処理
  const handleReset = () => {
    setSelectedFile(null);
    setPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="receipt-upload">
      <h2>レシートを読み込む</h2>

      {/* ドロップゾーン */}
      <div
        className={`drop-zone ${dragOver ? 'drag-over' : ''} ${preview ? 'has-preview' : ''}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => !preview && fileInputRef.current?.click()}
      >
        {preview ? (
          <div className="preview-container">
            <img src={preview} alt="レシートプレビュー" className="preview-image" />
          </div>
        ) : (
          <div className="drop-zone-content">
            <span className="drop-icon">📄</span>
            <p>クリックまたはドラッグ＆ドロップで<br />レシート画像をアップロード</p>
            <small>JPEG、PNG、WEBP対応（最大10MB）</small>
          </div>
        )}
      </div>

      {/* 非表示のファイル入力 */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleInputChange}
        style={{ display: 'none' }}
      />

      {/* 操作ボタン */}
      {selectedFile && (
        <div className="upload-actions">
          <button
            className="btn btn-secondary"
            onClick={handleReset}
            disabled={isLoading}
          >
            やり直す
          </button>
          <button
            className="btn btn-primary"
            onClick={handleAnalyze}
            disabled={isLoading}
          >
            {isLoading ? '解析中...' : 'レシートを解析'}
          </button>
        </div>
      )}

      {isLoading && (
        <p className="loading-text">Claude AIがレシートを読み取っています...</p>
      )}
    </div>
  );
}
