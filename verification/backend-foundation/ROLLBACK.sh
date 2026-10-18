#!/usr/bin/env sh
set -eu
target=${1:?target copy required}
dir=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
pristine="$dir/BASELINE_FILE"
if [ ! -f "$pristine" ]; then
  echo "missing baseline artifact" >&2
  exit 1
fi
cp "$pristine" "$target"
cmp -s "$pristine" "$target"
