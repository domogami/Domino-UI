import { useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import {
  Button,
  Badge,
  Dialog,
  ThemeToggle,
  useTheme,
  Switch,
  Select,
  Toast,
  MenuToggle,
  createPageTransition,
} from "./lib";
import { HeroName, HandwrittenNote, SketchArrow, Crane } from "./lib/brand";
import type { DrawingSpeed } from "./lib/brand";
import { DominoMark, Icon } from "./Icons";
import { entries, groups, findEntry, type Entry } from "./catalog/entries";
import { Demo } from "./catalog/Demo";
import { HapticsPage } from "./catalog/HapticsPage";
import { SharedSystemPage } from "./catalog/SharedSystem";
import { SketchbookPage } from "./catalog/Sketchbook";
import { LayersPage } from "./catalog/Layers";
import {
  AccessibilityPage,
  CodeBlock,
  ColorPage,
  GettingStarted,
  PageIntro,
  SpacingPage,
  StylePage,
  TypographyPage,
} from "./catalog/Foundations";

const foundations = [
  { id: "colors", name: "Color & themes", icon: "palette" },
  { id: "typography", name: "Typography", icon: "type" },
  { id: "spacing", name: "Space & surfaces", icon: "ruler" },
];
const guides = [
  { id: "layers", name: "Layers & notifications", icon: "book" },
  { id: "sketchbook", name: "The sketchbook", icon: "pen" },
  { id: "haptics", name: "Touch & haptics", icon: "sparkle" },
  { id: "shared-system", name: "One shared system", icon: "grid" },
  { id: "style-guide", name: "Style guide", icon: "pen" },
  { id: "motion", name: "Motion & identity", icon: "play" },
  { id: "accessibility", name: "Accessibility", icon: "heart" },
  { id: "getting-started", name: "Getting started", icon: "code" },
];
const routeFromHash = () => {
  const hash = location.hash.slice(1) || "overview";
  try {
    return decodeURIComponent(hash);
  } catch {
    return hash;
  }
};

function useRoute() {
  const [route, setRoute] = useState(routeFromHash);
  useEffect(() => {
    const transition = createPageTransition();
    let pendingRoute = route;
    let committedRoute = route;
    const change = (event: Event) => {
      const next = routeFromHash();
      // In-page anchors and repeated hashes retain their native behavior.
      if (next === pendingRoute) return;
      if (next === committedRoute || document.getElementById(next)) {
        transition.cancel();
        pendingRoute = committedRoute;
        return;
      }
      pendingRoute = next;
      const browserOwnsMotion =
        "hasUAVisualTransition" in event &&
        event.hasUAVisualTransition === true;
      const modalOpen = Boolean(
        document.querySelector('dialog:modal, [aria-modal="true"]'),
      );
      const navigationMoving = document
        .querySelector(".navigation-shell")
        ?.getAnimations({ subtree: true })
        .some((animation) => {
          const target = (animation.effect as KeyframeEffect | null)?.target;
          return (
            animation.playState === "running" &&
            target instanceof Element &&
            target.matches(".sidebar, .nav-backdrop, .dm-menu-toggle__line")
          );
        });
      void transition
        .run(
          () => {
            // The snapshot must see React's committed route, not a queued render.
            committedRoute = next;
            flushSync(() => setRoute(next));
            document
              .getElementById("main-content")
              ?.scrollTo({ top: 0, behavior: "instant" });
            window.scrollTo({ top: 0, behavior: "instant" });
          },
          { skip: browserOwnsMotion || modalOpen || navigationMoving },
        )
        .catch((error) => {
          console.error("The notebook route could not be updated.", error);
        });
    };
    addEventListener("hashchange", change);
    addEventListener("popstate", change);
    return () => {
      removeEventListener("hashchange", change);
      removeEventListener("popstate", change);
      transition.cancel();
    };
  }, []);
  return route;
}

export default function App() {
  const route = useRoute();
  const { theme } = useTheme();
  const navigation = useRef<HTMLDivElement>(null);
  const searchInput = useRef<HTMLInputElement>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [navOpen, setNavOpen] = useState(false);
  const [mobileNavigation, setMobileNavigation] = useState(
    () => window.matchMedia("(max-width: 700px)").matches,
  );
  const modalNavigation = mobileNavigation && navOpen;
  const [message, setMessage] = useState("");
  const main = useRef<HTMLElement>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );
  const selected = route.startsWith("component/")
    ? findEntry(route.split("/")[1])
    : undefined;
  const category = route.startsWith("category/")
    ? route.split("/")[1]
    : undefined;
  useEffect(() => {
    const breakpoint = window.matchMedia("(max-width: 700px)");
    const changed = () => {
      setMobileNavigation(breakpoint.matches);
      if (!breakpoint.matches) setNavOpen(false);
    };
    breakpoint.addEventListener("change", changed);
    return () => breakpoint.removeEventListener("change", changed);
  }, []);
  useEffect(() => {
    setNavOpen(false);
    main.current?.scrollTo({ top: 0, behavior: "instant" });
    window.scrollTo({ top: 0, behavior: "instant" });
    document.title = `${selected?.name || [...foundations, ...guides].find((x) => x.id === route)?.name || "The component notebook"} · Domino UI`;
  }, [route, selected]);
  useEffect(() => {
    const shortcut = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen((v) => !v);
      }
    };
    addEventListener("keydown", shortcut);
    return () => removeEventListener("keydown", shortcut);
  }, []);
  useEffect(() => {
    if (!modalNavigation) return;
    const opener =
      navigation.current?.querySelector<HTMLButtonElement>(
        ".mobile-nav-toggle",
      );
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    opener?.focus({ preventScroll: true });
    const keys = (e: KeyboardEvent) => {
      // The native search dialog owns its focus and Escape while above the drawer.
      if (document.querySelector("dialog[open]")) return;
      if (e.key === "Escape") {
        e.preventDefault();
        setNavOpen(false);
        return;
      }
      if (e.key === "Tab") {
        const controls = Array.from(
          navigation.current?.querySelectorAll<HTMLElement>(
            "a[href],button:not([disabled]),input",
          ) || [],
        ).filter((el) => el.getClientRects().length > 0);
        const first = controls[0],
          last = controls.at(-1);
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener("keydown", keys);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", keys);
      if (opener?.getClientRects().length)
        opener.focus({ preventScroll: true });
    };
  }, [modalNavigation]);
  useEffect(() => () => clearTimeout(toastTimer.current), []);
  const notify = (text: string) => {
    setMessage(text);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setMessage(""), 3500);
  };
  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      notify(
        text.startsWith("#")
          ? `${text.toUpperCase()} copied.`
          : "A little snippet, copied.",
      );
    } catch {
      notify("Copy is unavailable here. Select the text and copy it manually.");
    }
  };
  useEffect(() => {
    if (searchOpen) searchInput.current?.focus();
  }, [searchOpen]);
  const searchItems = [
    { id: "overview", name: "Overview", group: "Notebook" },
    ...foundations.map((x) => ({ ...x, group: "Foundations" })),
    ...guides.map((x) => ({ ...x, group: "Guidelines" })),
    ...entries.map((x) => ({ ...x, id: `component/${x.id}` })),
  ].filter((x) =>
    `${x.name} ${x.group} ${"summary" in x ? x.summary : ""}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  );
  const navItem = (id: string, name: string, icon?: string, count?: number) => (
    <a
      key={id}
      href={`#${id}`}
      className={`nav-link ${route === id ? "is-active" : ""}`}
      aria-current={route === id ? "page" : undefined}
    >
      {icon ? (
        <Icon name={icon} size={16} />
      ) : (
        <span className="nav-bullet">–</span>
      )}
      <span>{name}</span>
      {count !== undefined && <small>{count}</small>}
      {route === id && <i />}
    </a>
  );
  const detailTab = selected?.group || category;
  return (
    <div className="notebook-app">
      <a
        className="skip-link"
        href="#main-content"
        onClick={(e) => {
          e.preventDefault();
          document.getElementById("main-content")?.focus();
        }}
      >
        Skip to content
      </a>
      <div
        ref={navigation}
        className={`navigation-shell ${modalNavigation ? "is-open" : ""}`}
        role={modalNavigation ? "dialog" : undefined}
        aria-modal={modalNavigation || undefined}
        aria-label={modalNavigation ? "Notebook navigation" : undefined}
      >
        <div
          className="nav-backdrop"
          aria-hidden="true"
          onClick={() => setNavOpen(false)}
        />
        <MenuToggle
          id="notebook-navigation-toggle"
          className="mobile-nav-toggle"
          open={modalNavigation}
          aria-controls="notebook-navigation"
          onClick={() => setNavOpen((value) => !value)}
        />
        <aside
          id="notebook-navigation"
          className={`sidebar ${modalNavigation ? "is-open" : ""}`}
          aria-label="Notebook navigation"
          aria-hidden={mobileNavigation && !modalNavigation ? true : undefined}
          inert={mobileNavigation && !modalNavigation}
          onClick={(event) => {
            if ((event.target as Element).closest('a[href^="#"]'))
              setNavOpen(false);
          }}
        >
          <a href="#overview" className="brand">
            <DominoMark />
            <span>
              domino<span className="brand-ui">ui</span>
              <small>A COMPONENT NOTEBOOK</small>
            </span>
            <span className="version">v0.1</span>
          </a>
          <button
            className="sidebar-search"
            onClick={() => {
              setQuery("");
              setSearchOpen(true);
            }}
          >
            <Icon name="search" size={16} />
            <span>Find a little something…</span>
            <kbd>⌘ K</kbd>
          </button>
          <nav>
            <div className="nav-group">
              {navItem("overview", "Overview", "book")}
              {navItem("getting-started", "Getting started", "code")}
            </div>
            <div className="nav-group">
              <div className="nav-label">
                01 <span>FOUNDATIONS</span>
              </div>
              {foundations.map((x) => navItem(x.id, x.name, x.icon))}
            </div>
            <div className="nav-group">
              <div className="nav-label">
                02 <span>COMPONENTS</span>
                <span className="nav-total">{entries.length}</span>
              </div>
              {navItem("components", "All components", "grid")}
              {groups.map((group) => (
                <div key={group}>
                  {navItem(
                    `category/${group}`,
                    group,
                    undefined,
                    entries.filter((x) => x.group === group).length,
                  )}
                  {(category === group || detailTab === group) && (
                    <div className="nav-children">
                      {entries
                        .filter((x) => x.group === group)
                        .map((x) => navItem(`component/${x.id}`, x.name))}
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="nav-group">
              <div className="nav-label">
                03 <span>THE GUIDELINES</span>
              </div>
              {guides
                .filter((x) => x.id !== "getting-started")
                .map((x) => navItem(x.id, x.name, x.icon))}
            </div>
          </nav>
          <div className="sidebar-footer">
            <span className="sidebar-note">
              a few good pieces,
              <br />
              endless little possibilities.
              <SketchArrow direction="up-right" />
            </span>
            <div>
              <a
                href="https://dominicklee.net/"
                target="_blank"
                rel="noreferrer"
              >
                By Dom Lee <Icon name="external" size={12} />
              </a>
              <span className="tiny-dot" />
              Built with curiosity
            </div>
          </div>
        </aside>
      </div>
      <div className="app-content" inert={modalNavigation}>
        <header className="topbar">
          <div className="topbar-left">
            <span className="topbar-label">THE DESIGN SYSTEM</span>
            <span className="topbar-separator">/</span>
            <span>
              {selected
                ? "Components"
                : category ||
                  (route === "components" ? "Components" : undefined) ||
                  [...foundations, ...guides].find((x) => x.id === route)
                    ?.name ||
                  "Overview"}
            </span>
          </div>
          <div className="topbar-right">
            <ThemeToggle />
            <a
              className="source-button"
              href="https://github.com/domogami/Domino-UI"
              target="_blank"
              rel="noreferrer"
              aria-label="Domino UI on GitHub"
            >
              <Icon name="github" size={19} />
            </a>
          </div>
        </header>
        <main
          ref={main}
          id="main-content"
          className="main-content"
          tabIndex={-1}
        >
          <div className="content-width dm-page-transition">
            {route === "overview" && <Overview copy={copy} />}
            {(route === "components" || category) && (
              <ComponentGallery category={category} />
            )}
            {selected && (
              <ComponentDetail key={selected.id} entry={selected} copy={copy} />
            )}
            {route === "colors" && <ColorPage copy={copy} theme={theme} />}
            {route === "themes" && <ColorPage copy={copy} theme={theme} />}
            {route === "typography" && <TypographyPage />}
            {route === "spacing" && <SpacingPage />}
            {route === "style-guide" && <StylePage />}
            {route === "shared-system" && <SharedSystemPage copy={copy} />}
            {route === "sketchbook" && <SketchbookPage copy={copy} />}
            {route === "layers" && <LayersPage copy={copy} />}
            {route === "motion" && <MotionPage copy={copy} />}
            {route === "haptics" && <HapticsPage copy={copy} />}
            {route === "accessibility" && <AccessibilityPage />}
            {route === "getting-started" && <GettingStarted copy={copy} />}
            {![
              "overview",
              "components",
              "colors",
              "themes",
              "typography",
              "spacing",
              "style-guide",
              "shared-system",
              "sketchbook",
              "layers",
              "motion",
              "haptics",
              "accessibility",
              "getting-started",
            ].includes(route) &&
              !category &&
              !selected && (
                <div className="not-found">
                  <PageIntro
                    eyebrow="A SMALL DETOUR"
                    title="This page is still blank"
                    description="The notebook index will help you find a good place to begin."
                  />
                  <a className="text-link" href="#overview">
                    Back to the notebook <Icon name="arrow" />
                  </a>
                </div>
              )}
            <footer className="page-footer">
              <span>
                <i /> PAPER, INK & A LITTLE CURIOSITY
              </span>
              <a
                href="https://dominicklee.net/"
                target="_blank"
                rel="noreferrer"
              >
                A system by Dom Lee <Icon name="external" size={12} />
              </a>
              <span>VOL. 01 · 2026</span>
            </footer>
          </div>
        </main>
      </div>
      <Dialog
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        title="Find a little something"
        description="Components, foundations, and notes from the guide."
        className="command-dialog"
      >
        <div className="command-input">
          <Icon name="search" />
          <input
            ref={searchInput}
            autoFocus
            aria-label="Search the notebook"
            placeholder="Try button, banner, color…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && searchItems[0]) {
                location.hash = searchItems[0].id;
                setSearchOpen(false);
              }
            }}
          />
          <kbd>ESC</kbd>
        </div>
        <div className="search-results">
          {searchItems.length ? (
            searchItems.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                onClick={() => setSearchOpen(false)}
              >
                <Icon
                  name={
                    item.group === "Foundations"
                      ? "palette"
                      : item.group === "Guidelines"
                        ? "pen"
                        : "grid"
                  }
                  size={16}
                />
                <span>{item.name}</span>
                <small>{item.group}</small>
                <Icon name="arrow" size={14} />
              </a>
            ))
          ) : (
            <p className="search-empty">
              No matching pages. Try a shorter word, or browse the component
              index.
            </p>
          )}
        </div>
      </Dialog>
      {message && (
        <div className="app-toast">
          <Toast title={message} onDismiss={() => setMessage("")} />
        </div>
      )}
    </div>
  );
}

