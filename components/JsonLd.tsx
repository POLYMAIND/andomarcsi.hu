// schema.org JSON-LD a <head>-be/oldalba. A „<” escape-elése megakadályozza a </script> kitörést.
export function JsonLd({ data }: { data: object }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }} />;
}
