import { useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Button, Dialog, Input } from "./components";
import "./story-tools.css";

export interface ActionMenuItem { id: string; label: string; icon?: ReactNode; onSelect: () => void; disabled?: boolean; danger?: boolean; separatorBefore?: boolean; checked?: boolean; shortcut?: string }
export interface ActionMenuProps { label: string; items: ActionMenuItem[]; align?: "start" | "end"; compact?: boolean; disabled?: boolean; className?: string }
const reduced = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const MoreMark = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" aria-hidden="true"><path d="M5 11.8h.1M12 12h.1M19 11.8h.1"/><circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/></svg>;
const CheckMark = () => <svg width="17" height="17" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m4 10 3.8 4L16 5"/></svg>;

/** Selection waits until the viewport-fitting paper layer has closed. */
export function ActionMenu({ label, items, align = "end", compact = true, disabled = false, className = "" }: ActionMenuProps) {
  const id = useId(), trigger = useRef<HTMLButtonElement>(null), panel = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false), [present, setPresent] = useState(false), [entered, setEntered] = useState(false);
  const [target, setTarget] = useState<HTMLElement | null>(null), [native, setNative] = useState(false);
  const openRef = useRef(false), timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined), frame = useRef(0), alive = useRef(true), last = useRef(false);
  const pending = useRef<(() => void) | undefined>(undefined), restore = useRef(false), search = useRef({ value: "", at: 0 });
  function enabled() { return Array.from(panel.current?.querySelectorAll<HTMLButtonElement>('[role^="menuitem"]:not(:disabled)') || []); }
  function change(next: boolean, returnFocus = false, action?: () => void) {
    if (disabled && next) return;
    pending.current = action; restore.current = returnFocus; openRef.current = next;
    if (next) { setTarget(trigger.current?.closest<HTMLElement>("dialog[open]") || document.body); setPresent(true); }
    setOpen(next);
  }
  function position() {
    const anchor = trigger.current, sheet = panel.current; if (!anchor || !sheet) return;
    const viewport = window.visualViewport, x = viewport?.offsetLeft || 0, y = viewport?.offsetTop || 0;
    const width = viewport?.width || innerWidth, height = viewport?.height || innerHeight, edge = 12;
    sheet.style.maxWidth = `${Math.max(0, width - edge * 2)}px`; sheet.style.maxHeight = `${Math.max(44, height - edge * 2)}px`;
    const a = anchor.getBoundingClientRect(), bounds = sheet.getBoundingClientRect();
    const left = align === "end" ? a.right - bounds.width : a.left, below = a.bottom + 7, above = a.top - bounds.height - 7;
    const top = below + bounds.height <= y + height - edge || above < y + edge ? below : above;
    sheet.style.left = `${Math.max(x + edge, Math.min(left, x + width - edge - bounds.width))}px`;
    sheet.style.top = `${Math.max(y + edge, Math.min(top, y + height - edge - bounds.height))}px`;
  }
  useLayoutEffect(() => { setTarget(trigger.current?.closest<HTMLElement>("dialog[open]") || document.body); setNative(typeof HTMLElement.prototype.showPopover === "function"); }, []);
  useLayoutEffect(() => {
    const sheet = panel.current; if (!sheet || !target) return;
    clearTimeout(timer.current); cancelAnimationFrame(frame.current); sheet.inert = !open;
    if (open) {
      if (native && !sheet.matches(":popover-open")) sheet.showPopover();
      position(); frame.current = requestAnimationFrame(() => { if (!openRef.current) return; position(); setEntered(true); (last.current ? enabled().at(-1) : enabled()[0])?.focus({ preventScroll: true }); });
    } else if (present) {
      setEntered(false); if (restore.current) trigger.current?.focus({ preventScroll: true });
      const finish = () => {
        if (!alive.current || openRef.current) return;
        if (native && sheet.matches(":popover-open")) sheet.hidePopover();
        setPresent(false); const action = pending.current; pending.current = undefined;
        if (action) requestAnimationFrame(() => { if (alive.current && !openRef.current) action(); });
      };
      if (reduced()) finish(); else timer.current = setTimeout(finish, (parseFloat(getComputedStyle(sheet).getPropertyValue("--dm-layer-exit-duration")) || 160) + 40);
    }
    return () => { clearTimeout(timer.current); cancelAnimationFrame(frame.current); };
  }, [open, present, native, target, align]);
  useEffect(() => { alive.current = true; return () => { alive.current = false; pending.current = undefined; clearTimeout(timer.current); cancelAnimationFrame(frame.current); }; }, []);
  useEffect(() => {
    if (!open) return;
    const outside = (event: PointerEvent) => { const node = event.target as Node; if (!panel.current?.contains(node) && !trigger.current?.contains(node)) change(false); };
    const escape = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || event.defaultPrevented) return;
      const activeDialog = document.activeElement?.closest("dialog[open]"); if (activeDialog && activeDialog !== trigger.current?.closest("dialog[open]")) return;
      event.preventDefault(); event.stopPropagation(); change(false, true);
    };
    const move = () => { cancelAnimationFrame(frame.current); frame.current = requestAnimationFrame(position); };
    document.addEventListener("pointerdown", outside); window.addEventListener("keydown", escape, true); window.addEventListener("resize", move); window.addEventListener("scroll", move, true);
    window.visualViewport?.addEventListener("resize", move); window.visualViewport?.addEventListener("scroll", move);
    return () => { document.removeEventListener("pointerdown", outside); window.removeEventListener("keydown", escape, true); window.removeEventListener("resize", move); window.removeEventListener("scroll", move, true); window.visualViewport?.removeEventListener("resize", move); window.visualViewport?.removeEventListener("scroll", move); };
  }, [open, align]);
  const content = <div ref={panel} id={id} role="menu" aria-label={label} tabIndex={-1} popover={native ? "manual" : undefined} hidden={!present} aria-hidden={!open || undefined} className={`dm-action-menu__panel ${className}`.trim()} data-state={open ? entered ? "open" : "opening" : present ? "closing" : "closed"}
    onKeyDown={event => {
      const buttons = enabled(), current = buttons.indexOf(document.activeElement as HTMLButtonElement); let next = -1;
      if (event.key === "ArrowDown") next = (current + 1) % buttons.length;
      if (event.key === "ArrowUp") next = (current - 1 + buttons.length) % buttons.length;
      if (event.key === "Home") next = 0; if (event.key === "End") next = buttons.length - 1;
      if (next >= 0) { event.preventDefault(); event.stopPropagation(); buttons[next]?.focus(); }
      else if (event.key === "Tab") {
        event.preventDefault(); event.stopPropagation();
        const host = trigger.current?.closest("dialog[open]") || document;
        const outside = Array.from(host.querySelectorAll<HTMLElement>('a[href],button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea:not(:disabled),[tabindex="0"]')).filter(node => node.getClientRects().length && !node.closest("[inert],[hidden]") && !panel.current?.contains(node));
        const index = trigger.current ? outside.indexOf(trigger.current) : -1; change(false);
        (event.shiftKey ? trigger.current : outside[index + 1] || outside[0] || trigger.current)?.focus({ preventScroll: true });
      } else if (event.key.length === 1 && !event.metaKey && !event.ctrlKey && /\S/.test(event.key)) {
        const now = performance.now(); search.current = { value: now - search.current.at > 600 ? event.key : search.current.value + event.key, at: now };
        const match = buttons.find(button => button.textContent?.trim().toLocaleLowerCase().startsWith(search.current.value.toLocaleLowerCase())); if (match) { event.preventDefault(); match.focus(); }
      }
    }}>
    {items.map(item => <div key={item.id} role="none">{item.separatorBefore && <div role="separator" className="dm-action-menu__separator"/>}<button type="button" role={item.checked === undefined ? "menuitem" : "menuitemcheckbox"} aria-checked={item.checked} disabled={item.disabled} tabIndex={-1} className={item.danger ? "dm-action-menu__danger" : undefined} onClick={event => { event.stopPropagation(); change(false, true, item.onSelect); }}><span className="dm-action-menu__icon" aria-hidden="true">{item.checked ? <CheckMark/> : item.icon}</span><span className="dm-action-menu__label">{item.label}</span>{item.shortcut && <kbd>{item.shortcut}</kbd>}</button></div>)}
  </div>;
  return <><Button ref={trigger} type="button" variant="ghost" size="sm" disabled={disabled} aria-label={label} title={compact ? label : undefined} aria-haspopup="menu" aria-expanded={open} aria-controls={present ? id : undefined} className={`dm-action-menu__trigger${compact ? " is-compact" : ""}`} onClick={event => { event.stopPropagation(); last.current = false; change(!openRef.current, openRef.current); }} onKeyDown={event => { if (event.key === "ArrowDown" || event.key === "ArrowUp") { event.preventDefault(); event.stopPropagation(); last.current = event.key === "ArrowUp"; change(true); } }}><MoreMark/>{!compact && label}</Button>{target && createPortal(content, target)}</>;
}

