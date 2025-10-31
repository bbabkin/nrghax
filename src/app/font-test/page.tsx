export default function FontTestPage() {
  return (
    <div className="container mx-auto p-8 space-y-8">
      <div className="space-y-4">
        <h1 className="text-6xl font-bold">Nova Square H1 Title</h1>
        <h2 className="text-4xl font-semibold">Nova Square H2 Subtitle</h2>
        <h3 className="text-2xl font-medium">Nova Square H3 Header</h3>
        <h4 className="text-xl">Nova Square H4 Subheader</h4>
        <h5 className="text-lg">Nova Square H5 Small Header</h5>
        <h6 className="text-base">Nova Square H6 Tiny Header</h6>
      </div>

      <div className="space-y-4 border-t pt-8">
        <p className="text-lg">This is regular body text using the Nunito font family.</p>
        <p>All headings above (h1-h6) should be displaying in the Nova Square font, which has a distinctive square, geometric design.</p>
        <p className="text-sm text-muted-foreground">Nova Square is a unique display font perfect for titles and headings that need to stand out.</p>
      </div>

      <div className="space-y-4 border-t pt-8">
        <h2 className="text-3xl font-bold">Font Comparison</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h3 className="text-xl mb-2">With Nova Square (Heading)</h3>
            <p className="font-heading text-2xl">NRGHAX ENERGY</p>
          </div>
          <div>
            <h3 className="text-xl mb-2">With Nunito (Body)</h3>
            <p className="font-sans text-2xl">NRGHAX ENERGY</p>
          </div>
        </div>
      </div>
    </div>
  )
}