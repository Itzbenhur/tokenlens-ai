import { useEffect, useMemo, useState } from 'react';

function Icon({ name }) {
  const paths = {
    lens: <><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/><path d="M8 11h6M11 8v6"/></>,
    upload: <><path d="M12 16V4"/><path d="m7 9 5-5 5 5"/><path d="M4 20h16"/></>,
    spark: <><path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z"/><path d="m19 15 .8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15Z"/></>,
    chart: <><path d="M4 19V5"/><path d="M4 19h17"/><path d="m7 15 4-4 3 2 5-7"/></>,
    shield: <><path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z"/><path d="m9 12 2 2 4-4"/></>,
    arrow: <><path d="M7 17 17 7"/><path d="M7 7h10v10"/></>,
    file: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6M8 13h8M8 17h8"/></>
  };
  return <svg viewBox="0 0 24 24" className="icon" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">{paths[name] || paths.lens}</svg>;
}

function Bar({ item, max }) {
  return <div className="allocation-row">
    <div className="allocation-meta"><span>{item.category}</span><strong>{item.percentage.toFixed(2)}%</strong></div>
    <div className="bar-track"><div className="bar-fill" style={{ width: `${Math.max(1, item.tokens / max * 100)}%` }} /></div>
    <div className="allocation-amount">{Number(item.tokens).toLocaleString()} tokens</div>
  </div>;
}

