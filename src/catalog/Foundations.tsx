import { useState } from "react";
import { Button, Callout, Table, Kbd, Paper } from "../lib";
import { Icon } from "../Icons";
import { HandwrittenNote, SketchArrow } from "../lib/brand";
import type { Theme } from "../lib/theme";

export function CodeBlock({
  code,
  label = "React",
  copy,
}: {
  code: string;
  label?: string;
  copy: (text: string) => void;
}) {
  return (
    <div className="code-block">
      <div className="code-toolbar">
        <span>
          <Icon name="code" size={14} />
          {label}
        </span>
        <button onClick={() => copy(code)}>
          <Icon name="copy" size={14} />
          Copy
        </button>
      </div>
      <pre>
        <code>{code}</code>
      </pre>
    </div>
  );
}
export function PageIntro({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children?: React.ReactNode;
}) {
  return (
    <header className="page-intro">
      <div className="eyebrow">{eyebrow}</div>
      <h1>
        {title}
        <span className="title-period">.</span>
      </h1>
      <p>{description}</p>
      {children}
    </header>
  );
}
const colors = [
  ["Paper", "#efe7d7", "The page, with a little warmth.", "--dm-paper"],
  ["Ink", "#252b2e", "Words, outlines, and structure.", "--dm-ink"],
  ["Teal", "#0e7c79", "An invitation to do something.", "--dm-accent"],
  ["Charcoal", "#2b3034", "A frame for the notebook.", "--dm-sidebar"],
  ["Sage", "#d5e3cd", "A quiet thought taking root.", "--dm-sage"],
  ["Terracotta", "#a34e36", "A small, earthy emphasis.", "--dm-danger"],
  ["Mint", "#43d0c1", "A spark in the margins.", "reference only"],
  ["Blue paper", "#c6d9de", "A little context, pulled aside.", "--dm-blue"],
  ["Peach", "#eed5bf", "A gentle note of warmth.", "--dm-peach"],
  ["Lavender", "#ded9e8", "Space for a possibility.", "--dm-lavender"],
];
export function ColorPage({
  copy,
  theme,
}: {
  copy: (text: string) => void;
  theme: Theme;
}) {
  const download = () => {
    const computed = getComputedStyle(document.documentElement);
    const semantic = Object.fromEntries(
      [
        "paper",
        "surface",
        "surface-raised",
        "ink",
        "muted",
        "border",
        "accent",
        "accent-ink",
        "sage",
        "peach",
        "lavender",
        "blue",
        "danger",
        "focus",
        "sidebar",
        "sidebar-ink",
      ].map((key) => [
        `--dm-${key}`,
        computed.getPropertyValue(`--dm-${key}`).trim(),
      ]),
    );
    const blob = new Blob(
      [JSON.stringify({ name: "Domino UI", theme, tokens: semantic }, null, 2)],
      { type: "application/json" },
    );
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `domino-tokens-${theme}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };
  return (
    <>
      <PageIntro
        eyebrow="01 / FOUNDATIONS"
        title="Color & themes"
        description="Paper, ink, and colors borrowed from things that grow. A small palette with clear jobs."
      />
      <div className="section-heading">
        <h2>The source palette</h2>
        <span className="hand-small">
          click a swatch to keep its hex <SketchArrow direction="down-right" />
        </span>
      </div>
      <div className="swatch-grid">
        {colors.map(([name, hex, desc, token]) => (
          <button className="swatch" key={name} onClick={() => copy(hex)}>
            <div className="swatch-color" style={{ background: hex }}>
              <span
                style={{
                  color: ["#252b2e", "#0e7c79", "#2b3034", "#a34e36"].includes(
                    hex,
                  )
                    ? "#efe7d7"
                    : "#252b2e",
                }}
              >
                <Icon name="copy" size={16} />
              </span>
            </div>
            <div className="swatch-body">
              <strong>{name}</strong>
              <code>{hex.toUpperCase()}</code>
              <p>{desc}</p>
              <small>{token}</small>
            </div>
          </button>
        ))}
      </div>
      <section className="guide-section">
        <div className="section-heading">
          <h2>Same notebook. Three kinds of light.</h2>
          <Button variant="secondary" size="sm" onClick={download}>
            <Icon name="download" size={15} />
            Export {theme} tokens
          </Button>
        </div>
        <div className="theme-cards">
          {(["hybrid", "light", "dark"] as const).map((t) => (
            <a
              href="#themes"
              className={`theme-card ${t === theme ? "is-selected" : ""}`}
              key={t}
            >
              <div className={`mini-notebook mini-notebook--${t}`}>
                <i />
                <div>
                  <b />
                  <b />
                  <span />
                </div>
              </div>
              <h3>
                {t[0].toUpperCase() + t.slice(1)}
                {t === "hybrid" && (
                  <span className="default-label">DEFAULT</span>
                )}
              </h3>
              <p>
                {t === "hybrid"
                  ? "Charcoal around the edges. Cream where ideas happen."
                  : t === "light"
                    ? "Warm paper, from the frame to the last page."
                    : "Charcoal paper, cream ink, and a sage accent."}
              </p>
            </a>
          ))}
        </div>
        <p className="guide-copy">
          Use the theme control in the header to compare the entire library.
          Hybrid is a composition of surfaces, rather than a midpoint between
          two color values. An explicit choice stays with you after a reload.
        </p>
      </section>
      <section className="guide-section">
        <h2>Use roles, not raw colors</h2>
        <p className="guide-copy">
          Semantic tokens change with the theme. <code>--dm-accent</code>{" "}
          becomes sage in dark mode; <code>--dm-ink</code> becomes cream. The
          source palette above stays fixed as a reference.
        </p>
        <div className="semantic-grid">
          {[
            "paper",
            "surface",
            "surface-raised",
            "ink",
            "muted",
            "border",
            "accent",
            "accent-ink",
            "focus",
            "danger",
          ].map((role) => (
            <button
              className="semantic-token"
              onClick={() => copy(`var(--dm-${role})`)}
              key={role}
            >
              <i style={{ background: `var(--dm-${role})` }} />
              <code>--dm-{role}</code>
              <Icon name="copy" size={13} />
            </button>
          ))}
        </div>
        <Callout tone="info" title="Source and extension">
          Paper, ink, teal, charcoal, sage, terracotta, mint, and blue paper
          come from the two source sites. Peach, lavender, raised surfaces, and
          standardized semantic roles extend that system for reusable UI.
        </Callout>
      </section>
    </>
  );
}
export function TypographyPage() {
  const [text, setText] = useState("A little room for curiosity.");
  return (
    <>
      <PageIntro
        eyebrow="02 / FOUNDATIONS"
        title="Words with character"
        description="Five familiar voices, each with a job. Clear where it matters; personal where it feels right."
      />
      <label className="specimen-input">
        <Icon name="pen" />
        <input
          aria-label="Type specimen text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Write your own specimen…"
        />
      </label>
      <div className="font-specimens">
        {[
          {
            name: "Poppins",
            role: "The structure",
            desc: "Headings, identity, and a clear sense of place.",
            cls: "heading",
            meta: "500 · 600 · 700 / DISPLAY & HEADINGS",
          },
          {
            name: "Lexend",
            role: "The conversation",
            desc: "Readable paragraphs, field labels, and everyday interface copy.",
            cls: "body",
            meta: "300 · 500 / BODY & INTERFACE",
          },
          {
            name: "IBM Plex Mono",
            role: "The small details",
            desc: "Navigation, folios, labels, and a little bit of code.",
            cls: "mono",
            meta: "400 / METADATA & CODE",
          },
          {
            name: "Caveat",
            role: "A note in the margin",
            desc: "Brief, human asides. Keep it short and give it space.",
            cls: "hand",
            meta: "400–700 / ANNOTATIONS",
          },
          {
            name: "Kalam",
            role: "The hand-lettered heading",
            desc: "Banner labels and a few deliberate, expressive landmarks.",
            cls: "lettered",
            meta: "700 / BANNERS & SPECIAL HEADINGS",
          },
        ].map((font) => (
          <article className="font-specimen" key={font.name}>
            <div>
              <span className="eyebrow">{font.role}</span>
              <h2>{font.name}</h2>
              <p>{font.desc}</p>
              <code>{font.meta}</code>
            </div>
            <div className={`font-sample font-sample--${font.cls}`}>
              {text || "A little room for curiosity."}
              <small>Aa Bb Cc · 0123456789</small>
            </div>
          </article>
        ))}
      </div>
      <section className="guide-section">
        <h2>A practical type scale</h2>
        <Table
          caption="Recommended interface type scale, an extension of the source typography"
          columns={[
            { key: "role", header: "Role", render: (r) => r.role },
            {
              key: "size",
              header: "Size / line height",
              render: (r) => r.size,
            },
            { key: "family", header: "Family", render: (r) => r.family },
          ]}
          data={[
            {
              role: "Display",
              size: "48–64 / 1.15",
              family: "Poppins 600–700",
            },
            {
              role: "Page heading",
              size: "32–40 / 1.2",
              family: "Poppins 600",
            },
            {
              role: "Section heading",
              size: "20–24 / 1.4",
              family: "Poppins 600",
            },
            {
              role: "Reading copy",
              size: "16–17 / 32px",
              family: "Lexend 300",
            },
            {
              role: "Interface copy",
              size: "13–14 / 1.6",
              family: "Lexend 300–500",
            },
            {
              role: "Metadata",
              size: "11–12 / 1.6",
              family: "IBM Plex Mono 400",
            },
            {
              role: "Margin note",
              size: "24–28 / 1.3",
              family: "Caveat 400–700",
            },
          ]}
        />
        <Callout tone="info" title="Fonts travel with the library">
          All five families are self-hosted. Their SIL Open Font Licenses are
          included with the assets; no runtime font service is needed.
        </Callout>
      </section>
      <section className="guide-section paper-rhythm-guide">
        <h2>Give every letter room</h2>
        <p className="guide-copy">
          Writing lines sit between rows of text or just beneath the ink. Keep
          ascenders, descenders, and wrapped lines clear. Larger lettering gets
          an open band of paper so the words can breathe. The specimen text
          above also updates these examples.
        </p>
        <div className="paper-rhythm-examples">
          {(["between", "baseline"] as const).map((ruleAlign) => (
            <article key={ruleAlign}>
              <h3>
                {ruleAlign === "between"
                  ? "Between the lines"
                  : "A writing guide"}
              </h3>
              <Paper pattern="lined" padding="md" ruleAlign={ruleAlign}>
                <h4>{text || "A little room for thought"}</h4>
                <p>A page of good questions, quiet plans, and playful ideas.</p>
                <p className="paper-rhythm-hand">
                  {text || "Good things need room to grow."}
                </p>
              </Paper>
            </article>
          ))}
        </div>
        <a className="text-link" href="#component/paper">
          Explore paper and placement <Icon name="arrow" size={15} />
        </a>
      </section>
    </>
  );
}
export function SpacingPage() {
  return (
    <>
      <PageIntro
        eyebrow="03 / FOUNDATIONS"
        title="A steady rhythm"
        description="A 32px dot grid keeps the notebook together. Smaller steps make the interface feel considered."
      />
      <div className="spacing-surface">
        {[4, 8, 12, 16, 24, 32, 48, 64].map((n) => (
          <div className="spacing-row" key={n}>
            <code>{n}px</code>
            <i style={{ width: `${n * 5}px` }} />
            <span>
              {n === 32
                ? "the journal grid"
                : n === 64
                  ? "a new section"
                  : n === 16
                    ? "between related things"
                    : n === 4
                      ? "a small adjustment"
                      : ""}
            </span>
          </div>
        ))}
      </div>
      <div className="two-columns guide-section">
        <div>
          <h2>Dots are a structure</h2>
          <p className="guide-copy">
            Use the original 32px pitch and align long reading copy to a 32px
            line height. Keep the grid stationary across a surface. A wash of
            paper quiets the dots behind dense content.
          </p>
          <div className="pattern-samples">
            <div className="pattern-dots">
              <span>32px · dot grid</span>
            </div>
            <Paper className="pattern-lines" pattern="lined" padding="sm">
              <span>32px · ruled paper</span>
            </Paper>
          </div>
        </div>
        <div>
          <h2>Edges with a human touch</h2>
          <p className="guide-copy">
            Keep standard controls stable. Small asymmetries belong to paper,
            callouts, and drawn details. Fold corners at 20px and apply shadows
            to the paper silhouette.
          </p>
          <div className="edge-samples">
            <div>
              3 / 7 / 5 / 4<br />
              <small>callout corners</small>
            </div>
            <div>
              2px 3px
              <br />
              <small>quiet offset shadow</small>
            </div>
          </div>
        </div>
      </div>
      <section className="guide-section">
        <h2>Room at every size</h2>
        <div className="principle-grid">
          <article>
            <b>01</b>
            <h3>Small screens first</h3>
            <p>
              One column, 20px page gutters, visible navigation controls, and no
              offscreen actions.
            </p>
          </article>
          <article>
            <b>02</b>
            <h3>A useful middle</h3>
            <p>
              At 760px, previews can sit side by side. Labels and examples still
              wrap naturally.
            </p>
          </article>
          <article>
            <b>03</b>
            <h3>A little more space</h3>
            <p>
              The desktop index stays near the page. Reading lines stay below 75
              characters.
            </p>
          </article>
        </div>
      </section>
    </>
  );
}
export function StylePage() {
  return (
    <>
      <PageIntro
        eyebrow="THE STYLE GUIDE"
        title="Paper, patience & a little curiosity"
        description="The feeling comes from a few deliberate choices, used with care. These are the rules behind the notebook."
      />
      <div className="principle-grid">
        <article>
          <b>01 / ORDER</b>
          <h3>Structure makes room.</h3>
          <p>
            A steady grid, clear hierarchy, and useful labels help people find
            their way. Let the personality live inside that structure.
          </p>
        </article>
        <article>
          <b>02 / HUMANITY</b>
          <h3>A hand, lightly visible.</h3>
          <p>
            One handwritten aside means more than a page full of them. Keep the
            little irregularities where they feel intentional.
          </p>
        </article>
        <article>
          <b>03 / CURIOSITY</b>
          <h3>Leave room to grow.</h3>
          <p>
            Components are useful beginnings. Compose a few familiar pieces
            before inventing a whole new pattern.
          </p>
        </article>
      </div>
      <section className="guide-section">
        <h2>The notebook key</h2>
        <p className="guide-copy">
          These are the five marks used on the personal site, with their
          original meanings. The migrated marker is not a generic “in progress”
          symbol.
        </p>
        <div className="journal-key">
          {[
            ["•", "On my list", "An actionable task"],
            ["×", "Made & loved", "A completed task"],
            ["○", "A little happening", "A dated event"],
            ["–", "Worth a scribble", "A note or observation"],
            [">", "Carried forward", "A migrated task"],
          ].map(([mark, label, meaning]) => (
            <div key={label}>
              <b>{mark}</b>
              <strong>{label}</strong>
              <span>{meaning}</span>
            </div>
          ))}
        </div>
      </section>
      <section className="guide-section">
        <h2>A voice that sounds like a person</h2>
        <div className="two-columns writing-examples">
          <article className="writing-good">
            <span className="eyebrow">WRITE IT THIS WAY</span>
            <h3>“A thought, saved.”</h3>
            <p>
              Plain, specific, kind. Small bits of personality where there is
              room.
            </p>
            <ul>
              <li>“Add a title before saving this note.”</li>
              <li>“Keep exploring”</li>
              <li>“A fresh page for your next idea.”</li>
            </ul>
          </article>
          <article>
            <span className="eyebrow">KEEP IT USEFUL</span>
            <h3>Clarity comes first.</h3>
            <p>
              Critical actions, errors, and form labels need familiar words.
            </p>
            <ul>
              <li>Say what happened and what to do next.</li>
              <li>Avoid false urgency and clever error messages.</li>
              <li>Use sentence case and active verbs.</li>
            </ul>
          </article>
        </div>
      </section>
      <section className="guide-section">
        <h2>Handwritten guidelines</h2>
        <div className="two-columns">
          <div>
            <HandwrittenNote>
              a little note goes a long way{" "}
              <SketchArrow direction="down-right" />
            </HandwrittenNote>
            <p className="guide-copy">
              Caveat belongs in the margins: a short annotation, a caption, a
              little personal aside. Kalam gives a few banners a hand-lettered
              voice. Body copy stays in Lexend.
            </p>
          </div>
          <div className="guide-list">
            <p>
              <b>Keep it brief.</b> A line or two is enough.
            </p>
            <p>
              <b>Keep it readable.</b> 24px or larger for the note.
            </p>
            <p>
              <b>Keep it grounded.</b> No random rotation on ordinary controls.
            </p>
            <p>
              <b>Keep it occasional.</b> Never compete with the main task.
            </p>
          </div>
        </div>
      </section>
      <section className="guide-section">
        <h2>Banners, folds & paper</h2>
        <p className="guide-copy">
          Notched strips mark a section; folded ribbons add weight to a bigger
          landmark. A folded sticky note holds one aside. Reserve offset shadows
          for layered paper. Dots, folds, handwriting, and motion do not all
          need to speak at once.
        </p>
        <p className="guide-copy">
          Keep writing rules clear of every letter. Text can sit between two
          rules or rest just above a writing guide. Give large headings and
          mixed content an open band, and let wrapped copy keep its rhythm.
        </p>
        <a className="text-link" href="#category/Notebook">
          Open the notebook patterns <Icon name="arrow" size={16} />
        </a>
      </section>
      <section className="guide-section">
        <h2>Where this system comes from</h2>
        <div className="source-links">
          <a href="https://dominicklee.net/" target="_blank" rel="noreferrer">
            <Icon name="book" />
            <span>
              <strong>The personal notebook</strong>
              <small>
                dominicklee.net · lettering, banners, paper & motion
              </small>
            </span>
            <Icon name="external" />
          </a>
          <a
            href="https://domogami.github.io/"
            target="_blank"
            rel="noreferrer"
          >
            <Icon name="leaf" />
            <span>
              <strong>The digital garden</strong>
              <small>
                domogami.github.io · Hybrid, annotations & reading surfaces
              </small>
            </span>
            <Icon name="external" />
          </a>
        </div>
        <p className="guide-copy">
          The original glyphs and artwork are preserved. The semantic tokens,
          reusable React controls, and component documentation extend those
          sources. The checked-in DESIGN.md records the distinction.
        </p>
      </section>
    </>
  );
}
export function AccessibilityPage() {
  return (
    <>
      <PageIntro
        eyebrow="GUIDELINES / ACCESSIBILITY"
        title="A notebook for everyone"
        description="The handwritten feeling should make the interface welcoming. Clear labels, stable structure, and good keyboard support do the practical work."
      />
      <div className="guide-list accessibility-list">
        {[
          [
            "Let the keyboard in",
            "Every action is a native button or link. Tab reaches controls; focus uses a visible 2px dashed ink or green outline. Arrow keys move through tabs and menus.",
          ],
          [
            "Give everything a name",
            "Labels stay visible. Errors are linked to their fields. Icon buttons require accessible names. Decorative artwork is hidden; meaningful SVGs have a title.",
          ],
          [
            "Keep focus where it belongs",
            "Dialogs and drawers use the native modal dialog. Opening moves focus inside, Escape closes, and closing returns focus to the opener.",
          ],
          [
            "Let motion become quiet",
            "Reduced motion shows completed artwork immediately. The motion playground also has an explicit quiet setting. No essential content depends on an animation finishing.",
          ],
          [
            "Use color with words",
            "Badges name their status. Errors include a readable explanation. Theme-specific semantic tokens keep light, dark, and Hybrid surfaces consistent.",
          ],
          [
            "Let the page grow",
            "Copy wraps, forms keep useful widths, and tables can scroll. At narrow sizes the index becomes a dismissible navigation panel. Test zoom and long labels in your actual composition.",
          ],
        ].map(([title, body], i) => (
          <article key={title}>
            <span className="eyebrow">0{i + 1}</span>
            <h2>{title}</h2>
            <p>{body}</p>
          </article>
        ))}
      </div>
      <Callout tone="info" title="Verify in the place it will live">
        These components provide accessible defaults. Your labels, color
        choices, page composition, and custom content still need keyboard,
        contrast, zoom, and screen-reader review.
      </Callout>
    </>
  );
}
export function GettingStarted({ copy }: { copy: (text: string) => void }) {
  return (
    <>
      <PageIntro
        eyebrow="GETTING STARTED"
        title="Open a fresh page"
        description="A small, typed React library and the notebook you are reading. Everything lives in this repository."
      />
      <section className="guide-section first-section">
        <h2>01 — Run the notebook</h2>
        <CodeBlock
          copy={copy}
          label="Terminal"
          code={
            "npm install\nnpm run dev\n\n# Verify the site and build the reusable library\nnpm run build\nnpm run build:lib"
          }
        />
      </section>
      <section className="guide-section">
        <h2>02 — Use it in another React project</h2>
        <p className="guide-copy">
          Install the source package from GitHub using Node 24. The Git install
          builds the library and types automatically. Use a reviewed commit SHA
          and keep your lockfile when adopting it in a maintained project.
        </p>
        <CodeBlock
          copy={copy}
          label="Terminal"
          code={
            "# Evaluate the latest mainline\nnpm install git+https://github.com/domogami/Domino-UI.git#main\n\n# Pin a reviewed revision for a maintained application\nnpm install 'git+https://github.com/domogami/Domino-UI.git#<FULL_COMMIT_SHA>'"
          }
        />
        <CodeBlock
          copy={copy}
          code={
            'import { ThemeProvider, Button, Paper } from "@domlee/ui";\nimport "@domlee/ui/styles.css";\nimport "@domlee/ui/fonts.css";\n\nexport default function App() {\n  return (\n    <ThemeProvider defaultTheme="hybrid">\n      <Paper>\n        <h1>A small beginning</h1>\n        <Button onClick={() => console.log("A thought, planted.")}>\n          Plant an idea\n        </Button>\n      </Paper>\n    </ThemeProvider>\n  );\n}'
          }
        />
        <Callout title="Bring the type with you" tone="info">
          Import <code>@domlee/ui/fonts.css</code> once. Compatible bundlers
          resolve and self-host its font files. For static pipelines, run
          <code> npx --no-install domino-ui-assets ./public</code> to copy the
          fonts and sketch SVGs with their notices. The helper protects changed
          existing files. This package is distributed through GitHub rather than
          the npm registry.
        </Callout>
        <p className="guide-copy">
          <a href="https://github.com/domogami/Domino-UI/blob/main/docs/ADOPTION.md">
            Full adoption guide
          </a>
          {" · "}
          <a href="https://github.com/domogami/Domino-UI/blob/main/docs/AGENT-PROMPT.md">
            Ready-to-paste agent prompt
          </a>
        </p>
      </section>
      <section className="guide-section">
        <h2>03 — Make Hybrid a layout choice</h2>
        <p className="guide-copy">
          ThemeProvider sets <code>data-theme</code> on the document. Your shell
          can use sidebar tokens for the dark frame, while paper and input
          components use canvas tokens. Components inherit their nearest token
          scope.
        </p>
        <CodeBlock
          copy={copy}
          label="CSS"
          code={
            ".app-frame {\n  background: var(--dm-sidebar);\n  color: var(--dm-sidebar-ink);\n}\n\n.reading-surface {\n  background: var(--dm-paper);\n  color: var(--dm-ink);\n}"
          }
        />
      </section>
      <section className="guide-section">
        <h2>04 — Keep the pieces together</h2>
        <div className="file-map">
          <code>src/lib/</code>
          <span>Typed React components, themes & original brand artwork</span>
          <code>src/styles/</code>
          <span>Semantic tokens, self-hosted fonts & notebook layout</span>
          <code>src/catalog/</code>
          <span>Live examples, code snippets & component reference</span>
          <code>DESIGN.md</code>
          <span>Source evidence, decisions & design guidelines</span>
          <code>docs/</code>
          <span>Component inventory, provenance & accessibility notes</span>
          <code>tests/</code>
          <span>Interaction, theme & responsive regression checks</span>
        </div>
      </section>
      <p className="guide-copy">
        Find a component at any time with <Kbd>⌘</Kbd> <Kbd>K</Kbd>, or{" "}
        <Kbd>Ctrl</Kbd> <Kbd>K</Kbd>.
      </p>
    </>
  );
}
