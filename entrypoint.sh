#!/bin/sh

rm -rf ./public/game
mv /root/game ./public/
exec bun run dev -- --host 0.0.0.0
