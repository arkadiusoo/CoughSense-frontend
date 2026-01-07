export default function ResultPanel({ result, error, isLoading }) {
  return (
    <section className="panel">
      <h2>Analysis result</h2>
      {isLoading && <p>Analyzing audio...</p>}
      {!isLoading && !error && !result && <p>No results yet.</p>}
      {error && <p className="error">{error}</p>}
      {result && (
        <pre className="result-block">{JSON.stringify(result, null, 2)}</pre>
      )}
    </section>
  );
}
