import {
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";
import { ComputerTerminal02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { invoke } from "@tauri-apps/api/core";
import { useState } from "react";

export type HerdrPane = {
  pane_id: string;
  terminal_id: string;
  workspace_id: string;
  label: string | null;
  agent: string | null;
  agent_status: string | null;
  cwd: string | null;
};

// herdr pads sidebar labels with braille blanks (U+2800).
export const paneName = (pane: HerdrPane) =>
  pane.label?.replace(/[\u2800\s]+/g, " ").trim() || pane.agent || pane.pane_id;

type State =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; panes: HerdrPane[] };

export function HerdrPaneSubmenu({
  onOpen,
}: {
  onOpen: (pane: HerdrPane) => void;
}) {
  const [state, setState] = useState<State>({ status: "loading" });

  const load = (open: boolean) => {
    if (!open) return;
    setState({ status: "loading" });
    invoke<HerdrPane[]>("herdr_pane_list")
      .then((panes) => setState({ status: "ready", panes }))
      .catch((e) => setState({ status: "error", message: String(e) }));
  };

  return (
    <DropdownMenuSub onOpenChange={load}>
      <DropdownMenuSubTrigger>
        <HugeiconsIcon
          icon={ComputerTerminal02Icon}
          size={14}
          strokeWidth={1.75}
        />
        <span className="flex-1">Herdr pane</span>
      </DropdownMenuSubTrigger>
      <DropdownMenuSubContent className="max-h-80 min-w-56 overflow-y-auto">
        {state.status === "loading" && (
          <DropdownMenuItem disabled>Loading…</DropdownMenuItem>
        )}
        {state.status === "error" && (
          <DropdownMenuItem disabled>{state.message}</DropdownMenuItem>
        )}
        {state.status === "ready" && state.panes.length === 0 && (
          <DropdownMenuItem disabled>No herdr panes</DropdownMenuItem>
        )}
        {state.status === "ready" &&
          state.panes.map((pane) => (
            <DropdownMenuItem
              key={pane.terminal_id}
              onSelect={() => onOpen(pane)}
            >
              <span className="flex-1 truncate">{paneName(pane)}</span>
              <span className="text-xs text-muted-foreground">
                {pane.agent_status ?? pane.pane_id}
              </span>
            </DropdownMenuItem>
          ))}
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  );
}
