/**
 * Runs before first paint to apply the stored theme. Without this the page
 * would render dark and then flip to light for users who chose light mode,
 * which is both jarring and a flash-of-wrong-theme.
 */
export function ThemeScript() {
  const script = `try{var t=localStorage.getItem('techlab-theme');if(t==='light'||(!t&&window.matchMedia('(prefers-color-scheme: light)').matches)){document.documentElement.classList.add('light')}}catch(e){}`;
  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
