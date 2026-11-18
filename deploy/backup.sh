#!/bin/bash
# Nightly consistent SQLite copy to S3 (uses node:sqlite's backup, no sqlite3 binary needed).
set -e
BUCKET="${1:?usage: backup.sh <bucket>}"
OUT=/tmp/littlebites-$(date +%Y%m%d).sqlite
rm -f "$OUT"
/opt/node22/bin/node -e "
const {DatabaseSync}=require('node:sqlite');
const db=new DatabaseSync('/var/lib/littlebites/littlebites.sqlite');
db.exec(\"VACUUM INTO '$OUT'\"); db.close();" 2>/dev/null
aws s3 cp "$OUT" "s3://$BUCKET/db/$(basename $OUT)" --only-show-errors
rm -f "$OUT"
