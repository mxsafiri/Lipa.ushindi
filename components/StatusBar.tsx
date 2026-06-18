// Top safe-area spacer.
//
// This used to render a fake phone status bar ("9:41 · 5G · battery") which
// made the app read as a design mockup. A real web/PWA app never fakes the OS
// status bar, so we now render only a safe-area inset so content stays clear of
// notches and the mobile browser/PWA status area. The optional prop is kept so
// existing call sites (<StatusBar />) keep compiling.
export default function StatusBar(_props: { dark?: boolean } = {}) {
  return (
    <div
      aria-hidden
      className="flex-none"
      style={{ height: "max(env(safe-area-inset-top, 0px), 8px)" }}
    />
  );
}
