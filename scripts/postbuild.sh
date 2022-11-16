rm 'dist/package.json'
mv -f dist/* .
f="$(cat 'NOTICE.txt')"
cat '-' > 'NOTICE.txt' <<EOF
This software depends on, and bundles, the following npm packages:

$f
EOF
rm -d dist
