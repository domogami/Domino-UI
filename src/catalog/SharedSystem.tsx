import { Icon } from "../Icons";
import { Crane, HandwrittenNote, HeroName, SketchArrow } from "../lib/brand";
import { CodeBlock, PageIntro } from "./Foundations";
import "./shared-system.css";

const consumers = [
  {
    name: "Personal website",
    host: "dominicklee.net",
    icon: "sparkle",
    adapter: "React components + shared CSS",
    detail:
      "The name animation, navigation, project cards, banners, and journal details.",
  },
  {
    name: "Quartz garden",
    host: "domogami.github.io",
    icon: "leaf",
    adapter: "Native Quartz styles + shared CSS",
    detail:
      "The reading page, explorer, callouts, links, search, and garden chrome.",
  },
  {
    name: "Obsidian",
    host: "Your writing workspace",
    icon: "book",
    adapter: "An additive CSS snippet",
    detail:
      "The editor, reading view, sidebars, typography, and handwritten annotations.",
  },
] as const;

const contract = [
  [
    "Surfaces",
    "Hybrid by default: charcoal chrome around a warm cream document. Light and dark use the same semantic roles.",
  ],
  [
    "Typography",
    "Poppins for headings, Lexend for reading, IBM Plex Mono for metadata, Caveat for notes, and Kalam for bold lettering.",
  ],
  [
    "Paper & space",
    "A 32px dot grid, a consistent spacing scale, fine ink borders, and softly irregular corners.",
  ],
  [
    "Brand & marks",
    "The original Dom Lee. outlines and crane facets; journal bullets, hand-drawn arrows, and banners.",
  ],
  [
    "Interaction",
    "Visible keyboard focus, readable contrast, restrained motion, and reduced-motion support.",
  ],
  [
    "Ownership",
    "One versioned token source. Each platform translates shared roles into its own native interface.",
  ],
] as const;

function PortfolioShell() {
  return (
    <div className="shared-shell shared-shell--portfolio">
      <div className="shared-shell-chrome shared-portfolio-chrome">
        <span className="shared-brand">
          <Crane quiet /> dom lee.
        </span>
        <span>
          work <span aria-hidden="true">/</span> garden
        </span>
      </div>
      <div className="shared-shell-document shared-portfolio-document">
        <span className="shared-shell-eyebrow">A LITTLE ABOUT ME</span>
        <HeroName quiet className="shared-hero-name" />
        <p>Making things. Following curiosity.</p>
        <div className="shared-small-banner">
          A collection of things in progress <SketchArrow direction="right" />
        </div>
        <div className="shared-project-stubs" aria-hidden="true">
          <div>
            <Icon name="grid" />
            <span>A recent project</span>
          </div>
          <div>
            <Icon name="leaf" />
            <span>From the garden</span>
          </div>
        </div>
        <span className="shared-hand-note">a little room to explore</span>
      </div>
    </div>
  );
}

function GardenShell() {
  return (
    <div className="shared-shell shared-shell--garden">
      <div className="shared-shell-chrome shared-garden-chrome">
        <span className="shared-brand">
          <Crane quiet /> the garden
        </span>
        <Icon name="search" size={15} />
      </div>
      <div className="shared-shell-document shared-garden-document">
        <span className="shared-shell-eyebrow">GARDEN / FIELD NOTES</span>
        <h3>
          Ideas grow here<span>.</span>
        </h3>
        <div className="shared-mini-meta">a living note · 3 min read</div>
        <p>
          A place for connections, unfinished thoughts, and things worth
          keeping.
        </p>
        <aside className="shared-mini-callout">
          <Icon name="leaf" size={16} />
          <span>Leave room for an idea to change.</span>
        </aside>
        <div className="shared-mini-link">
          <span>Related notes</span>
          <SketchArrow direction="right" />
        </div>
        <div className="shared-graph-stub" aria-hidden="true">
          <i />
          <i />
          <i />
          <i />
          <i />
        </div>
      </div>
    </div>
  );
}

