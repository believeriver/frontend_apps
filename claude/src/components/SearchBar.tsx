import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';

export default function SearchBar() {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const code = query.trim();
    if (code) {
      navigate(`/stock/${code}`);
      setQuery('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="search-form">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="銘柄コードを入力 (例: 8963)"
        className="search-input"
      />
      <button type="submit" className="search-btn">検索</button>
    </form>
  );
}
