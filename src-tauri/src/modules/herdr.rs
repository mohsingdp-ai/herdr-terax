use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize)]
pub struct HerdrPane {
    pane_id: String,
    terminal_id: String,
    workspace_id: String,
    label: Option<String>,
    agent: Option<String>,
    agent_status: Option<String>,
    cwd: Option<String>,
}

#[derive(Deserialize)]
struct PaneListResponse {
    result: PaneListResult,
}

#[derive(Deserialize)]
struct PaneListResult {
    panes: Vec<HerdrPane>,
}

// GUI launches often miss ~/.local/bin on PATH, where the herdr installer puts it.
fn herdr_bin() -> std::path::PathBuf {
    which::which("herdr").unwrap_or_else(|_| {
        dirs::home_dir()
            .unwrap_or_default()
            .join(".local/bin/herdr")
    })
}

#[tauri::command]
pub async fn herdr_pane_list() -> Result<Vec<HerdrPane>, String> {
    let output = tauri::async_runtime::spawn_blocking(|| {
        std::process::Command::new(herdr_bin())
            .args(["pane", "list"])
            .output()
    })
    .await
    .map_err(|e| e.to_string())?
    .map_err(|e| format!("herdr not found: {e}"))?;
    if !output.status.success() {
        return Err(String::from_utf8_lossy(&output.stderr).trim().to_string());
    }
    let parsed: PaneListResponse =
        serde_json::from_slice(&output.stdout).map_err(|e| e.to_string())?;
    Ok(parsed.result.panes)
}

#[tauri::command]
pub fn herdr_bin_path() -> String {
    herdr_bin().to_string_lossy().into_owned()
}