function ObsidianShell() {
  return (
    <div className="shared-shell shared-shell--obsidian">
      <div className="shared-shell-chrome shared-editor-chrome">
        <span>the notebook</span>
        <Icon name="pen" size={15} />
      </div>
      <div className="shared-editor-layout">
        <div
          className="shared-shell-chrome shared-editor-rail"
          aria-hidden="true"
        >
          <Icon name="book" size={15} />
          <Icon name="search" size={15} />
          <Icon name="grid" size={15} />
        </div>
        <div className="shared-shell-document shared-editor-document">
          <div className="shared-mini-meta">daily notes / today</div>
          <h3>
            A fresh page<span>.</span>
          </h3>
          <div className="shared-mini-tag">#small-steps</div>
          <p>One thought at a time.</p>
          <ul className="shared-journal-list">
            <li>
              <span className="shared-journal-dot" /> Capture a thought
            </li>
            <li>
              <span className="shared-journal-box">
                <Icon name="check" size={12} />
              </span>{" "}
              Make a little progress
            </li>
            <li>
              <SketchArrow direction="right" /> Carry an idea forward
            </li>
          </ul>
          <span className="shared-hand-note">keep going, gently</span>
        </div>
      </div>
    </div>
  );
}

export function SharedSystemPage({ copy }: { copy: (text: string) => void }) {
  return (
    <>
      <PageIntro
        eyebrow="06 / ONE SHARED SYSTEM"
        title="One notebook, everywhere"
        description="The website, the garden, and the place where you write should feel like parts of the same world. Domino UI is the shared foundation for that gradual move."
      >
        <div className="shared-intro-note">
          <Icon name="half" size={16} /> Hybrid is the default. Use the theme
          control above to compare all three previews.
        </div>
      </PageIntro>

      <section
        className="shared-architecture"
        aria-labelledby="shared-architecture-title"
      >
        <div className="shared-source-card">
          <span className="shared-kicker">THE SOURCE OF TRUTH</span>
          <h2 id="shared-architecture-title">
            <Icon name="palette" size={22} /> Domino UI
          </h2>
          <code>tokens/system.json</code>
          <p>
            Theme roles, fonts, spacing, paper, and motion. Shared artwork and
            React components live alongside them.
          </p>
          <div className="shared-source-footer">
            <Icon name="code" size={15} /> Generate once. Adopt a version.
          </div>
        </div>
        <div className="shared-branches" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <div className="shared-consumers">
          {consumers.map((consumer) => (
            <article className="shared-consumer" key={consumer.name}>
              <div className="shared-consumer-heading">
                <Icon name={consumer.icon} size={20} />
                <span className="shared-status">Adoption planned</span>
              </div>
              <h3>{consumer.name}</h3>
              <span className="shared-consumer-host">{consumer.host}</span>
              <p>{consumer.detail}</p>
              <div className="shared-adapter">
                <Icon name="code" size={14} />
                {consumer.adapter}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="guide-section" aria-labelledby="shared-preview-title">
        <div className="section-heading shared-section-heading">
          <h2 id="shared-preview-title">Different places. A familiar page.</h2>
          <HandwrittenNote>
            the same ink <SketchArrow direction="down-right" />
          </HandwrittenNote>
        </div>
        <p className="guide-copy">
          These compact structural previews use the live Domino theme tokens.
          They illustrate the shared direction; the three destination
          integrations have not been installed.
        </p>
        <div className="shared-preview-grid">
          <figure>
            <PortfolioShell />
            <figcaption>
              <span>01</span> Personal website <small>React</small>
            </figcaption>
          </figure>
          <figure>
            <GardenShell />
            <figcaption>
              <span>02</span> Quartz garden <small>Native CSS</small>
            </figcaption>
          </figure>
          <figure>
            <ObsidianShell />
            <figcaption>
              <span>03</span> Obsidian <small>CSS snippet</small>
            </figcaption>
          </figure>
        </div>
      </section>

      <section
        className="guide-section"
        aria-labelledby="shared-contract-title"
      >
        <div className="section-heading">
          <h2 id="shared-contract-title">What stays consistent</h2>
        </div>
        <p className="guide-copy">
          The shared contract describes the visual language. Adapters connect
          that language to the controls and document structure each application
          already has.
        </p>
        <dl className="shared-contract">
          {contract.map(([term, detail]) => (
            <div key={term}>
              <dt>{term}</dt>
              <dd>{detail}</dd>
            </div>
          ))}
        </dl>
        <div className="shared-font-strip" aria-label="Five shared typefaces">
          <span>Poppins</span>
          <span>Lexend</span>
          <span>IBM Plex Mono</span>
          <span>Caveat</span>
          <span>Kalam</span>
        </div>
        <div className="shared-contract-note">
          <Icon name="info" size={18} />
          <p>
            Use semantic roles such as <code>--dm-paper</code>,{" "}
            <code>--dm-ink</code>, and <code>--dm-sidebar</code>. Theme
            selection changes those roles together; destination styles should
            not carry their own copies of the palette.
          </p>
        </div>
      </section>

      <section className="guide-section" aria-labelledby="shared-release-title">
        <div className="section-heading">
          <h2 id="shared-release-title">A change has one starting point</h2>
        </div>
        <ol className="shared-change-flow">
          <li>
            <span>1</span>
            <div>
              <strong>Edit the source</strong>
              <p>
                Adjust the shared tokens, component, or artwork in Domino UI.
              </p>
            </div>
          </li>
          <li>
            <span>2</span>
            <div>
              <strong>Build the outputs</strong>
              <p>
                Generate theme CSS and native adapters, then build the React
                library.
              </p>
            </div>
          </li>
          <li>
            <span>3</span>
            <div>
              <strong>Adopt deliberately</strong>
              <p>
                Each destination uses a recorded version and checks the result
                in its own runtime.
              </p>
            </div>
          </li>
        </ol>
        <CodeBlock
          code={"npm run build:system\nnpm run build:lib"}
          label="From the Domino UI repository"
          copy={copy}
        />
        <p className="shared-release-note">
          A shared source makes updates repeatable. A website deployment, Quartz
          build, or Obsidian snippet update remains an explicit adoption step.
        </p>
      </section>

      <section className="guide-section" aria-labelledby="shared-rollout-title">
        <div className="section-heading">
          <h2 id="shared-rollout-title">Bring it home, one place at a time</h2>
        </div>
        <ol className="shared-rollout">
          <li>
            <span className="shared-rollout-number">01</span>
            <div>
              <span className="shared-status">Planned</span>
              <h3>Start with the personal website</h3>
              <p>
                Adopt the React library and shared themes. Preserve the original
                name animation, crane, content, and URLs. Check the full site at
                desktop and mobile sizes before release.
              </p>
            </div>
          </li>
          <li>
            <span className="shared-rollout-number">02</span>
            <div>
              <span className="shared-status">Planned</span>
              <h3>Connect the Quartz garden</h3>
              <p>
                Integrate the adapter in the garden-v5 workspace. Check real
                notes, search, explorer, graph, callouts, mobile layout, and the
                Flower Hunt collector in the generated garden.
              </p>
            </div>
          </li>
          <li>
            <span className="shared-rollout-number">03</span>
            <div>
              <span className="shared-status">Planned</span>
              <h3>Add the Obsidian snippet</h3>
              <p>
                Layer a switchable snippet over the current theme. Compare
                reading view, Live Preview, source mode, sidebars, and existing
                plugins inside Obsidian.
              </p>
            </div>
          </li>
          <li>
            <span className="shared-rollout-number">
              <Icon name="check" size={20} />
            </span>
            <div>
              <h3>Keep every adoption reversible</h3>
              <p>
                Record the Domino UI version, compare hybrid, light, and dark in
                the target application, and keep the previous build or snippet
                available for rollback.
              </p>
            </div>
          </li>
        </ol>
      </section>
    </>
  );
}