export default function App() {
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [report, setReport] = useState(null);
  const [error, setError] = useState('');
  const [health, setHealth] = useState(null);
  const [drag, setDrag] = useState(false);

  useEffect(() => {
    fetch('/api/health').then(r => r.json()).then(setHealth).catch(() => setHealth({ sandbox: 'unknown', aiEnabled: false }));
  }, []);

  const result = report?.result;
  const maxTokens = useMemo(() => Math.max(1, ...(result?.allocations || []).map(x => x.tokens)), [result]);

  function selectFile(f) {
    if (!f) return;
    if (!f.name.toLowerCase().endsWith('.csv')) {
      setError('Please choose a CSV file.');
      return;
    }
    setFile(f);
    setError('');
    setReport(null);
  }

  async function analyze() {
    if (!file) { setError('Choose a tokenomics CSV first.'); return; }
    setBusy(true); setError(''); setReport(null);
    try {
      const form = new FormData();
      form.append('file', file);
      const response = await fetch('/api/analyze', { method: 'POST', body: form });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Analysis failed.');
      setReport(data);
    } catch (e) {
      setError(`${e.message} ${e.message.includes('fetch') ? 'Make sure both app services are running with npm run dev.' : ''}`);
    } finally { setBusy(false); }
  }

  async function loadSample() {
    try {
      const r = await fetch('/api/sample.csv');
      const blob = await r.blob();
      selectFile(new File([blob], 'sample-tokenomics.csv', { type: 'text/csv' }));
    } catch { setError('Could not load sample CSV.'); }
  }

  function downloadReport() {
    if (!report) return;
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'tokenlens-report.json'; a.click();
    URL.revokeObjectURL(url);
  }

  return <div className="app-shell">
    <header className="topbar">
      <a className="brand" href="#"><span className="brand-mark"><Icon name="lens" /></span><span>TokenLens<span className="brand-ai"> AI</span></span></a>
      <div className="top-right"><span className="live-dot" /> SANDBOX-POWERED ANALYSIS <span className="version">BETA</span></div>
    </header>

    <main>
      <section className="hero">
        <div className="eyebrow"><span className="eyebrow-line" /> TOKENOMICS, MADE LEGIBLE</div>
        <h1>See the story<br />behind the <span>token supply.</span></h1>
        <p className="hero-copy">Drop in a tokenomics CSV. TokenLens writes and runs Python analysis in an isolated CreateOS sandbox, then turns the numbers into a report humans can actually understand.</p>
        <div className="hero-pills"><span><Icon name="shield" /> Isolated execution</span><span><Icon name="chart" /> Allocation breakdown</span><span><Icon name="spark" /> Plain-English insights</span></div>
      </section>

      <section className="workspace">
        <div className="section-head"><div><div className="section-kicker">01 / YOUR DATA</div><h2>Analyze a token</h2></div><button className="text-button" onClick={loadSample}>Try sample data <Icon name="arrow" /></button></div>
        <div className={`dropzone ${drag ? 'dragging' : ''} ${file ? 'has-file' : ''}`}
          onDragOver={e => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={e => { e.preventDefault(); setDrag(false); selectFile(e.dataTransfer.files?.[0]); }}>
          <input id="csv-file" type="file" accept=".csv,text/csv" onChange={e => selectFile(e.target.files?.[0])} />
          <label htmlFor="csv-file" className="upload-icon"><Icon name={file ? 'file' : 'upload'} /></label>
          {file ? <><strong>{file.name}</strong><span>{(file.size / 1024).toFixed(1)} KB · Ready to analyze</span></> :
            <><strong>Drop your CSV here</strong><span>or click to browse · CSV only · max 5 MB</span></>}
          <div className="csv-hint">Expected columns: <code>category</code> and <code>tokens</code>. Unlock data can use <code>unlock_date</code> and <code>unlock_amount</code>.</div>
        </div>
        <div className="actions-row">
          <div className="privacy-note"><Icon name="shield" /><span>Your file is sent to your private sandbox for analysis.</span></div>
          <button className="primary-button" disabled={busy || !file} onClick={analyze}>{busy ? <><span className="spinner" /> Running agent...</> : <>Analyze tokenomics <Icon name="arrow" /></>}</button>
        </div>
        {error && <div className="error-box">{error}</div>}
        <div className="system-status">
          <div className="status-item"><span className={`status-dot ${health?.sandbox === 'reachable' ? 'green' : 'amber'}`} /><div><small>CREATEOS SANDBOX</small><strong>{health?.sandbox === 'reachable' ? 'Connected' : health?.sandbox === 'unavailable' ? 'Needs attention' : 'Checking status'}</strong></div></div>
          <div className="status-item"><span className={`status-dot ${health?.aiEnabled ? 'green' : 'amber'}`} /><div><small>AI EXPLANATION MODEL</small><strong>{health?.aiEnabled ? 'Connected' : 'Not configured'}</strong></div></div>
          <div className="status-caption">{health?.aiEnabled ? 'Model-powered summaries enabled' : 'Python analysis works; add an API key to enable model-written explanations'}</div>
        </div>
      </section>

      {busy && <section className="working-card"><div className="working-icon"><Icon name="spark" /></div><div><strong>Agent is working on your data</strong><p>Preparing analysis code → uploading it to CreateOS → running Python → collecting results.</p></div><div className="working-loader" /></section>}

      {report && result && <section className="results" id="results">
        <div className="results-heading"><div><div className="section-kicker">02 / AGENT REPORT</div><h2>{report.explanation?.headline || 'Your analysis is ready'}</h2><p>{report.explanation?.summary}</p></div><button className="outline-button" onClick={downloadReport}>Export report <Icon name="arrow" /></button></div>
        <div className="metric-grid">
          <div className="metric-card"><span>RECORDED TOKEN AMOUNT</span><strong>{Number(result.total_recorded_tokens).toLocaleString()}</strong><small>Across valid CSV rows</small></div>
          <div className="metric-card"><span>ALLOCATION CATEGORIES</span><strong>{result.category_count}</strong><small>Distinct groups detected</small></div>
          <div className="metric-card"><span>TOP 3 SHARE</span><strong>{result.top_three_share_percent}%</strong><small>Combined allocation share</small></div>
          <div className="metric-card"><span>CONCENTRATION CHECK</span><strong className="metric-label">{result.concentration_label}</strong><small>Heuristic, not a safety rating</small></div>
        </div>
        <div className="report-grid">
          <div className="panel allocation-panel"><div className="panel-title"><div><div className="section-kicker">DISTRIBUTION</div><h3>Where tokens are allocated</h3></div><span className="panel-chip">PYTHON OUTPUT</span></div>
            {result.allocations.map(item => <Bar key={item.category} item={item} max={maxTokens} />)}
          </div>
          <div className="panel insight-panel"><div className="section-kicker">AGENT INSIGHTS</div><h3>What stands out</h3>
            {(report.explanation?.findings || result.observations || []).map((item, i) => <div className="insight" key={i}><span className="insight-number">0{i + 1}</span><p>{item}</p></div>)}
            {(report.explanation?.caveats || []).map((item, i) => <div className="caveat" key={i}><Icon name="shield" /><span>{item}</span></div>)}
          </div>
        </div>
        {result.upcoming_unlocks?.length > 0 && <div className="panel unlock-panel"><div className="section-kicker">UNLOCK SCHEDULE</div><h3>Upcoming dated unlocks</h3><div className="unlock-list">{result.upcoming_unlocks.map((u, i) => <div key={i} className="unlock-row"><span>{u.date}</span><strong>{Number(u.amount).toLocaleString()} tokens</strong></div>)}</div></div>}
        <div className="footnote"><Icon name="shield" /> This report only reflects the supplied CSV. It cannot confirm that allocations are complete, predict price, or determine whether a token is safe.</div>
      </section>}

      <section className="how-section"><div className="section-kicker">BUILT FOR CLARITY</div><h2>Not another token dashboard.</h2><div className="how-grid"><div><span className="how-icon"><Icon name="file" /></span><strong>Read the data</strong><p>Accepts ordinary CSVs instead of requiring a complicated tokenomics platform.</p></div><div><span className="how-icon"><Icon name="spark" /></span><strong>Write and run code</strong><p>The agent prepares a Python analysis script and executes it inside the CreateOS Sandbox.</p></div><div><span className="how-icon"><Icon name="chart" /></span><strong>Explain the result</strong><p>Allocation percentages and concentration checks are presented with readable context.</p></div></div></section>
    </main>
    <footer><a className="brand footer-brand" href="#"><span className="brand-mark"><Icon name="lens" /></span><span>TokenLens<span className="brand-ai"> AI</span></span></a><span>Less guessing. More visibility into token supply.</span></footer>
  </div>;
}
