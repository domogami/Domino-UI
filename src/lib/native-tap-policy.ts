/**
 * Keep Safari's auxiliary switch targets off reading and disclosure surfaces.
 * This module has no React or CSS dependency so native host adapters can share
 * the exact same hit-testing policy as TouchFeedbackProvider.
 */
export function isNativeTapTargetEligible(control: HTMLElement): boolean {
  if (
    control.matches(
      ':disabled, [aria-disabled="true"], [data-haptic="none"], [aria-expanded]',
    ) ||
    control.closest(
      'summary, details:not([open]), [hidden], [inert], [aria-hidden="true"], [data-native-tap="none"]',
    )
  )
    return false;

  // WebKit can retain nonzero rectangles for descendants of closed <details>.
  // A rectangle is not evidence that a control participates in hit testing.
  // The explicit ancestor checks above also protect engines without this API.
  return (
    typeof control.checkVisibility !== "function" || control.checkVisibility()
  );
}
