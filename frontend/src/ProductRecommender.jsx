import React, { useState, useMemo, useRef, useEffect } from "react";

const PRODUCTS = [
  { id: "p1", name: "Pixel Lite 5G", category: "Phone", price: 349, specs: "6.1\" OLED · 128GB · 48MP camera", blurb: "Budget-friendly daily driver with a clean feature set." },
  { id: "p2", name: "Vertex X12", category: "Phone", price: 899, specs: "6.7\" AMOLED · 256GB · Triple camera", blurb: "Flagship performance for power users and creators." },
  { id: "p3", name: "Nova Slate 4", category: "Phone", price: 479, specs: "6.4\" LCD · 128GB · Dual camera", blurb: "Great cameras and battery life without flagship pricing." },
  { id: "p4", name: "Orbit Mini", category: "Phone", price: 229, specs: "5.8\" HD+ · 64GB · Single camera", blurb: "A no-frills phone for calls, messages, and browsing." },
  { id: "p5", name: "AirNote 13", category: "Laptop", price: 999, specs: "13\" · 16GB RAM · 512GB SSD", blurb: "Thin, light, and fast enough for everyday multitasking." },
  { id: "p6", name: "ForgeBook Pro", category: "Laptop", price: 1499, specs: "15\" · 32GB RAM · 1TB SSD · GPU", blurb: "Built for video editing, 3D work, and heavier workloads." },
  { id: "p7", name: "StudyPad Go", category: "Laptop", price: 429, specs: "11\" · 8GB RAM · 256GB SSD", blurb: "An affordable laptop for students and browsing-heavy tasks." },
  { id: "p8", name: "EchoBuds Pro", category: "Audio", price: 149, specs: "ANC · 30hr battery · Wireless charging", blurb: "Noise-cancelling earbuds for commutes and calls." },
  { id: "p9", name: "BassLine Over-Ear", category: "Audio", price: 89, specs: "Wired/BT hybrid · 40hr battery", blurb: "Warm, bass-forward sound for music lovers on a budget." },
  { id: "p10", name: "PulseFit Watch", category: "Wearable", price: 179, specs: "Heart rate · SpO2 · 7-day battery", blurb: "Everyday fitness tracking without the smartwatch price tag." },
  { id: "p11", name: "ChronoWatch Ultra", category: "Wearable", price: 399, specs: "GPS · Cellular · Titanium case", blurb: "A premium wearable for serious training and travel." },
  { id: "p12", name: "LensCraft Z2", category: "Camera", price: 649, specs: "24MP · 4K30 video · Interchangeable lens", blurb: "A mirrorless camera for hobbyists stepping up from a phone." },
];

const CATEGORIES = ["All", ...Array.from(new Set(PRODUCTS.map((p) => p.category)))];

