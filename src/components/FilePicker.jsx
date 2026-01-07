export default function FilePicker({ onFileSelected }) {
  const handleChange = (event) => {
    const file = event.target.files?.[0] || null;
    onFileSelected(file);
  };

  return (
    <section className="panel">
      <h2>Upload audio file</h2>
      <p>Choose a local audio file instead of recording.</p>
      <input type="file" accept="audio/*" onChange={handleChange} />
    </section>
  );
}
