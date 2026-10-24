import { useState } from "react";
import { Button, Switch } from "../lib/components";
import { HandwrittenNote, SketchArrow } from "../lib/brand";
import { NotebookSketch, type NotebookSketchVariant } from "../lib/sketch";
import { HairlineSketch, type HairlineSketchVariant } from "../lib/hairline";
import { TripleBanner, BookmarkDrawing } from "../lib/journal-art";
import { useTheme } from "../lib/theme";
import { Icon } from "../Icons";
import { CodeBlock, PageIntro } from "./Foundations";
import "./sketchbook.css";

const originals: {
  variant: NotebookSketchVariant;
  title: string;
  caption: string;
  label: string;
}[] = [
  {
    variant: "notebook",
    title: "A page for today",
    caption: "a few good things, written down",
    label: "An open bullet journal with little checkboxes and a pen",
  },
  {
    variant: "flight",
    title: "Follow the little idea",
    caption: "leave a little room to wander",
    label: "A folded paper plane with a loose looping flight trail",
  },
  {
    variant: "garden",
    title: "Something taking root",
    caption: "small thoughts grow here",
    label: "A small leafy idea growing out of a stack of notebook pages",
  },
  {
    variant: "camera",
    title: "Keep the little things",
    caption: "a few moments worth saving",
    label: "A little camera beside two keepsake photographs",
  },
  {
    variant: "keyboard",
    title: "Made, one key at a time",
    caption: "a good place to start something",
    label: "A mechanical keyboard with a curly cable and a few teal keys",
  },
  {
    variant: "compass",
    title: "A little room for a detour",
    caption: "curiosity makes a good compass",
    label: "An open compass resting on a folded map with a wandering trail",
  },
];

const hairline: {
  variant: HairlineSketchVariant;
  title: string;
  caption: string;
  description: string;
}[] = [
  {
    variant: "riffle",
    title: "Notes to shuffle",
    caption: "one thought at a time",
    description: "A tray of cards that gently lift toward your pointer",
  },
  {
    variant: "branches",
    title: "Follow a thread",
    caption: "everything connects, eventually",
    description:
      "A branching line of connected ideas that rises as you explore",
  },
  {
    variant: "loupe",
    title: "Look a little closer",
    caption: "there’s always another detail",
    description:
      "A magnifying glass that follows your pointer across a ruled page",
  },
];

const exampleCode = `import { NotebookSketch, HairlineSketch, TripleBanner, BookmarkDrawing } from '@domlee/ui';
import '@domlee/ui/styles.css';

// Original notebook artwork. Change replayKey to draw again.
<NotebookSketch variant="notebook" replayOnClick replayKey={0}
  label="An open journal, ready for a few good things" />

// Actual Hairline artwork, with Domino's theme and motion rules.
<HairlineSketch variant="riffle" intensity={0.35} replayOnClick
  label="A tray of notes" />

// Real text grows each ribbon face. Colored folds join all three.
<TripleBanner lines={['Paper & patience', 'A little curiosity', 'Room to grow']}
  animate replayOnClick />
<BookmarkDrawing variant="notched" replayOnClick
  label="A bookmark for a thought worth keeping" />

// Both honor prefers-reduced-motion. quiet also stops pointer motion.
<NotebookSketch variant="garden" quiet />
<HairlineSketch variant="loupe" quiet />`;

