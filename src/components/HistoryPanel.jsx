function formatTimestamp(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  return date.toLocaleString("pl-PL", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default function HistoryPanel({
  history,
  width,
  isResizing,
  onResizeStart,
}) {
  const isCollapsed = width === 0;

  return (
    <aside
      className={`history-panel${isCollapsed ? " collapsed" : ""}${
        isResizing ? " resizing" : ""
      }`}
      style={{ width }}
      aria-hidden={isCollapsed}
    >
      <div className="history-header">
        <div>
          <h2>History</h2>
          <p className="muted">Last 10 analyses</p>
        </div>
      </div>

      {history.length === 0 ? (
        <p className="muted">No analyses yet.</p>
      ) : (
        <ul className="history-list">
          {history.map((entry) => (
            <li key={entry.id} className="history-item">
              <p className="history-date">{formatTimestamp(entry.timestamp)}</p>
              <p className="history-text">{entry.result}</p>
            </li>
          ))}
        </ul>
      )}

      {!isCollapsed && (
        <div
          className="resize-handle"
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize history panel"
          onPointerDown={onResizeStart}
        />
      )}
    </aside>
  );
}
