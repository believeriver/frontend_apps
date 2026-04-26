import { useState, FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

export default function TechSearchBar() {
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('search') ?? '');
  const navigate = useNavigate();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (q) {
      navigate(`/techlog?search=${encodeURIComponent(q)}`);
    } else {
      navigate('/techlog');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="tech-search-form">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="記事を検索..."
        className="tech-search-input"
      />
      <button type="submit" className="tech-search-btn">🔍</button>
    </form>
  );
}
