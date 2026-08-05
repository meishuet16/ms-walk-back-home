import Link from "next/link";

const links = [
  { href: "/forest", label: "Forest" },
  { href: "/import", label: "Import" },
  { href: "/composer/fixture-entry-001", label: "Composer" },
  { href: "/library", label: "Library" }
] as const;

export function GameNavigation() {
  return (
    <nav className="game-nav" aria-label="Memory paths">
      <Link className="game-nav-brand" href="/forest">
        Walk Back Home
      </Link>
      <div>
        {links.map((link) => (
          <Link href={link.href} key={link.href}>
            {link.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
