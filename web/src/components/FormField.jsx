export default function FormField({ label, hint, error, required, children }) {
  return (
    <label className={`form-field ${error ? 'has-error' : ''}`}>
      <span className="field-label">{label}{required && <span aria-hidden="true"> *</span>}</span>
      {children}
      {hint && !error && <span className="field-hint">{hint}</span>}
      {error && <span className="field-error">{error}</span>}
    </label>
  );
}

