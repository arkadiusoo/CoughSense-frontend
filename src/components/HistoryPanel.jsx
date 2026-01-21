function formatTimestamp(value, locale) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  return date.toLocaleString(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default function HistoryPanel({
  history,
  width,
  isResizing,
  onResizeStart,
  title,
  subtitle,
  emptyText,
  resultTranslations = [],
  resultLabels = {},
  locale = "en-US",
}) {
  const isCollapsed = width === 0;

  const resolveResultText = (entry) => {
    if (entry.resultCode && resultLabels[entry.resultCode]) {
      return resultLabels[entry.resultCode];
    }
    if (
      typeof entry.resultKey === "number" &&
      resultTranslations[entry.resultKey]
    ) {
      return resultTranslations[entry.resultKey];
    }
    return entry.result;
  };

  return (
    <aside
      className={`history-panel${isCollapsed ? " collapsed" : ""}${
        isResizing ? " resizing" : ""
      }`}
      style={{ width }}
      aria-hidden={isCollapsed}
    >
      <div className="history-content">
        <div className="history-header">
          <div>
            <h2>{title}</h2>
            <p className="muted">{subtitle}</p>
          </div>
        </div>

        {history.length === 0 ? (
          <p className="muted">{emptyText}</p>
        ) : (
          <ul className="history-list">
            {history.map((entry) => (
              <li key={entry.id} className="history-item">
                <p className="history-date">
                  {formatTimestamp(entry.timestamp, locale)}
                </p>
                <p className="history-text">{resolveResultText(entry)}</p>
              </li>
            ))}
          </ul>
        )}
      </div>

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
