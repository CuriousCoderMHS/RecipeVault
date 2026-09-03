"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Recipe = {
  id: number;
  title: string;
  description?: string;
  ingredients?: string;
  instructions?: string;
  servings?: number;
  image?: string | null;
  samLikes?: boolean;
  harrietLikes?: boolean;
};

export default function FilterPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [keywords, setKeywords] = useState("");
  const [servings, setServings] = useState<string>("");
  const [samOnly, setSamOnly] = useState(false);
  const [harrietOnly, setHarrietOnly] = useState(false);

  const [results, setResults] = useState<Recipe[]>([]);

  async function fetchResults() {
    setLoading(true);
    setError(null);

    const params = new URLSearchParams();
    if (keywords.trim()) params.set("keywords", keywords.trim());
    if (servings.trim()) params.set("servings", servings.trim());
    if (samOnly) params.set("samLikes", "true");
    if (harrietOnly) params.set("harrietLikes", "true");

    try {
      const res = await fetch(`/api/recipes?${params.toString()}`);
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setResults(data || []);
    } catch (e: any) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // initial load - read any query params and apply them
    const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
    const k = params.get('keywords');
    const s = params.get('servings');
    const sam = params.get('samLikes');
    const har = params.get('harrietLikes');

    if (k) setKeywords(k);
    if (s) setServings(s);
    if (sam === 'true') setSamOnly(true);
    if (har === 'true') setHarrietOnly(true);

    fetchResults();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function applyFilter() {
    fetchResults();
  }

  return (
    <main className="container">
      <h1>Filter Recipes</h1>

      <div style={{ marginBottom: 12 }}>
        <input
          placeholder="Keywords (title, ingredients, instructions)"
          value={keywords}
          onChange={(e) => setKeywords(e.target.value)}
        />
      </div>

      <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
        <div style={{ flex: "0 0 140px" }}>
          <label>Servings</label>
          <br />
          <input
            type="number"
            min={1}
            value={servings}
            onChange={(e) => setServings(e.target.value)}
          />
        </div>

        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <input type="checkbox" checked={samOnly} onChange={(e) => setSamOnly(e.target.checked)} />
            Sam likes
          </label>

          <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <input type="checkbox" checked={harrietOnly} onChange={(e) => setHarrietOnly(e.target.checked)} />
            Harriet likes
          </label>
        </div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <button onClick={applyFilter} disabled={loading}>
          Search
        </button>
        <button
          onClick={() => {
            setKeywords("");
            setServings("");
            setSamOnly(false);
            setHarrietOnly(false);
            fetchResults();
          }}
          style={{ marginLeft: 8 }}
        >
          Reset
        </button>
      </div>

      {loading && <p>Loading recipes…</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      {results.map((recipe) => (
        <div key={recipe.id} className="card">
          {recipe.image ? (
            <img src={recipe.image} alt={recipe.title} />
          ) : null}
          <div className="card-content">
            <h2>
              <Link href={`/recipes/${recipe.id}`}>{recipe.title}</Link>
            </h2>
            {recipe.description && <p>{recipe.description}</p>}
            <small className="servings">
              Serves {recipe.servings ?? "N/A"}
              {(recipe as any).samLikes ? <span className="like-emoji">👦</span> : null}
              {(recipe as any).harrietLikes ? <span className="like-emoji">👧</span> : null}
            </small>
          </div>
        </div>
      ))}
    </main>
  );
}
