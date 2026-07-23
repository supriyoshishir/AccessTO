/**
 * First focusable element on every page. Hidden until it receives keyboard
 * focus, at which point it becomes visible so a keyboard user can jump
 * straight past repeated header/nav content to the main landmark.
 */
export default function SkipLink() {
  return (
    <a
      href="#main"
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:rounded-md focus:bg-blue-700 focus:px-4 focus:py-2 focus:text-white focus:ring-2 focus:ring-offset-2 focus:ring-offset-white focus:outline-none dark:focus:ring-offset-slate-900"
    >
      Skip to main content
    </a>
  );
}
