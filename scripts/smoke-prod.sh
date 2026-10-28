#!/usr/bin/env bash
# Post-deploy smoke test against a live site. No login needed.
# Usage: scripts/smoke-prod.sh [site-url] [sse-url]
set -u

SITE="${1:-https://www.next-holiday.com}"
SSE="${2:-https://api.sse-notifs.com}"
NIL_ID="00000000-0000-0000-0000-000000000000"
fail=0
total=0
failures=()

check() { # description expected actual
  total=$((total + 1))
  if [ "$2" = "$3" ]; then return; fi
  fail=$((fail + 1))
  failures+=("$1 (expected $2, got $3)")
}

status() { curl -s -o /dev/null -m 20 -w "%{http_code}" "$@"; }

echo "Pages on $SITE"
pages=$(find src/app -name page.tsx -not -path "src/app/api/*" | sed -E 's|src/app||; s|/page\.tsx||; s|^$|/|' | sort)
for p in $pages; do
  check "page $p" 200 "$(status "$SITE$p")"
done
echo "  $(echo "$pages" | wc -l | tr -d ' ') pages checked"

echo "Removed pages stay removed"
check "page /test-api" 404 "$(status "$SITE/test-api")"

echo "API routes refuse anonymous requests"
count=0
while IFS= read -r file; do
  route="/api/$(echo "$file" | sed -E 's|src/app/api/||; s|/route\.ts||; s|\[[^]]+\]|'"$NIL_ID"'|g')"
  for method in $(grep -oE 'export async function (GET|POST|PUT|PATCH|DELETE)' "$file" | awk '{print $4}'); do
    count=$((count + 1))
    if [ "$route" = "/api/performance" ]; then
      actual=$(status -X "$method" "$SITE$route")
      [ "$actual" = "401" ] && { fail=$((fail + 1)); failures+=("$method $route should be public, got 401"); }
      total=$((total + 1))
    else
      case "$method" in
        POST | PUT | PATCH) body=(-H 'Content-Type: application/json' -d '{}') ;;
        *) body=() ;;
      esac
      check "$method $route" 401 "$(status -X "$method" ${body[@]+"${body[@]}"} "$SITE$route")"
    fi
  done
done < <(find src/app/api -name route.ts | sort)
echo "  $count handlers checked"

echo "A forged identity header is ignored"
check "x-test-user on /api/home" 401 "$(status -H 'x-test-user: {"sub":"auth0|someone"}' "$SITE/api/home")"
check "x-test-user on /api/gifts" 401 "$(status -H 'x-test-user: {"sub":"auth0|someone"}' "$SITE/api/gifts")"

echo "Link preview"
check "og:image reachable" 200 "$(status "$SITE/nextHolidayHero.png")"
if curl -s -m 20 "$SITE/" | grep -q 'property="og:image"'; then :; else fail=$((fail + 1)); failures+=("home page has no og:image tag"); fi
total=$((total + 1))

echo "SSE service on $SSE"
check "health" 200 "$(status "$SSE/health")"
check "stream with only a user id" 401 "$(status "$SSE/stream?auth0Sub=auth0%7Csomeone")"
check "stream with no credential" 401 "$(status "$SSE/stream")"
check "stream with a bogus ticket" 401 "$(status "$SSE/stream?ticket=not-a-ticket")"

echo
if [ "$fail" -eq 0 ]; then
  echo "PASS: $total checks"
else
  echo "FAIL: $fail of $total checks"
  printf '  - %s\n' "${failures[@]}"
  exit 1
fi