async function callBackend(query, catalog) {
  const res = await fetch("http://localhost:3001/api/recommend", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, catalog }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Backend request failed (${res.status})`);
  }
  const data = await res.json();
  if (!data || !Array.isArray(data.recommendations)) {
    throw new Error("Unexpected response shape from backend.");
  }
  return data.recommendations;
}

export default function ProductRecommender() {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [status, setStatus] = useState("idle");
  const [recommendations, setRecommendations] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const resultsRef = useRef(null);

  const visibleProducts = useMemo(() => {
    if (activeCategory === "All") return PRODUCTS;
    return PRODUCTS.filter((p) => p.category === activeCategory);
  }, [activeCategory]);

  useEffect(() => {
    if (status === "done" && resultsRef.current) {
      resultsRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [status]);

  async function handleAsk() {
    if (!query.trim()) return;
    setStatus("loading");
    setErrorMsg("");
    try {
      const recs = await callBackend(query.trim(), PRODUCTS);
      const map = {};
      recs.forEach((r) => { map[r.id] = r.reason; });
      setRecommendations(map);
      setStatus("done");
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || "Something went wrong reaching the AI.");
      setStatus("error");
    }
  }

  function handleKeyDown(e) {
    if (e.key === "Enter") handleAsk();
  }

  function clearRecommendations() {
    setRecommendations(null);
    setStatus("idle");
    setQuery("");
  }

  const matchCount = recommendations ? Object.keys(recommendations).length : 0;

  return (
    <div style={styles.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@400;600&display=swap');
        * { box-sizing: border-box; }
        .catalog-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(230px, 1fr)); gap: 18px; }
        .cat-btn:hover { border-color: #22293B !important; }
        .ask-btn:hover:not(:disabled) { transform: translateY(-1px); }
        .card { transition: transform .15s ease, box-shadow .15s ease; }
        .card:hover { transform: translateY(-2px); box-shadow: 0 6px 0 #C9BFA4; }
      `}</style>

      <header style={styles.header}>
        <div style={styles.eyebrow}>CATALOG · AI SHOPPING ASSISTANT</div>
        <h1 style={styles.h1}>Tell it what you need.<br/>It'll mark up the catalog.</h1>
        <p style={styles.subtext}>
          Describe what you're after — budget, category, features — and the assistant
          highlights matches straight from the sheet below.
        </p>
      </header>

      <div style={styles.askBar}>
        <textarea
          style={styles.textarea}
          placeholder='e.g. "I want a phone under $500 with a good camera"'
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={2}
        />
        <div style={styles.askRow}>
          <button
            className="ask-btn"
            style={{ ...styles.askBtn, opacity: status === "loading" ? 0.7 : 1 }}
            onClick={handleAsk}
            disabled={status === "loading" || !query.trim()}
          >
            {status === "loading" ? "Reading the catalog…" : "Find matches"}
          </button>
          {recommendations && (
            <button style={styles.clearBtn} onClick={clearRecommendations}>
              Clear highlights
            </button>
          )}
        </div>
        {status === "error" && (
          <div style={styles.errorBox}>Couldn't reach the assistant: {errorMsg}</div>
        )}
        {status === "done" && (
          <div ref={resultsRef} style={styles.resultSummary}>
            {matchCount > 0
              ? `${matchCount} match${matchCount === 1 ? "" : "es"} highlighted below.`
              : "No matches found — try loosening the budget or category."}
          </div>
        )}
      </div>

      <div style={styles.filterRow}>
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            className="cat-btn"
            onClick={() => setActiveCategory(cat)}
            style={{ ...styles.catBtn, ...(activeCategory === cat ? styles.catBtnActive : {}) }}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="catalog-grid">
        {visibleProducts.map((p) => {
          const isMatch = recommendations && recommendations[p.id] !== undefined;
          return (
            <div key={p.id} className="card" style={{ ...styles.card, ...(isMatch ? styles.cardMatch : {}) }}>
              {isMatch && <div style={styles.highlightBand} />}
              <div style={styles.cardTop}>
                <span style={styles.cardCategory}>{p.category}</span>
                <span style={styles.cardPrice}>${p.price}</span>
              </div>
              <h3 style={styles.cardName}>{p.name}</h3>
              <p style={styles.cardSpecs}>{p.specs}</p>
              <p style={styles.cardBlurb}>{p.blurb}</p>
              {isMatch && (
                <div style={styles.stickyNote}>
                  <span style={styles.stickyNoteLabel}>AI pick</span>
                  {recommendations[p.id]}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

const INK = "#22293B";
const PAPER = "#EAE3D2";
const HIGHLIGHT = "#F4C24C";
const TEAL = "#2F6E62";
const LINE = "#C9BFA4";
const MUTED = "#6B6455";

const styles = {
  page: { fontFamily: "'Inter', sans-serif", background: PAPER, color: INK, padding: "40px 32px 64px", minHeight: "100vh" },
  header: { maxWidth: 720, marginBottom: 32 },
  eyebrow: { fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, letterSpacing: "0.12em", color: TEAL, marginBottom: 10, fontWeight: 600 },
 h1: { fontFamily: "'Space Grotesk', sans-serif", fontSize: "clamp(28px, 4vw, 40px)", lineHeight: 1.15, margin: "0 0 14px", fontWeight: 700, color: "#22293B" },
  subtext: { fontSize: 15, lineHeight: 1.6, color: MUTED, margin: 0, maxWidth: 560 },
  askBar: { background: "#F5F0E4", border: `1.5px solid ${INK}`, borderRadius: 4, padding: 18, maxWidth: 720, marginBottom: 28, boxShadow: `4px 4px 0 ${LINE}` },
  textarea: { width: "100%", fontFamily: "'IBM Plex Mono', monospace", fontSize: 14, padding: 12, border: `1px solid ${LINE}`, borderRadius: 3, background: "#FFFDF7", color: INK, resize: "vertical" },
  askRow: { display: "flex", gap: 10, marginTop: 12, alignItems: "center" },
  askBtn: { fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 14, padding: "10px 20px", background: TEAL, color: "#FFFDF7", border: "none", borderRadius: 3, cursor: "pointer" },
  clearBtn: { fontFamily: "'Inter', sans-serif", fontSize: 13, padding: "10px 16px", background: "transparent", color: MUTED, border: `1px solid ${LINE}`, borderRadius: 3, cursor: "pointer" },
  errorBox: { marginTop: 12, fontSize: 13, color: "#7A2E2E", fontFamily: "'IBM Plex Mono', monospace" },
  resultSummary: { marginTop: 12, fontSize: 13, fontFamily: "'IBM Plex Mono', monospace", color: TEAL },
  filterRow: { display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" },
  catBtn: { fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, padding: "6px 14px", borderRadius: 20, border: `1px solid ${LINE}`, background: "transparent", color: INK, cursor: "pointer" },
  catBtnActive: { background: INK, color: PAPER, borderColor: INK },
  card: { position: "relative", background: "#FFFDF7", border: `1px solid ${LINE}`, borderRadius: 4, padding: "16px 16px 18px", boxShadow: `3px 3px 0 ${LINE}`, overflow: "hidden" },
  cardMatch: { borderColor: INK, boxShadow: `3px 3px 0 ${INK}` },
  highlightBand: { position: "absolute", top: 0, left: 0, right: 0, height: 6, background: HIGHLIGHT },
  cardTop: { display: "flex", justifyContent: "space-between", marginBottom: 8, marginTop: 6 },
  cardCategory: { fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: MUTED, letterSpacing: "0.05em", textTransform: "uppercase" },
  cardPrice: { fontFamily: "'IBM Plex Mono', monospace", fontSize: 13, fontWeight: 600, color: INK },
  cardName: { fontFamily: "'Space Grotesk', sans-serif", fontSize: 17, margin: "0 0 6px", fontWeight: 700 },
  cardSpecs: { fontFamily: "'IBM Plex Mono', monospace", fontSize: 11.5, color: MUTED, margin: "0 0 8px", lineHeight: 1.5 },
  cardBlurb: { fontSize: 13.5, color: INK, margin: 0, lineHeight: 1.5 },
  stickyNote: { marginTop: 12, background: HIGHLIGHT, color: "#3A2E05", fontSize: 12.5, padding: "8px 10px", borderRadius: 2, lineHeight: 1.4, transform: "rotate(-0.6deg)", boxShadow: "2px 2px 0 rgba(34,41,59,0.15)" },
  stickyNoteLabel: { display: "block", fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", marginBottom: 2, textTransform: "uppercase" },
};