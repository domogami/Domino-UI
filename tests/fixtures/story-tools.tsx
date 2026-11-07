import { useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { Button, Dialog, Input } from "../../src/lib/components";
import { ActionMenu, CommandPalette, ReadingControls } from "../../src/lib/story-tools";
import "../../src/styles/tokens.css";
import "../../src/styles/fonts.css";
import "../../src/lib/components.css";

function Fixture() {
  const [edit, setEdit] = useState(false), [following, setFollowing] = useState(false), [search, setSearch] = useState(false), [query, setQuery] = useState("");
  const [draft, setDraft] = useState("Unpublished field notes."), [notice, setNotice] = useState("No selection."), [highlight, setHighlight] = useState(false);
  const [size, setSize] = useState(100), [quiet, setQuiet] = useState(false), pending = useRef<string | null>(null);
  const results = [{ id: "field", label: "Field notes", group: "Writing", description: "Notes beside the river." }, { id: "blocked", label: "Unavailable notes", disabled: true }, { id: "garden", label: "Garden observations", group: "Writing", description: "A sketch of the garden." }].filter(item => (item.label + " " + item.description).toLowerCase().includes(query.toLowerCase()));
  const menu = <ActionMenu label="Actions for Field notes" items={[
    { id: "edit", label: "Edit", onSelect: () => { setNotice("Menu released before edit."); setFollowing(true); } },
    { id: "highlight", label: "Highlight", checked: highlight, onSelect: () => setHighlight(value => !value) },
    { id: "blocked", label: "Unavailable action", disabled: true, onSelect: () => setNotice("ERROR disabled action") },
    { id: "history", label: "Version history", separatorBefore: true, onSelect: () => setNotice("Version history selected.") },
    { id: "archive", label: "Archive", danger: true, separatorBefore: true, onSelect: () => setNotice("Archive selected.") },
  ]}/>;
  return <main style={{ maxWidth: 720, margin: "0 auto", padding: 16, fontFamily: "var(--dm-font-body)", color: "var(--dm-ink)" }}>
    <h1>Story tools fixture</h1><Button onClick={() => setEdit(true)}>Edit field notes</Button><Button onClick={() => setSearch(true)}>Search entries</Button><div style={{ display: "flex", justifyContent: "flex-end", height: 180, alignItems: "end", overflow: "hidden", marginBlock: 20 }} data-testid="clipping-host">{menu}</div>
    <ReadingControls value={size} onValueChange={setSize} quiet={quiet} onQuietChange={setQuiet}/><p data-testid="sample-prose" style={{ fontSize: `${size}%`, lineHeight: 1.85 }}>A readable paragraph about a path through the trees.</p><p role="status">{notice}</p>
    <Dialog open={edit} onClose={() => setEdit(false)} title="Field notes editor"><Input label="Unpublished writing" value={draft} onChange={event => setDraft(event.target.value)}/><div style={{ display: "flex", justifyContent: "flex-end", overflow: "hidden", maxHeight: 70 }} data-testid="modal-clipping-host">{menu}</div><Button onClick={() => setSearch(true)}>Search from editor</Button></Dialog>
    <Dialog open={following} onClose={() => setFollowing(false)} title="Following action"><p>The action menu released its layer first.</p></Dialog>
    <CommandPalette open={search} onOpenChange={value => { pending.current = null; setSearch(value); }} query={query} onQueryChange={setQuery} items={results} onSelect={id => { pending.current = id; setSearch(false); }} onAfterClose={() => { if (pending.current) { setNotice(`Opened ${pending.current} after native close.`); pending.current = null; } }}/>
  </main>;
}
document.body.style.background = "var(--dm-surface)";
createRoot(document.getElementById("root")!).render(<Fixture/>);
