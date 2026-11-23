#!/bin/bash
set -u

cd -- "$(dirname -- "$0")" || exit 1
export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"
if ! command -v node >/dev/null || ! node -e 'process.exit(Number(process.versions.node.split(".")[0]) >= 22 ? 0 : 1)'; then
  printf '%s\n' '联网查词需要 Node.js 22 或更新版本。安装后请重新打开。' '下载：https://nodejs.org/zh-cn/download'
  read -r -p '按回车关闭窗口。'
  exit 1
fi

port="${PORT:-4173}"
url="http://127.0.0.1:$port"
ready() { [ "$(curl -fsS --max-time 1 "$url/wordloom-ready" 2>/dev/null)" = wordloom ]; }
if ready; then
  open "$url"
  exit $?
fi

node server.mjs &
server_pid=$!
trap 'kill "$server_pid" 2>/dev/null || true' EXIT
trap 'exit 130' INT
trap 'exit 143' TERM
for attempt in {1..50}; do
  if ready; then
    open "$url"
    wait "$server_pid"
    exit $?
  fi
  kill -0 "$server_pid" 2>/dev/null || break
  sleep 0.15
done
printf '%s\n' '无法启动 Wordloom。请查看上方提示，确认 4173 端口没有被其他程序占用。'
read -r -p '按回车关闭窗口。'
exit 1

