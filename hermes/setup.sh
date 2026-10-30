#!/usr/bin/env bash
# Installs Nuria's WhatsApp agent as the Hermes profile `nuria`: personality, data tools, and a tool list locked
# to those tools, because anyone can write to the number. Safe to run again after an edit.
set -euo pipefail
here="$(cd "$(dirname "$0")" && pwd)"
profile=nuria
home="$HOME/.hermes/profiles/$profile"

[ -d "$home" ] || hermes profile create "$profile" --no-alias --no-skills --description "Nuria: lluvias de Guayaquil por WhatsApp"
cp "$here/SOUL.md" "$home/SOUL.md"
rm -rf "$home/plugins/nuria-data"
mkdir -p "$home/plugins"
cp -r "$here/plugins/nuria-data" "$home/plugins/"

hp() { hermes -p "$profile" "$@" >/dev/null; }
hp config set model.provider anthropic
hp config set model.default claude-sonnet-5-5
hp config set platform_toolsets.whatsapp '[nuria]'
hp config set platform_toolsets.cli '[nuria]'
hp config set plugins.enabled '[nuria-data]'
# a friendly chat shows only the final answer: no tool breadcrumbs, reasoning or "working" notices
for key in tool_progress show_reasoning interim_assistant_messages long_running_notifications busy_ack_detail; do
  hp config set "display.platforms.whatsapp.$key" false
done

# direct chats only, open to anyone; WHATSAPP_ENABLED is written once the number is linked
env_file="$home/.env"
touch "$env_file"
set_env() { { grep -v "^$1=" "$env_file" || true; echo "$1=$2"; } > "$env_file.tmp" && mv "$env_file.tmp" "$env_file"; }
set_env WHATSAPP_MODE bot
set_env WHATSAPP_ALLOWED_USERS '*'
set_env WHATSAPP_ALLOW_ALL_USERS true
set_env WHATSAPP_DM_POLICY open
set_env WHATSAPP_GROUP_POLICY disabled
grep -q '^NURIA_SCENARIO=' "$env_file" || set_env NURIA_SCENARIO live
chmod 600 "$env_file"
echo "Perfil $profile listo en $home"
