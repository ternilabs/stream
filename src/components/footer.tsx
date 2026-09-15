// claude-opus-5: Replaces the home-page announcement bar. Rendered once for every route so the
// disclaimer is present site-wide rather than only on `/`.
export function Footer() {
  return (
    <footer>
      <div class="wrap footer-line">
        This site is not affiliated with, endorsed by, or connected to any streaming platform.
      </div>
    </footer>
  );
}