export function SketchbookPage({ copy }: { copy: (text: string) => void }) {
  const [replay, setReplay] = useState(0);
  const [quiet, setQuiet] = useState(false);
  const [play, setPlay] = useState(false);
  const { theme } = useTheme();
  return (
    <div className="sketchbook-page">
      <PageIntro
        eyebrow="03 / A LITTLE CHARACTER"
        title="The sketchbook"
        description="Small drawings from the same notebook. Fine ink, warm paper, and a little curiosity in the margins."
      >
        <HandwrittenNote className="sketchbook-intro-note" animate={false}>
          light on ink, full of character <SketchArrow direction="down-right" />
        </HandwrittenNote>
      </PageIntro>

      <div
        className="sketchbook-controls"
        role="group"
        aria-label="Sketch motion"
      >
        <Switch
          label="Quiet sketches"
          checked={quiet}
          onChange={(event) => setQuiet(event.target.checked)}
        />
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setReplay((value) => value + 1)}
          disabled={quiet}
          icon={<Icon name="replay" size={15} />}
        >
          Draw again
        </Button>
        <span className="sketchbook-control-note">
          Click or tap a drawing to replay. Enter and Space work too.
        </span>
      </div>

      <section aria-labelledby="original-sketches-heading">
        <div className="section-heading sketchbook-section-heading">
          <div>
            <span className="sketchbook-kicker">01 / FROM OUR NOTEBOOK</span>
            <h2 id="original-sketches-heading">A few familiar things</h2>
          </div>
          <a
            className="sketchbook-component-link"
            href="#component/notebook-sketch"
          >
            Component & props <SketchArrow direction="up-right" />
          </a>
        </div>
        <div className="sketchbook-grid sketchbook-originals">
          {originals.map((drawing, index) => (
            <figure className="sketchbook-card" key={drawing.variant}>
              <div className="sketchbook-card-top">
                <span>FIG. {String(index + 1).padStart(2, "0")}</span>
                <span>ORIGINAL INK</span>
              </div>
              <div className="sketchbook-stage">
                <NotebookSketch
                  variant={drawing.variant}
                  label={drawing.label}
                  quiet={quiet}
                  replayKey={replay}
                  replayOnClick
                />
              </div>
              <figcaption>
                <h3>{drawing.title}</h3>
                <span className="sketchbook-hand">{drawing.caption}</span>
                <a
                  className="sketchbook-download"
                  href={`${import.meta.env.BASE_URL}sketches/${drawing.variant}-${theme}.svg`}
                  download
                >
                  Keep this SVG <Icon name="arrow" size={12} />
                </a>
              </figcaption>
            </figure>
          ))}
        </div>
        <p className="sketchbook-section-note">
          Original drawings for this system: slightly uneven curves, a few pen
          hatches, and just enough color. Click one to draw it again; the ink
          finishes and rests each time.
        </p>
      </section>

      <section
        className="sketchbook-journal"
        aria-labelledby="journal-art-heading"
      >
        <div className="section-heading sketchbook-section-heading">
          <div>
            <span className="sketchbook-kicker">02 / FOLDED INTO THE PAGE</span>
            <h2 id="journal-art-heading">Paper folds & little markers</h2>
          </div>
          <a
            className="sketchbook-component-link"
            href="#component/triple-banner"
          >
            The triple banner <SketchArrow direction="up-right" />
          </a>
        </div>
        <div className="sketchbook-grid sketchbook-journal-grid">
          <figure className="sketchbook-card">
            <div className="sketchbook-card-top">
              <span>THREE GOOD THINGS</span>
              <span>ORIGINAL INK</span>
            </div>
            <div className="sketchbook-stage sketchbook-journal-stage">
              <TripleBanner
                lines={[
                  "Paper & patience",
                  "A little curiosity",
                  "Room to grow",
                ]}
                animate
                quiet={quiet}
                replayKey={replay}
                replayOnClick
              />
            </div>
            <figcaption>
              <h3>A little ribbon ceremony</h3>
              <span className="sketchbook-hand">
                three thoughts, one winding ribbon
              </span>
            </figcaption>
          </figure>
          {(["notched", "pointed"] as const).map((variant) => (
            <figure className="sketchbook-card" key={variant}>
              <div className="sketchbook-card-top">
                <span>
                  {variant === "notched" ? "A LITTLE V-CUT" : "ONE FINE POINT"}
                </span>
                <span>ORIGINAL INK</span>
              </div>
              <div className="sketchbook-stage sketchbook-journal-stage">
                <BookmarkDrawing
                  variant={variant}
                  label={
                    variant === "notched"
                      ? "A V-cut bookmark"
                      : "A pointed bookmark"
                  }
                  quiet={quiet}
                  replayKey={replay}
                  replayOnClick
                />
              </div>
              <figcaption>
                <h3>
                  {variant === "notched"
                    ? "Keep your place"
                    : "A thought to return to"}
                </h3>
                <span className="sketchbook-hand">
                  a fine line, a little teal
                </span>
                <a
                  className="sketchbook-download"
                  href="#component/bookmark-drawing"
                >
                  Component & props <Icon name="arrow" size={12} />
                </a>
              </figcaption>
            </figure>
          ))}
        </div>
        <p className="sketchbook-section-note">
          Original journal-inspired line work: pale ribbon faces, colored
          reverse folds, and bookmarks drawn with a light hand. Each face grows
          with its words. Tap a drawing to watch the ink find its way again.
        </p>
      </section>

      <aside className="sketchbook-margin" aria-label="Drawing style notes">
        <span className="sketchbook-hand">the little rules</span>
        <div>
          <span className="sketchbook-line-sample" aria-hidden="true" /> Fine,
          rounded strokes
        </div>
        <div>
          <span className="sketchbook-color-sample" aria-hidden="true" /> One
          small accent
        </div>
        <div>
          <span className="sketchbook-hatch-sample" aria-hidden="true">
            ///
          </span>{" "}
          A human hand, a quiet page
        </div>
      </aside>

      <section aria-labelledby="hairline-sketches-heading">
        <div className="section-heading sketchbook-section-heading">
          <div>
            <span className="sketchbook-kicker">03 / ANOTHER KIND OF LINE</span>
            <h2 id="hairline-sketches-heading">Hairline, on paper</h2>
          </div>
          <a
            className="sketchbook-component-link"
            href="#component/hairline-sketch"
          >
            Component & props <SketchArrow direction="up-right" />
          </a>
        </div>
        <div className="sketchbook-hairline-tools">
          <p>
            Precise little objects, softened by our palette and handwritten
            notes.
          </p>
          <Switch
            label="Let Hairline wander"
            checked={play}
            disabled={quiet}
            onChange={(event) => setPlay(event.target.checked)}
          />
        </div>
        <div className="sketchbook-grid sketchbook-hairline">
          {hairline.map((drawing, index) => (
            <figure className="sketchbook-card" key={drawing.variant}>
              <div className="sketchbook-card-top">
                <span>
                  FIG. {String(index + originals.length + 1).padStart(2, "0")}
                </span>
                <span>HAIRLINE STUDY</span>
              </div>
              <div className="sketchbook-stage">
                <HairlineSketch
                  variant={drawing.variant}
                  label={drawing.description}
                  quiet={quiet}
                  play={play}
                  replayKey={replay}
                  replayOnClick
                />
              </div>
              <figcaption>
                <h3>{drawing.title}</h3>
                <span className="sketchbook-hand">{drawing.caption}</span>
              </figcaption>
            </figure>
          ))}
        </div>
        <p className="sketchbook-section-note">
          Figures by{" "}
          <a href="https://github.com/lucasmarkes/hairline">
            Hairline · Lucas Marques
          </a>
          , used under the{" "}
          <a href={`${import.meta.env.BASE_URL}licenses/hairline-MIT.txt`}>
            MIT license
          </a>
          . These keep their geometric character; the notebook drawings above
          are original artwork. Quiet mode stops both drawing and pointer
          motion.
        </p>
      </section>

      <section
        className="sketchbook-guidance"
        aria-labelledby="sketch-guidance-heading"
      >
        <div>
          <span className="sketchbook-kicker">A NOTE IN THE MARGIN</span>
          <h2 id="sketch-guidance-heading">Give the lines room to breathe</h2>
          <p>
            Use one drawing beside an empty state, a project introduction, or a
            garden note. Keep the useful words outside the artwork. Handwriting
            adds a short aside; body copy stays clear and readable.
          </p>
          <p>
            Hybrid keeps teal as the accent. Light uses the same paper and ink;
            dark turns the drawing into pale ink with a sage accent. Every
            drawing stays complete when motion is reduced.
          </p>
        </div>
        <div className="sketchbook-style-swatch">
          <span className="sketchbook-hand">a small mark is enough</span>
          <SketchArrow direction="down-right" />
          <div className="sketchbook-style-rule" />
          <span>INK · PAPER · A LITTLE TEAL</span>
        </div>
      </section>
      <CodeBlock code={exampleCode} copy={copy} />
    </div>
  );
}