export interface CommandPaletteItem { id: string; label: string; description?: string; group?: string; icon?: ReactNode; disabled?: boolean; meta?: ReactNode }
export interface CommandPaletteProps { open: boolean; onOpenChange: (open: boolean) => void; onAfterClose?: () => void; query: string; onQueryChange: (query: string) => void; items: CommandPaletteItem[]; onSelect: (id: string) => void; title?: string; placeholder?: string; loading?: boolean; status?: ReactNode; filters?: ReactNode; emptyState?: ReactNode; className?: string }
/** Controlled search: indexing and global shortcuts stay in the app. */
export function CommandPalette({ open, onOpenChange, onAfterClose, query, onQueryChange, items, onSelect, title = "Search", placeholder = "Search…", loading = false, status, filters, emptyState = "No results.", className = "" }: CommandPaletteProps) {
  const id = useId(), input = useRef<HTMLInputElement>(null), host = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0), lastOpen = useRef(false), afterClose = useRef(onAfterClose); afterClose.current = onAfterClose;
  const selectable = items.filter(item => !item.disabled), signature = selectable.map(item => item.id).join("\n");
  useEffect(() => { setActive(0); }, [query, signature]);
  const current = selectable[Math.min(active, Math.max(0, selectable.length - 1))], optionId = (item: CommandPaletteItem) => `${id}-option-${items.indexOf(item)}`;
  useLayoutEffect(() => {
    const dialog = host.current?.querySelector("dialog"); if (!dialog) return;
    const check = () => { if (dialog.open) lastOpen.current = true; else if (lastOpen.current) { lastOpen.current = false; afterClose.current?.(); } };
    const observer = new MutationObserver(check); observer.observe(dialog, { attributes: true, attributeFilter: ["open", "data-state"] }); check();
    const focus = open ? requestAnimationFrame(() => input.current?.focus({ preventScroll: true })) : 0;
    return () => { observer.disconnect(); cancelAnimationFrame(focus); };
  }, [open]);
  useEffect(() => { if (open && current) document.getElementById(optionId(current))?.scrollIntoView({ block: "nearest" }); }, [current?.id, open]);
  return <div ref={host} className="dm-command-palette-host"><Dialog open={open} onClose={() => onOpenChange(false)} title={title} motion="settle" className={`dm-command-palette ${className}`.trim()}>
    <Input ref={input} aria-label="Search" value={query} placeholder={placeholder} autoComplete="off" autoCapitalize="none" spellCheck={false} role="combobox" aria-autocomplete="list" aria-expanded={open} aria-controls={`${id}-results`} aria-activedescendant={current ? optionId(current) : undefined} onChange={event => onQueryChange(event.target.value)} onKeyDown={event => {
      if (event.nativeEvent.isComposing) return;
      if (["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key) && selectable.length) { event.preventDefault(); setActive(index => event.key === "Home" ? 0 : event.key === "End" ? selectable.length - 1 : (index + (event.key === "ArrowDown" ? 1 : -1) + selectable.length) % selectable.length); }
      else if (event.key === "Enter" && current) { event.preventDefault(); onSelect(current.id); }
    }}/>
    {filters && <div className="dm-command-palette__filters">{filters}</div>}
    {(status || loading) && <div className="dm-command-palette__status" role="status">{status || "Searching…"}</div>}
    <div id={`${id}-results`} className="dm-command-palette__results" role="listbox" aria-label="Search results" aria-busy={loading}>
      {!items.length && !loading && <div className="dm-command-palette__empty">{emptyState}</div>}
      {items.map((item, index) => <div key={item.id} role="none">{item.group && (index === 0 || items[index - 1].group !== item.group) && <div className="dm-command-palette__group" aria-hidden="true">{item.group}</div>}<button type="button" id={optionId(item)} role="option" aria-selected={item.id === current?.id} disabled={item.disabled} tabIndex={-1} onPointerMove={() => { const next = selectable.findIndex(value => value.id === item.id); if (next >= 0) setActive(next); }} onClick={() => onSelect(item.id)}>{item.icon && <span className="dm-command-palette__icon" aria-hidden="true">{item.icon}</span>}<span className="dm-command-palette__copy"><strong>{item.label}</strong>{item.description && <span>{item.description}</span>}</span>{item.meta && <span className="dm-command-palette__meta">{item.meta}</span>}</button></div>)}
    </div><div className="dm-command-palette__hint" aria-hidden="true"><span>↑ ↓ to browse</span><span>Enter to open</span><span>Esc to close</span></div>
  </Dialog></div>;
}

export interface ReadingControlsProps { value: number; onValueChange: (value: number) => void; min?: number; max?: number; step?: number; quiet: boolean; onQuietChange: (quiet: boolean) => void; label?: string; className?: string }
/** Preference-free controls; the app owns persistence and article styling. */
export function ReadingControls({ value, onValueChange, min = 90, max = 150, step = 10, quiet, onQuietChange, label = "Reading controls", className = "" }: ReadingControlsProps) {
  const lower = Number.isFinite(min) ? min : 90, upper = Number.isFinite(max) ? Math.max(lower, max) : Math.max(lower, 150), clamp = (next: number) => Math.max(lower, Math.min(upper, next));
  const current = Number.isFinite(value) ? clamp(value) : clamp(100), increment = Number.isFinite(step) && step > 0 ? step : 10, reset = clamp(100);
  return <div role="group" aria-label={label} className={`dm-reading-controls ${className}`.trim()}><div className="dm-reading-controls__size"><Button type="button" variant="ghost" size="sm" aria-label="Decrease text size" disabled={current <= lower} onClick={() => onValueChange(clamp(current - increment))}><span aria-hidden="true">A−</span></Button><output aria-live="polite" aria-label="Text size">{current}%</output><Button type="button" variant="ghost" size="sm" aria-label="Increase text size" disabled={current >= upper} onClick={() => onValueChange(clamp(current + increment))}><span aria-hidden="true">A+</span></Button><Button type="button" variant="ghost" size="sm" disabled={current === reset} onClick={() => onValueChange(reset)} aria-label="Reset text size">Reset</Button></div><Button type="button" variant={quiet ? "secondary" : "ghost"} size="sm" aria-label="Quiet reading view" aria-pressed={quiet} onClick={() => onQuietChange(!quiet)}><svg width="17" height="17" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true"><path d="M3 3.7c3-1 5.2-.3 7 1.2 1.8-1.5 4-2.2 7-1.2V16c-3-1-5.2-.2-7 1.2C8.2 15.8 6 15 3 16V3.7ZM10 5v12"/></svg>Quiet view</Button></div>;
}