function Overview({ copy }: { copy: (text: string) => void }) {
  return (
    <>
      <div className="overview-folio">
        <span>
          <span className="tiny-dot" /> THE LIVING FIELD GUIDE
        </span>
        <span>VOL. 01 / ALWAYS GROWING</span>
      </div>
      <section className="overview-hero">
        <div className="overview-intro">
          <div className="eyebrow">A DESIGN SYSTEM BY DOM LEE</div>
          <h1>
            A little structure.
            <br />A lot of{" "}
            <span>
              character
              <svg viewBox="0 0 300 12" aria-hidden="true">
                <path d="M3 8C75 0 200 0 296 6M22 11c64-5 181-5 254-2" />
              </svg>
            </span>
            <span className="title-period">.</span>
          </h1>
          <p>
            A collection of thoughtful pieces for the things we make. Rooted in
            bullet journals, folded paper, and a little everyday curiosity.
          </p>
          <div className="hero-actions">
            <a className="button-link" href="#components">
              Explore the components
              <Icon name="arrow" size={16} />
            </a>
            <a className="text-link" href="#style-guide">
              Read the style guide
              <Icon name="external" size={14} />
            </a>
          </div>
          <div className="hero-annotation">
            <HandwrittenNote>familiar pieces. your own story.</HandwrittenNote>
            <SketchArrow direction="up-right" />
          </div>
        </div>
        <div className="hero-specimen">
          <div className="specimen-paper">
            <span className="specimen-ribbon">
              PAPER, PATIENCE & POSSIBILITY
            </span>
            <div className="signature-preview">
              <HeroName />
            </div>
            <HandwrittenNote>a little corner of the internet.</HandwrittenNote>
            <div className="specimen-rule" />
            <div className="specimen-bottom">
              <span>MADE TO FEEL HUMAN</span>
              <Crane />
            </div>
            <span className="specimen-fold" />
          </div>
          <span className="specimen-caption">
            the original signature, brought along.
            <SketchArrow direction="up" />
          </span>
          <div className="specimen-sticker">
            React
            <br />
            <span>+ a little soul</span>
          </div>
        </div>
      </section>
      <div className="overview-stats">
        <div>
          <b>{entries.length}</b>
          <span>CONSIDERED COMPONENTS</span>
        </div>
        <div>
          <b>3</b>
          <span>WAYS TO SEE THE PAGE</span>
        </div>
        <div>
          <b>5</b>
          <span>FONTS WITH A PURPOSE</span>
        </div>
        <a href="#getting-started">
          <Icon name="code" size={17} />
          <span>React + TypeScript</span>
          <Icon name="external" size={14} />
        </a>
      </div>
      <section className="overview-foundations">
        <div className="section-heading">
          <div>
            <span className="eyebrow">FIRST, A FEW FOUNDATIONS</span>
            <h2>The little things that hold it together.</h2>
          </div>
          <a href="#colors" className="text-link">
            Open the guide
            <Icon name="arrow" size={15} />
          </a>
        </div>
        <div className="foundation-cards">
          <a href="#colors" className="foundation-card">
            <div className="palette-preview">
              {[
                "#2b3034",
                "#efe7d7",
                "#0e7c79",
                "#d5e3cd",
                "#eed5bf",
                "#ded9e8",
              ].map((hex) => (
                <i key={hex} style={{ background: hex }} />
              ))}
            </div>
            <div>
              <h3>Color & themes</h3>
              <p>Warm paper. Clear ink. A little green.</p>
              <Icon name="arrow" size={16} />
            </div>
          </a>
          <a href="#typography" className="foundation-card">
            <div className="type-preview">
              <b>Aa</b>
              <span>a little hello.</span>
              <code>01 / TYPE</code>
            </div>
            <div>
              <h3>Typography</h3>
              <p>Five voices, each with a place.</p>
              <Icon name="arrow" size={16} />
            </div>
          </a>
          <a href="#spacing" className="foundation-card">
            <div className="space-preview">
              <div />
              <div />
              <div />
              <div />
              <span>4 · 8 · 16 · 32</span>
            </div>
            <div>
              <h3>Space & surfaces</h3>
              <p>A steady rhythm. Room to breathe.</p>
              <Icon name="arrow" size={16} />
            </div>
          </a>
        </div>
      </section>
      <section className="overview-components">
        <div className="section-heading">
          <div>
            <span className="eyebrow">THE COMPONENT SHELF</span>
            <h2>Good pieces. Plenty of possibilities.</h2>
          </div>
          <a href="#components" className="text-link">
            All {entries.length} components
            <Icon name="arrow" size={15} />
          </a>
        </div>
        <div className="component-grid overview-grid">
          {[
            "button",
            "input",
            "badge",
            "banner",
            "sticky-note",
            "journal-list",
          ].map((id) => (
            <ComponentTile entry={findEntry(id)!} key={id} />
          ))}
        </div>
      </section>
      <section className="overview-note">
        <div>
          <span className="eyebrow">A SMALL NOTE ON THE FEELING</span>
          <h2>Intentional, never too precious.</h2>
          <p>
            The grid keeps things steady. The handwriting makes them personal. A
            few folds and a little ink make room for a system that feels like
            you.
          </p>
          <a className="text-link" href="#style-guide">
            The principles behind the pieces <Icon name="arrow" size={16} />
          </a>
        </div>
        <HandwrittenNote>
          let the details
          <br />
          do a little talking.
          <SketchArrow direction="left" />
        </HandwrittenNote>
      </section>
      <div className="quick-start">
        <div>
          <Icon name="code" />
          <h3>A fresh page, in React.</h3>
          <p>Typed components. Semantic tokens. Yours to compose.</p>
        </div>
        <button
          className="quick-copy"
          onClick={() =>
            copy('import { Button, Paper, ThemeProvider } from "@domlee/ui";')
          }
        >
          <code>import {"{ Button }"} from '@domlee/ui';</code>
          <Icon name="copy" size={16} />
        </button>
        <a className="text-link" href="#getting-started">
          Get started
          <Icon name="arrow" size={16} />
        </a>
      </div>
    </>
  );
}
function ComponentTile({ entry }: { entry: Entry }) {
  return (
    <article className="component-tile">
      <div
        className={`tile-preview tile-preview--${entry.id}`}
        aria-hidden="true"
        inert
      >
        <Demo id={entry.id} compact quiet />
      </div>
      <a href={`#component/${entry.id}`} className="tile-label">
        <div>
          <h3>{entry.name}</h3>
          <span>{entry.group}</span>
        </div>
        <Icon name="arrow" size={16} />
      </a>
    </article>
  );
}
function ComponentGallery({ category }: { category?: string }) {
  const [filter, setFilter] = useState("");
  const items = entries.filter(
    (x) =>
      (!category || x.group === category) &&
      `${x.name} ${x.summary}`.toLowerCase().includes(filter.toLowerCase()),
  );
  return (
    <>
      <PageIntro
        eyebrow={`THE COMPONENT SHELF / ${category?.toUpperCase() || "ALL PIECES"}`}
        title={category || "A collection of good pieces"}
        description={
          category
            ? "Familiar patterns, with a little notebook character. Open a piece to explore its examples, code, and guidance."
            : "From a small button to a folded note. Each piece includes a live example, typed React API, and a few notes on using it well."
        }
      />
      <div className="gallery-toolbar">
        <div className="gallery-filter">
          <Icon name="search" size={16} />
          <input
            aria-label="Filter components"
            placeholder="Find a component…"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>
        <span>
          {items.length} {items.length === 1 ? "piece" : "pieces"} on the shelf
        </span>
      </div>
      <div className="category-filters">
        <a href="#components" className={!category ? "is-active" : ""}>
          All pieces
        </a>
        {groups.map((group) => (
          <a
            href={`#category/${group}`}
            key={group}
            className={category === group ? "is-active" : ""}
          >
            {group}
          </a>
        ))}
      </div>
      {items.length ? (
        <div className="component-grid">
          {items.map((x) => (
            <ComponentTile key={x.id} entry={x} />
          ))}
        </div>
      ) : (
        <div className="search-empty">
          No pieces match that name. Try a shorter word.
        </div>
      )}
    </>
  );
}
function ComponentDetail({
  entry,
  copy,
}: {
  entry: Entry;
  copy: (text: string) => void;
}) {
  const [tab, setTab] = useState("preview");
  const [replay, setReplay] = useState(0);
  const [pattern, setPattern] = useState(true);
  const [quiet, setQuiet] = useState(false);
  const [speed, setSpeed] = useState<DrawingSpeed>(1);
  const tabs = ["preview", "react", "props", "guidelines"];
  const isMotion = entry.group === "Brand";
  return (
    <>
      <div className="detail-breadcrumb">
        <a href="#components">Components</a>
        <Icon name="chevron" size={12} />
        <a href={`#category/${entry.group}`}>{entry.group}</a>
        <Icon name="chevron" size={12} />
        <span>{entry.name}</span>
      </div>
      <PageIntro
        eyebrow={`${entry.group.toUpperCase()} / ${String(entries.indexOf(entry) + 1).padStart(2, "0")}`}
        title={entry.name.replace(/\.$/, "")}
        description={entry.summary}
      >
        <div className="entry-badges">
          <Badge tone="sage">React + TypeScript</Badge>
          <Badge>
            {entry.origin === "Original"
              ? "Original artwork"
              : entry.origin === "Adapted"
                ? "From the notebook"
                : "Library extension"}
          </Badge>
        </div>
      </PageIntro>
      <div
        className="detail-tabs"
        role="tablist"
        aria-label={`${entry.name} documentation`}
        onKeyDown={(e) => {
          const i = tabs.indexOf(tab);
          const next =
            e.key === "ArrowRight"
              ? (i + 1) % tabs.length
              : e.key === "ArrowLeft"
                ? (i + tabs.length - 1) % tabs.length
                : e.key === "Home"
                  ? 0
                  : e.key === "End"
                    ? tabs.length - 1
                    : -1;
          if (next >= 0) {
            e.preventDefault();
            setTab(tabs[next]);
            document.getElementById(`doc-tab-${tabs[next]}`)?.focus();
          }
        }}
      >
        {tabs.map((item) => (
          <button
            key={item}
            id={`doc-tab-${item}`}
            type="button"
            role="tab"
            aria-selected={tab === item}
            aria-controls={`doc-panel-${item}`}
            tabIndex={tab === item ? 0 : -1}
            onClick={() => setTab(item)}
          >
            {item === "react" ? (
              <>
                <Icon name="code" size={15} />
                React code
              </>
            ) : (
              item[0].toUpperCase() + item.slice(1)
            )}
          </button>
        ))}
      </div>
      <div
        role="tabpanel"
        id={`doc-panel-${tab}`}
        aria-labelledby={`doc-tab-${tab}`}
        className="documentation-panel"
        tabIndex={0}
      >
        {tab === "preview" && (
          <>
            <div className="playground">
              <div className="playground-toolbar">
                <span>
                  <i /> LIVE EXAMPLE
                </span>
                <div>
                  <button
                    aria-pressed={pattern}
                    onClick={() => setPattern((v) => !v)}
                    title="Toggle dot grid"
                  >
                    <Icon name="grid" size={15} />
                    <span>Dot grid</span>
                  </button>
                  <button onClick={() => setReplay((v) => v + 1)}>
                    <Icon name="replay" size={14} />
                    Reset
                  </button>
                </div>
              </div>
              <div
                className={`playground-canvas ${pattern ? "is-dotted" : ""}`}
              >
                <Demo id={entry.id} key={replay} quiet={quiet} speed={speed} />
              </div>
              <div className="playground-caption">
                <span>Try it. These pieces are made to be used.</span>
                <span>
                  {isMotion
                    ? entry.id === "hairline-sketch"
                      ? "HAIRLINE · POINTER + SVG"
                      : "ORIGINAL MOTION · CSS + SVG"
                    : "LIVE REACT COMPONENT"}
                </span>
              </div>
            </div>
            {isMotion && (
              <div className="motion-controls">
                <Switch
                  label="Quiet motion"
                  checked={quiet}
                  onChange={(e) => {
                    setQuiet(e.target.checked);
                    setReplay((v) => v + 1);
                  }}
                />
                {entry.id !== "hairline-sketch" && (
                  <Select
                    label="Playback speed"
                    value={speed}
                    onChange={(e) => {
                      setSpeed(Number(e.target.value) as DrawingSpeed);
                      setReplay((v) => v + 1);
                    }}
                  >
                    <option value="0.5">0.5× · take it slow</option>
                    <option value="1">1× · original</option>
                    <option value="1.5">1.5×</option>
                    <option value="2">2×</option>
                  </Select>
                )}
                <Button
                  variant="secondary"
                  onClick={() => setReplay((v) => v + 1)}
                >
                  <Icon name="replay" size={15} />
                  Replay
                </Button>
              </div>
            )}
            <div className="detail-summary">
              <h2>A small note on using it</h2>
              <p>{entry.guidance}</p>
            </div>
            <CodeBlock copy={copy} code={entry.code} />
          </>
        )}
        {tab === "react" && (
          <>
            <h2>Make it your own</h2>
            <p className="guide-copy">
              {entry.usage ||
                "Import the component from the library. Event handlers and state belong in your application."}
            </p>
            <CodeBlock copy={copy} code={entry.code} />
            <a href="#getting-started" className="text-link">
              Installation & theme setup
              <Icon name="arrow" size={15} />
            </a>
          </>
        )}
        {tab === "props" && (
          <>
            <h2>The component API</h2>
            <p className="guide-copy">
              Primary props for this piece. The exported TypeScript interfaces
              provide the complete native and component-specific API.
            </p>
            <div className="props-table-wrap">
              <table className="props-table">
                <thead>
                  <tr>
                    <th>Prop</th>
                    <th>Type / options</th>
                    <th>Default</th>
                  </tr>
                </thead>
                <tbody>
                  {entry.props.map(([name, type, defaultValue]) => (
                    <tr key={name}>
                      <td>
                        <code>{name}</code>
                      </td>
                      <td>
                        <code>{type}</code>
                      </td>
                      <td>{defaultValue}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="guide-copy">
              See{" "}
              <code>
                src/lib/
                {["touch-feedback-setting", "ink-switch"].includes(entry.id)
                  ? "haptics.tsx"
                  : entry.group === "Brand"
                    ? "brand.tsx"
                    : entry.id === "theme-toggle"
                      ? "theme.tsx"
                      : [
                            "annotation",
                            "timeline",
                            "polaroid-stack",
                            "flower-progress",
                          ].includes(entry.id)
                        ? "patterns.tsx"
                        : [
                              "menu-toggle",
                              "task-checkbox",
                              "skeleton",
                              "popover",
                              "notification-card",
                            ].includes(entry.id)
                          ? `${entry.id}.tsx`
                          : "components.tsx"}
              </code>{" "}
              for the exported interface. Native attributes are passed through
              where supported.
            </p>
          </>
        )}
        {tab === "guidelines" && (
          <>
            <h2>Use it with a little care</h2>
            <div className="guideline-note">
              <HandwrittenNote>the small decisions matter.</HandwrittenNote>
              <p>{entry.guidance}</p>
            </div>
            <div className="two-columns">
              <div>
                <h3>Keep the system together</h3>
                <p className="guide-copy">
                  Use semantic tokens, the established fonts, and familiar
                  spacing. Check the component in Light, Dark, and Hybrid,
                  especially when composing your own surfaces.
                </p>
                <a href="#style-guide" className="text-link">
                  Read the style guide
                  <Icon name="arrow" size={15} />
                </a>
              </div>
              <div>
                <h3>Make it work for everyone</h3>
                <p className="guide-copy">
                  Give controls clear names and visible focus. Check keyboard
                  behavior, long labels, and narrow screens in the final page.
                  Respect reduced motion.
                </p>
                <a href="#accessibility" className="text-link">
                  Accessibility notes
                  <Icon name="arrow" size={15} />
                </a>
              </div>
            </div>
          </>
        )}
      </div>
      <div className="detail-pagination">
        {entries.indexOf(entry) > 0 ? (
          <a href={`#component/${entries[entries.indexOf(entry) - 1].id}`}>
            <span>PREVIOUS PIECE</span>
            <b>{entries[entries.indexOf(entry) - 1].name}</b>
          </a>
        ) : (
          <div />
        )}
        {entries.indexOf(entry) < entries.length - 1 && (
          <a href={`#component/${entries[entries.indexOf(entry) + 1].id}`}>
            <span>NEXT PIECE</span>
            <b>
              {entries[entries.indexOf(entry) + 1].name}
              <Icon name="arrow" size={15} />
            </b>
          </a>
        )}
      </div>
    </>
  );
}
function MotionPage({ copy }: { copy: (text: string) => void }) {
  const [replay, setReplay] = useState(0);
  const [quiet, setQuiet] = useState(false);
  const [speed, setSpeed] = useState<DrawingSpeed>(1);
  return (
    <>
      <PageIntro
        eyebrow="MOTION / THE ORIGINAL SIGNATURE"
        title="Outline, then ink"
        description="The exact Dom Lee. letterforms from the personal site. A shared sketch, a sweep of ink, and one small green period."
      />
      <div className="motion-stage is-dotted">
        <div className="motion-stage-banner">SEATTLE · SOFTWARE ENGINEER</div>
        <div className="motion-name" key={`${replay}-${quiet}-${speed}`}>
          <HeroName quiet={quiet} speed={speed} />
        </div>
        <HandwrittenNote>a little corner of the internet.</HandwrittenNote>
        <span className="motion-stage-label">
          THE SHARED SKETCH · ORIGINAL CHOREOGRAPHY
        </span>
      </div>
      <div className="motion-controls">
        <Button variant="secondary" onClick={() => setReplay((v) => v + 1)}>
          <Icon name="replay" size={15} />
          Replay the drawing
        </Button>
        <Select
          label="Playback speed"
          value={speed}
          onChange={(e) => setSpeed(Number(e.target.value) as DrawingSpeed)}
        >
          <option value="0.5">0.5× · take it slow</option>
          <option value="1">1× · original</option>
          <option value="1.5">1.5×</option>
          <option value="2">2×</option>
        </Select>
        <Switch
          label="Quiet motion"
          checked={quiet}
          onChange={(e) => setQuiet(e.target.checked)}
        />
      </div>
      <section className="guide-section">
        <div className="section-heading">
          <h2>A little choreography</h2>
          <span className="hand-small">one thought at a time.</span>
        </div>
        <div className="motion-timeline">
          {[
            [
              "01",
              "160–1180ms",
              "The outline",
              "All letter contours sketch together.",
            ],
            [
              "02",
              "1320–1980ms",
              "The ink",
              "One opaque, diagonal sweep fills the name.",
            ],
            [
              "03",
              "2060–2240ms",
              "The period",
              "The green dot finishes the signature.",
            ],
          ].map(([n, time, title, desc]) => (
            <article key={n}>
              <span>{n}</span>
              <code>{time}</code>
              <h3>{title}</h3>
              <p>{desc}</p>
            </article>
          ))}
        </div>
        <p className="guide-copy">
          The source hero groups banner and name outlines into one sketch phase.
          Banner ink begins at 1180ms, label at 1380ms, and the handwritten
          tagline follows at 2300ms. The library preserves the name choreography
          and offers the animated banner as a separate component.
        </p>
      </section>
      <section className="guide-section">
        <h2>Motion is a little extra</h2>
        <div className="two-columns">
          <p className="guide-copy">
            Finished artwork is the static default. Animations run only when
            enabled and when the visitor allows motion. Quiet mode and reduced
            motion reveal all of the artwork immediately.
          </p>
          <p className="guide-copy">
            Replay is always explicit. Each name instance has its own SVG clip
            ID, so multiple previews can share a page without interfering with
            one another. Speed adjusts the whole sequence together.
          </p>
        </div>
        <CodeBlock
          copy={copy}
          code={
            'import { useState } from "react";\nimport { HeroName, Button } from "@domlee/ui";\n\nexport function Signature() {\n  const [replay, setReplay] = useState(0);\n  return (\n    <div style={{ fontSize: 72 }}>\n      <HeroName replayKey={replay} speed={1} />\n      <Button onClick={() => setReplay(v => v + 1)}>Replay</Button>\n    </div>\n  );\n}'
          }
        />
      </section>
      <section className="guide-section">
        <h2>A menu that moves together</h2>
        <p className="guide-copy">
          The narrow-screen notebook uses one persistent menu button. Its three
          strokes turn into a close mark while the drawer slides in and the
          backdrop fades. All three share a 360ms ease-out transition. Closing
          reverses the same movement, including when another tap interrupts it.
          Reduced motion changes the state immediately.
        </p>
        <div className="component-playground">
          <div className="playground-canvas">
            <Demo id="menu-toggle" />
          </div>
        </div>
        <p className="guide-copy">
          The button keeps focus as it changes. Escape, a navigation choice, or
          a tap outside dismisses the drawer. Closed navigation leaves the tab
          order, and the wide-screen rail stays in the page. The shared tokens
          are <code>--dm-menu-duration</code> and <code>--dm-menu-easing</code>.
        </p>
        <a className="text-link" href="#component/menu-toggle">
          Explore the menu toggle <Icon name="arrow" size={16} />
        </a>
      </section>
      <section className="guide-section">
        <h2>A page that turns quietly</h2>
        <p className="guide-copy">
          Supported browsers give the content sheet a brief fade and an 8px
          settle as you move through the notebook. The navigation and theme
          controls keep their place. Try a page link, then Back or Forward.
          Reduced motion uses the immediate route change; modals and the mobile
          drawer keep their own choreography.
        </p>
        <p className="guide-copy">
          The shared <code>createPageTransition</code> helper wraps a committed
          DOM update. Your router keeps control of URLs, scroll, and focus.
          Interrupted snapshots cannot put an older page back, and existing
          in-page anchors keep working. The notebook returns actual route
          changes to the top of the new page.
        </p>
        <a className="text-link" href="#layers">
          Try the page flow <Icon name="arrow" size={16} />
        </a>
      </section>
      <a href="#category/Brand" className="text-link">
        Explore the brand pieces
        <Icon name="arrow" size={16} />
      </a>
    </>
  );
}
