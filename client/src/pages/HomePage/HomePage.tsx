import { useState } from 'react';
import './HomePage.css'; // 通常のCSSファイルをインポート

const HomePage = () => {
  const [data, setData] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('http://localhost:3000/http'); 
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result = await response.json();
      setData(JSON.stringify(result, null, 2));
    } catch (err) {
      setError(err instanceof Error ? err.message : '不明なエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="home-page-container"> {/* CSSクラス名を適用 */}
      <h1>HTTP API Test</h1>
      <button 
        onClick={fetchData}
        disabled={loading}
        className="home-page-fetch-button" /* CSSクラス名を適用 */
      >
        {loading ? '10秒処理を実行中...' : 'HTTP API (10秒遅延) をテスト'}
      </button>

      {error && <p className="home-page-error">エラー: {error}</p>} {/* CSSクラス名を適用 */}
      {data && (
        <div>
          <h2>受信データ:</h2>
          <pre className="home-page-data">{data}</pre> {/* CSSクラス名を適用 */}
        </div>
      )}
    </div>
  );
};

export default HomePage; 