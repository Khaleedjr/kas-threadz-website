"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const NAV = [
  { href: "/collection", label: "Collection" },
  { href: "/fabrics", label: "Fabrics" },
  { href: "/library", label: "Library" },
  { href: "/loom", label: "The Loom" },
  { href: "/atelier", label: "Atelier" },
];

function useIsActive() {
  const pathname = usePathname();
  return (href: string) => pathname === href || pathname.startsWith(href + "/");
}

/**
 * Menu state that closes itself on navigation.
 *
 * Derived rather than reset in an effect: the menu remembers which page it was
 * opened on, and once the route moves it is simply no longer open. No extra
 * render, and nothing to forget to clean up.
 */
function useMenu() {
  const pathname = usePathname();
  const [state, setState] = useState({ open: false, at: pathname });
  const open = state.open && state.at === pathname;
  const setOpen = (next: boolean) => setState({ open: next, at: pathname });
  return [open, setOpen] as const;
}

/**
 * The house mark itself: solid, never stitched. Stitching dies below about
 * 40px, and the nav is exactly where that limit bites. Cream on cloth,
 * burgundy on paper; the register decides which is shown.
 */
export function MarkLockup({ className }: { className?: string }) {
  return (
    <Link href="/" className={`block shrink-0 ${className ?? ""}`} aria-label="KAS THREADZ, home">
      <Image
        src="/img/brand/logo-cream.png"
        alt="KAS THREADZ"
        width={919}
        height={1043}
        priority
        className="logo-cloth h-[42px] w-auto sm:h-[46px]"
      />
      <Image
        src="/img/brand/logo-burgundy.png"
        alt="KAS THREADZ"
        width={919}
        height={1043}
        priority
        className="logo-paper h-[42px] w-auto sm:h-[46px]"
      />
    </Link>
  );
}

function DesktopLinks() {
  const isActive = useIsActive();
  return (
    <nav className="hidden gap-6 md:flex">
      {NAV.map((item) => {
        const active = isActive(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className="relative pb-[6px] text-[10px] font-medium uppercase tracking-[0.24em] transition-opacity"
            style={{ opacity: active ? 1 : 0.7 }}
          >
            {item.label}
            {/* the page you are on is tacked down with a stitch */}
            <span
              aria-hidden
              className="absolute inset-x-0 bottom-0 block h-[2px]"
              style={{
                background: active
                  ? "repeating-linear-gradient(90deg, var(--accent) 0 5px, transparent 5px 9px)"
                  : "transparent",
              }}
            />
          </Link>
        );
      })}
    </nav>
  );
}

function MenuToggle({ open, onToggle }: { open: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={open}
      aria-controls="kas-menu"
      aria-label={open ? "Close menu" : "Open menu"}
      className="flex h-9 w-9 flex-col items-center justify-center gap-[5px] md:hidden"
    >
      <span
        className="block h-[1.5px] w-5 transition-transform duration-300"
        style={{
          background: "currentColor",
          transform: open ? "translateY(6.5px) rotate(45deg)" : "none",
        }}
      />
      <span
        className="block h-[1.5px] w-5 transition-opacity duration-200"
        style={{ background: "currentColor", opacity: open ? 0 : 1 }}
      />
      <span
        className="block h-[1.5px] w-5 transition-transform duration-300"
        style={{
          background: "currentColor",
          transform: open ? "translateY(-6.5px) rotate(-45deg)" : "none",
        }}
      />
    </button>
  );
}

function CommissionButton() {
  return (
    <Link
      href="/commission"
      className="rounded-sm px-[15px] py-[10px] text-[10px] font-medium uppercase tracking-[0.2em] whitespace-nowrap"
      style={{ background: "var(--action)", color: "var(--on-action)" }}
    >
      Commission
    </Link>
  );
}

/**
 * The small-screen menu is a sibling of the header, never a child of it.
 * The header carries a backdrop blur, and any filtered element becomes the
 * containing block for `position: fixed` descendants, which collapses a
 * full-screen panel down to the height of the bar it was nested in.
 */
function MobileMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  const isActive = useIsActive();

  // hold the page still behind the menu, and let Escape close it
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      id="kas-menu"
      role="dialog"
      aria-modal="true"
      aria-label="Menu"
      className="fixed inset-0 z-[60] flex flex-col md:hidden"
      style={{ background: "var(--surface)" }}
    >
      <div
        className="flex shrink-0 items-center justify-between gap-4 border-b px-5 py-4"
        style={{ borderColor: "var(--line)" }}
      >
        <MarkLockup />
        <div className="flex items-center gap-3">
          <CommissionButton />
          <MenuToggle open onToggle={onClose} />
        </div>
      </div>

      <ul className="flex flex-col px-5 pt-2">
        {NAV.map((item) => {
          const active = isActive(item.href);
          return (
            <li key={item.href} className="border-b" style={{ borderColor: "var(--line-dashed)" }}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className="flex items-center justify-between py-5 font-display text-[20px] font-semibold"
                style={{ color: active ? "var(--accent)" : "var(--on-surface)" }}
              >
                {item.label}
                {active && <span className="label">Here</span>}
              </Link>
            </li>
          );
        })}
      </ul>

      <p className="label mt-auto px-5 pb-8" style={{ color: "var(--on-surface-soft)" }}>
        Bespoke embroidery · Abuja · +234 912 194 2684
      </p>
    </div>
  );
}

/** Always-present nav, for every page that is not the homepage. */
export function SiteNav() {
  const [open, setOpen] = useMenu();

  return (
    <>
      <header className="relative z-40 flex shrink-0 items-center justify-between gap-4 border-b border-[var(--line)] px-5 py-4 sm:px-8">
        <MarkLockup />
        <DesktopLinks />
        <div className="flex items-center gap-3">
          <CommissionButton />
          <MenuToggle open={open} onToggle={() => setOpen(!open)} />
        </div>
      </header>
      <MobileMenu open={open} onClose={() => setOpen(false)} />
    </>
  );
}

/**
 * The homepage gives the mark the whole first screen to sew itself into.
 * The nav only arrives once you have started reading past it.
 */
export function RevealNav({ after = 220 }: { after?: number }) {
  const [shown, setShown] = useState(false);
  const [open, setOpen] = useMenu();

  useEffect(() => {
    const onScroll = () => setShown(window.scrollY > after);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [after]);

  return (
    <>
      <header
        aria-hidden={!shown}
        className="fixed inset-x-0 top-0 z-40 flex items-center justify-between gap-4 border-b px-5 py-4 backdrop-blur-md transition-[opacity,transform] duration-500 ease-[var(--ease-thread)] sm:px-8"
        style={{
          borderColor: shown ? "var(--line)" : "transparent",
          background: shown ? "rgba(11,14,19,0.86)" : "transparent",
          opacity: shown ? 1 : 0,
          transform: shown ? "none" : "translateY(-100%)",
          pointerEvents: shown ? "auto" : "none",
        }}
      >
        <MarkLockup />
        <DesktopLinks />
        <div className="flex items-center gap-3">
          <CommissionButton />
          <MenuToggle open={open} onToggle={() => setOpen(!open)} />
        </div>
      </header>
      <MobileMenu open={open} onClose={() => setOpen(false)} />
    </>
  );
}

/** A quiet nudge that there is more below, without shouting about it. */
export function ScrollCue({ label = "Scroll" }: { label?: string }) {
  return (
    <div
      className="pointer-events-none flex flex-col items-center gap-2"
      style={{ color: "var(--on-surface-soft)" }}
    >
      <span className="label">{label}</span>
      <span className="kas-cue block h-8 w-px" style={{ background: "currentColor" }} />
    </div>
  );
}

export function SiteFooter() {
  return (
    <footer
      className="flex shrink-0 flex-wrap justify-between gap-x-4 gap-y-2 border-t border-[var(--line)] px-5 py-4 font-mono text-[10px] tracking-[0.12em] sm:px-8 sm:py-5"
      style={{ color: "var(--on-surface-soft)" }}
    >
      <span>© 2026 KAS THREADZ · ABUJA</span>
      <a href="https://wa.me/2349121942684" className="opacity-80 hover:opacity-100">
        WHATSAPP +234 912 194 2684
      </a>
      <span className="hidden sm:inline">ART IN EVERY STITCH</span>
    </footer>
  );
}
