set -v -e -o pipefail
rm 'dist/package.json'
mv -f dist/* .
f="$(cat 'NOTICE.txt')"

cat '-' > 'NOTICE.txt' <<EOF
This software depends on, and bundles, the following npm packages:

$f
EOF

rm -d dist
node scripts/fix-sourcemap-sources.js

# Fix mixed line-endings in bundled/compiled output while emitting new
# sourcemap to match
terser index.js --timings -o index.js --config-file terser.json

rm index.js.map
