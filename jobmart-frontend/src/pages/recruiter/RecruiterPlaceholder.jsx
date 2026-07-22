function RecruiterPlaceholder({ title }) {
  return (
    <div
      style={{
        padding: "40px",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--border-radius-medium)",
        backgroundColor: "var(--color-white)",
        textAlign: "center",
      }}
    >
      <h2 style={{ color: "var(--color-dark)" }}>
        {title}
      </h2>

      <p style={{ color: "var(--color-muted)" }}>
        This Recruiter Portal page will be developed next.
      </p>
    </div>
  );
}

export default RecruiterPlaceholder;