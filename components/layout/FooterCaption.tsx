interface FooterCaptionProps {
  text?: string;
}

/** Frase inferior de la galería. Preparado y sin contenido hasta que se defina el texto final. */
export function FooterCaption({ text }: FooterCaptionProps) {
  if (!text) return null;

  return (
    <p className="px-6 pb-[calc(env(safe-area-inset-bottom)+96px)] pt-10 text-center text-sm text-foreground-muted">
      {text}
    </p>
  );
}
