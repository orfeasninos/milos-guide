/// <reference types="astro/client" />

declare module '@fontsource-variable/dm-sans';

// Declarative WebMCP attributes (Chrome, experimental): they let browser AI agents use a form
// as a tool. Not in Astro's HTML types yet.
declare namespace astroHTML.JSX {
  interface FormHTMLAttributes {
    toolname?: string;
    tooldescription?: string;
    toolautosubmit?: boolean;
  }
  interface InputHTMLAttributes {
    toolparamdescription?: string;
  }
  interface SelectHTMLAttributes {
    toolparamdescription?: string;
  }
  interface TextareaHTMLAttributes {
    toolparamdescription?: string;
  }
}
