#!/usr/bin/env bash
# Fixes year typos in Launch_Date by cross-checking against Launch_Tag.
# Usage: bash scripts/sanitize-data.sh src/data/launchlog.tsv

set -euo pipefail

file="${1:?Usage: sanitize-data.sh <tsv-file>}"

awk -F'\t' 'BEGIN { OFS="\t" }
/^#/ || /^$/ { print; next }
{
  tag_year = substr($1, 1, 4)
  date_year = substr($2, 1, 4)
  if (tag_year ~ /^[0-9]{4}$/ && date_year ~ /^[0-9]{4}$/ && tag_year != date_year) {
    $2 = tag_year substr($2, 5)
  }
  print
}' "$file" > "$file.tmp" && mv "$file.tmp" "$file"
