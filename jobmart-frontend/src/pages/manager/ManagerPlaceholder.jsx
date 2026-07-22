function ManagerPlaceholder({ title }) {
  return (
    <section
      style={{
        padding: "40px",
        border: "1px dashed var(--color-border)",
        borderRadius: "var(--border-radius-medium)",
        backgroundColor: "var(--color-white)",
        textAlign: "center",
      }}
    >
      <h2
        style={{
          margin: 0,
          color: "var(--color-dark)",
        }}
      >
        {title}
      </h2>

      <p
        style={{
          marginTop: "10px",
          color: "var(--color-muted)",
        }}
      >
        This Hiring Manager page will be added next.
      </p>
    </section>
  );
}

export default ManagerPlaceholder;