// Allow importing image assets (SVGs) as strings in TypeScript
declare module '*.svg' {
  const content: string;
  export default content;
}

declare module '*.png' {
  const content: string;
  export default content;
}

declare module '*.jpg' {
  const content: string;
  export default content;
}

// Vite-style absolute asset imports
declare module '/vite.svg' {
  const content: string;
  export default content;
}
