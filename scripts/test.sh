c8='./node_modules/.bin/c8'
ava='./node_modules/.bin/ava'

if ! [ -z "${CI+x}" ]; then
  set '--' '--color' "$@"
fi

rm -rf coverage
export NODE_OPTIONS='--enable-source-maps'
"$c8" -r none --clean=false "$ava" "$@"
"$c8" report
