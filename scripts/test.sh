if [ -z "${CI+x}" ]; then
  NODE_OPTIONS='--enable-source-maps' c8 ava
else
  NODE_OPTIONS='--enable-source-maps' c8 ava --color
fi
