import { useEffect, useState } from "react";
import { analyzeComments } from "../api/posts";

const CATEGORIES = [
  { key: "positive", label: "Positive" },
  { key: "neutral", label: "Neutral" },
  { key: "negative", label: "Negative" },
  { key: "abusive", label: "Potentially abusive" }
];

const OVERALL_TEXT = {
  positive: "Mostly positive",
  neutral: "Mostly neutral",
  negative: "Mostly negative",
  abusive: "Mostly abusive",
  mixed: "Mixed reactions"
};

function Sparkle({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2l1.9 5.6a3 3 0 0 0 1.9 1.9L21.4 11.4a.6.6 0 0 1 0 1.2l-5.6 1.9a3 3 0 0 0-1.9 1.9L12 22l-1.9-5.6a3 3 0 0 0-1.9-1.9L2.6 12.6a.6.6 0 0 1 0-1.2l5.6-1.9a3 3 0 0 0 1.9-1.9L12 2z" />
      <path d="M19 2l.7 2.1a1.2 1.2 0 0 0 .8.8L22.6 5.6a.3.3 0 0 1 0 .6l-2.1.7a1.2 1.2 0 0 0-.8.8L19 9.8l-.7-2.1a1.2 1.2 0 0 0-.8-.8l-2.1-.7a.3.3 0 0 1 0-.6l2.1-.7a1.2 1.2 0 0 0 .8-.8L19 2z" opacity=".7" />
    </svg>
  );
}

export default function CommentInsightsButton({ postId }) {
  const [isOpen, setIsOpen] = useState(false);
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  async function openDialog() {
    setIsOpen(true);
    setIsLoading(true);
    setError("");
    setResult(null);

    try {
      setResult(await analyzeComments(postId));
    } catch (err) {
      setError(err.response?.data?.message || "Failed to analyze comments");
    } finally {
      setIsLoading(false);
    }
  }

  const total = result?.analyzedComments || 0;

  return (
    <>
      <button
        className="ai-button"
        onClick={openDialog}
        aria-label="Analyze comments with AI"
        title="Analyze comments with AI"
      >
        <Sparkle />
      </button>

      {isOpen && (
        <div className="modal-overlay" onMouseDown={() => setIsOpen(false)}>
          <div
            className="modal-dialog ai-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="ai-dialog-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="ai-header">
              <span className="ai-header-icon">
                <Sparkle size={18} />
              </span>
              <h3 id="ai-dialog-title">AI comment insights</h3>
              <button className="modal-close" onClick={() => setIsOpen(false)} aria-label="Close">
                ×
              </button>
            </div>

            <div className="ai-body">
              {isLoading && (
                <div className="ai-loading">
                  <div className="ai-spinner" />
                  <p>Reading the comments...</p>
                  <div className="ai-skeleton" />
                  <div className="ai-skeleton short" />
                </div>
              )}

              {error && <p className="error-text ai-error">{error}</p>}

              {result && total === 0 && (
                <p className="muted ai-empty">
                  There are no comments on this post yet, so there is nothing to analyze.
                </p>
              )}

              {result && total > 0 && (
                <>
                  <div className={`ai-verdict ai-verdict-${result.overall}`}>
                    <span className="ai-verdict-label">{OVERALL_TEXT[result.overall]}</span>
                    {result.hasAbusive && (
                      <span className="ai-warning">
                        {result.counts.abusive} potentially abusive
                      </span>
                    )}
                  </div>

                  <div className="ai-bar" role="img" aria-label="Sentiment distribution">
                    {CATEGORIES.map(({ key, label }) =>
                      result.counts[key] > 0 ? (
                        <span
                          key={key}
                          className={`ai-bar-segment ai-${key}`}
                          style={{ width: `${(result.counts[key] / total) * 100}%` }}
                          title={`${label}: ${result.counts[key]}`}
                        />
                      ) : null
                    )}
                  </div>

                  <div className="ai-tiles">
                    {CATEGORIES.map(({ key, label }) => (
                      <div className="ai-tile" key={key}>
                        <span className={`ai-dot ai-${key}`} />
                        <div>
                          <div className="ai-tile-count">
                            {result.counts[key]}
                            <span className="ai-tile-percent">
                              {Math.round((result.counts[key] / total) * 100)}%
                            </span>
                          </div>
                          <div className="ai-tile-label">{label}</div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {result.summary && (
                    <blockquote className="ai-summary">{result.summary}</blockquote>
                  )}

                  {result.flagged.length > 0 && (
                    <div className="ai-flagged">
                      <h4>Flagged comments</h4>
                      <ul>
                        {result.flagged.map((comment) => (
                          <li key={comment.id}>
                            <strong>{comment.author}</strong> {comment.text}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <p className="ai-footnote">
                    {result.totalComments > total
                      ? `Analyzed the latest ${total} of ${result.totalComments} comments`
                      : `Analyzed ${total} ${total === 1 ? "comment" : "comments"}`}
                    {" · "}Powered by Gemini
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
