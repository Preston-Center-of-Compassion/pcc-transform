// Augment preact-router's Link typings to include `href`. Newer Preact JSX
// types keep `href` on AnchorHTMLAttributes rather than the generic
// HTMLAttributes that preact-router's LinkProps extends, so without this the
// `href` prop on <Link> fails to type-check.
import "preact-router/match";

declare module "preact-router/match" {
  interface LinkProps {
    href?: string;
  }
}
