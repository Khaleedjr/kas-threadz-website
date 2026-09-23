"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/studio", label: "Overview" },
  { href: "/studio/orders", label: "Orders" },
  { href: "/studio/customers", label: "Customers" },
  { href: "/studio/products", label: "Products" },
  { href: "/studio/loom", label: "Loom options" },
  { href: "/studio/photos", label: "Photos" },
  { href: "/studio/analytics", label: "Analytics" },
];

/** The desk's sections: a column on a wide screen, a row that scrolls on a phone. */
export function DeskNav() {
  const path = usePathname();
  return (
    <nav aria-label="Studio" className="min-w-0 flex-1 lg:flex-none">
      <ul className="flex gap-1 overflow-x-auto px-3 pb-3 [scrollbar-width:none] lg:flex-col lg:overflow-visible lg:px-3 lg:pb-0 [&::-webkit-scrollbar]:hidden">
        {ITEMS.map((item) => {
          const here = item.href === "/studio" ? path === "/studio" : path.startsWith(item.href);
          return (
            <li key={item.href} className="shrink-0">
              <Link
                href={item.href}
                aria-current={here ? "page" : undefined}
                className="label block whitespace-nowrap rounded-sm px-3 py-[10px] transition-colors"
                style={{
                  color: here ? "var(--accent)" : "var(--on-surface-soft)",
                  background: here ? "rgba(157,59,44,0.07)" : undefined,
                }}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
