#!/bin/bash

PROD="https://usajobs.usajobs.workers.dev"

echo "=========================================="
echo "PRODUCTION VERIFICATION"
echo "=========================================="
echo ""

# Get a valid production job
echo "[A] VALID APPLY URL"
JOBS=$(curl -s "$PROD/offers?limit=1")
JOB_ID=$(echo "$JOBS" | python -c "import json, sys; print(json.load(sys.stdin)['offers'][0]['id'])")
APPLY_URL=$(echo "$JOBS" | python -c "import json, sys; print(json.load(sys.stdin)['offers'][0]['apply_url'])")
JOB_TITLE=$(echo "$JOBS" | python -c "import json, sys; print(json.load(sys.stdin)['offers'][0]['title'])")

echo "Job: $JOB_TITLE"
echo "ID: $JOB_ID"
echo "URL: $APPLY_URL"

RESULT=$(curl -s "$PROD/apply?id=$(python -c "import urllib.parse; print(urllib.parse.quote('$JOB_ID'))")&url=$(python -c "import urllib.parse; print(urllib.parse.quote('$APPLY_URL'))")")
echo "Response:"
echo "$RESULT" | python -c "
import json, sys
r = json.load(sys.stdin)
print(f'  available: {r.get(\"available\")}')
print(f'  expired: {r.get(\"expired\")}')
print(f'  statusCode: {r.get(\"statusCode\")}')
result = r.get('available') == True and r.get('expired') == False
print(f'  Status: {\"✅ PASS\" if result else \"❌ FAIL\"}')"
echo ""

# Test B: Server-side job not found
echo "[B] SERVER-SIDE JOB NOT FOUND"
RESULT=$(curl -s "$PROD/apply?id=FAKE-JOB-12345&url=https://example.com")
echo "Response:"
echo "$RESULT" | python -c "
import json, sys
r = json.load(sys.stdin)
print(f'  available: {r.get(\"available\")}')
print(f'  expired: {r.get(\"expired\")}')
print(f'  error: {r.get(\"error\")}')
result = r.get('expired') == False and r.get('available') == False and r.get('error') == 'Job not found'
print(f'  Status: {\"✅ PASS\" if result else \"❌ FAIL\"}')"
echo ""

# Test C: URL mismatch
echo "[C] URL MISMATCH / SECURITY FAILURE"
echo "Attempting: /apply?id=$JOB_ID&url=https://wrong-url.invalid"
RESULT=$(curl -s "$PROD/apply?id=$(python -c "import urllib.parse; print(urllib.parse.quote('$JOB_ID'))")&url=https://wrong-url.invalid")
echo "Response:"
echo "$RESULT" | python -c "
import json, sys
r = json.load(sys.stdin)
print(f'  available: {r.get(\"available\")}')
print(f'  expired: {r.get(\"expired\")}')
print(f'  error: {r.get(\"error\")}')
result = r.get('expired') == False and r.get('available') == False and r.get('error') == 'Apply URL mismatch'
print(f'  Status: {\"✅ PASS\" if result else \"❌ FAIL\"}')"
echo ""

# Test D: Job visibility
echo "[D] JOB VISIBILITY (no deletions should occur)"
echo "Checking if valid job still in /offers..."
JOBS_CHECK=$(curl -s "$PROD/offers?limit=100")
FOUND=$(echo "$JOBS_CHECK" | python -c "
import json, sys
jobs = json.load(sys.stdin)['offers']
found = any(j['id'] == '$JOB_ID' for j in jobs)
print('yes' if found else 'no')")

if [ "$FOUND" = "yes" ]; then
  echo "  ✅ PASS: Valid job still in database"
else
  echo "  ❌ FAIL: Valid job deleted (should not be)"
fi
echo ""

# Test E: Browse still works
echo "[E] BROWSE JOBS"
BROWSE=$(curl -s "$PROD/jobs/")
if echo "$BROWSE" | grep -q "Job Listings\|jobs\|GTM"; then
  echo "  ✅ PASS: Browse page loads"
else
  echo "  ⚠️  Check browse rendering"
fi
echo ""

echo "=========================================="
echo "VERIFICATION COMPLETE"
echo "=========================================="
