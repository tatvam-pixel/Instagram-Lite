import { useEffect, useMemo, useState } from "react";
import { submitBugReport } from "../api/bugReports";

const MAX_FILES = 5;
const MAX_FILE_SIZE_MB = 5;
const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"];

export default function BugReportButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState([]);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const previews = useMemo(
    () => files.map((file) => URL.createObjectURL(file)),
    [files]
  );

  useEffect(() => {
    return () => previews.forEach((url) => URL.revokeObjectURL(url));
  }, [previews]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        closeDialog();
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  function openDialog() {
    setTitle("");
    setDescription("");
    setFiles([]);
    setError("");
    setIsSubmitted(false);
    setIsOpen(true);
  }

  function closeDialog() {
    setIsOpen(false);
  }

  function handleFilesChange(event) {
    const selected = Array.from(event.target.files);
    event.target.value = "";

    const combined = [...files, ...selected];

    if (combined.length > MAX_FILES) {
      setError(`You can attach up to ${MAX_FILES} screenshots`);
      return;
    }

    const invalid = selected.find(
      (file) =>
        !ALLOWED_TYPES.includes(file.type) ||
        file.size > MAX_FILE_SIZE_MB * 1024 * 1024
    );

    if (invalid) {
      setError(
        `"${invalid.name}" must be a PNG, JPEG, WebP or GIF image under ${MAX_FILE_SIZE_MB} MB`
      );
      return;
    }

    setError("");
    setFiles(combined);
  }

  function removeFile(index) {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    const formData = new FormData();
    formData.append("title", title);
    formData.append("description", description);
    files.forEach((file) => formData.append("screenshots", file));

    try {
      await submitBugReport(formData);
      setIsSubmitted(true);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to submit bug report");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <button
        className="bug-button"
        onClick={openDialog}
        aria-label="Report a bug"
        title="Report a bug"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m8 2 1.88 1.88M14.12 3.88 16 2M9 7.13v-1a3.003 3.003 0 1 1 6 0v1" />
          <path d="M12 20c-3.3 0-6-2.7-6-6v-3a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v3c0 3.3-2.7 6-6 6" />
          <path d="M12 20v-9M6.53 9C4.6 8.8 3 7.1 3 5M6 13H2M3 21c0-2.1 1.7-3.9 3.8-4M20.97 5c0 2.1-1.6 3.8-3.5 4M22 13h-4M17.2 17c2.1.1 3.8 1.9 3.8 4" />
        </svg>
      </button>

      {isOpen && (
        <div className="modal-overlay" onMouseDown={closeDialog}>
          <div
            className="modal-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="bug-report-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="modal-header">
              <h3 id="bug-report-title">Report a bug</h3>
              <button className="modal-close" onClick={closeDialog} aria-label="Close">
                ×
              </button>
            </div>

            {isSubmitted ? (
              <div className="modal-body bug-success">
                <p>Thanks! Your bug report has been submitted.</p>
                <button onClick={closeDialog}>Close</button>
              </div>
            ) : (
              <form className="modal-body bug-form" onSubmit={handleSubmit}>
                <input
                  placeholder="Short summary"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  maxLength={100}
                  required
                />

                <textarea
                  placeholder="What went wrong? What did you expect to happen?"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  maxLength={2000}
                  rows={5}
                  required
                />

                <label className="upload-label">
                  + Attach screenshots ({files.length}/{MAX_FILES})
                  <input
                    type="file"
                    accept={ALLOWED_TYPES.join(",")}
                    multiple
                    onChange={handleFilesChange}
                    hidden
                  />
                </label>

                {previews.length > 0 && (
                  <ul className="screenshot-previews">
                    {previews.map((url, index) => (
                      <li key={url}>
                        <img src={url} alt={files[index].name} />
                        <button
                          type="button"
                          className="screenshot-remove"
                          onClick={() => removeFile(index)}
                          aria-label={`Remove ${files[index].name}`}
                        >
                          ×
                        </button>
                      </li>
                    ))}
                  </ul>
                )}

                {error && <p className="error-text">{error}</p>}

                <div className="modal-actions">
                  <button type="button" className="secondary-button" onClick={closeDialog}>
                    Cancel
                  </button>
                  <button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Submitting..." : "Submit"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
