rm 'dist/package.json'
mv -f dist/* .
f="$(cat 'NOTICE.txt')"

cat '-' > 'NOTICE.txt' <<EOF
This software depends on, and bundles, the following npm packages:

$f
EOF

rm -d dist
node scripts/fix-sourcemap-sources.js

# Fix mixed line-endings. Commented-out because it ruins pre-existing
# sourcemaps and I don't think prettier emits its own sourcemaps.
# prettier -w index.js
