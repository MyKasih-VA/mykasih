// Declare custom web component for Anam AI persona embed
// Required because TypeScript strict mode rejects unknown JSX elements.
// With react-jsx transform (Next.js 16), JSX types live in React.JSX namespace.
declare namespace React {
  namespace JSX {
    interface IntrinsicElements {
      'anam-agent': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        'agent-id'?: string
      }
    }
  }
}
