"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { setsIn, useCart } from "@/lib/cart";
import { whatsappLink } from "@/lib/site";

const NAV = [
  { href: "/collection", label: "Collection" },
  { href: "/fabrics", label: "Fabrics" },
  { href: "/library", label: "Library" },
  { href: "/loom", label: "Design Yours" },
  { href: "/atelier", label: "About Us" },
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

/**
 * The cart, as a bag drawn in the nav's own line, with the number of sets
 * in it pinned to its corner once there are any.
 */
function CartLink() {
  const sets = setsIn(useCart());
  return (
    <Link
      href="/cart"
      className="relative grid h-9 w-9 shrink-0 place-items-center"
      aria-label={sets ? `Your cart, ${sets} ${sets === 1 ? "set" : "sets"}` : "Your cart, empty"}
    >
      <svg aria-hidden width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 8h14l-1.2 12.1a1 1 0 0 1-1 .9H7.2a1 1 0 0 1-1-.9L5 8Z" />
        <path d="M9 10V6.5a3 3 0 0 1 6 0V10" />
      </svg>
      {sets > 0 && (
        <span
          aria-hidden
          className="absolute -right-[2px] -top-[1px] grid h-[17px] min-w-[17px] place-items-center rounded-full px-[4px] font-mono text-[10px] font-medium leading-none"
          style={{ background: "var(--accent)", color: "var(--on-action)" }}
        >
          {sets}
        </span>
      )}
    </Link>
  );
}

function CommissionButton() {
  return (
    <Link
      href="/commission"
      className="rounded-sm px-[15px] py-[10px] text-[10px] font-medium uppercase tracking-[0.2em] whitespace-nowrap"
      style={{ background: "var(--action)", color: "var(--on-action)" }}
    >
      Order Now
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
          <CartLink />
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
        Custom embroidery · Abuja · +234 912 194 2684
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
          <CartLink />
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
          <CartLink />
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

/** WhatsApp's own mark, in its own green, so the number reads as a chat at a glance. */
function WhatsAppMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className} fill="#25d366">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
    </svg>
  );
}

export function SiteFooter() {
  return (
    <footer
      className="flex shrink-0 flex-wrap justify-between gap-x-4 gap-y-2 border-t border-[var(--line)] px-5 py-4 font-mono text-[10px] tracking-[0.12em] sm:px-8 sm:py-5"
      style={{ color: "var(--on-surface-soft)" }}
    >
      <span>© 2026 KAS THREADZ · ABUJA</span>
      <a
        href={whatsappLink()}
        aria-label="WhatsApp +234 912 194 2684"
        className="inline-flex items-center gap-2 opacity-80 hover:opacity-100"
      >
        <WhatsAppMark className="h-[15px] w-[15px] shrink-0" />
        +234 912 194 2684
      </a>
      <span className="hidden sm:inline">ART IN EVERY STITCH</span>
    </footer>
  );
}
