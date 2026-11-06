import { useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { Button, Dialog, Input } from "../../src/lib/components";

function GuardedDialog() {
  const [open, setOpen] = useState(false);
  const [requests, setRequests] = useState(0);
  const opener = useRef<HTMLButtonElement>(null);
  return <>
    <Button ref={opener} onClick={() => setOpen(true)}>Open guarded dialog</Button>
    <output aria-label="Close requests">{requests}</output>
    <Dialog open={open} returnFocusRef={opener} title="Unsaved draft"
      onClose={() => {
        setRequests(value => value + 1);
        if (!window.confirm("Close this unsaved draft?")) return false;
        setOpen(false);
      }}>
      <Input label="Draft text" defaultValue="Keep my unfinished writing" />
    </Dialog>
  </>;
}

export function mount() {
  const notebook = document.getElementById("root");
  if (notebook) notebook.style.display = "none";
  const host = document.createElement("div");
  host.style.padding = "32px";
  document.body.append(host);
  createRoot(host).render(<GuardedDialog />);
}
