#!/usr/bin/env sh
set -eu
target=${1:?target copy required}
dir=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
pristine="$dir/BASELINE_FILE"
cp "$pristine" "$target"
cmp -s "$pristine" "$target"
