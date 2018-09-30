#!/bin/sh

alias umodel="umodel"
alias gm="gm"
alias pngcrush="pngcrush"

TERA="/c/Program Files (x86)/TERA"
TEX="UmodelExport/Icon_Equipments/Texture2D"

umodel -export -path="$TERA" -notgacomp -nooverwrite Icon_Equipments
mkdir -p icons/equipment
for f in $TEX/*; do
  FN=`basename "$f" .tga`
  IMG="icons/equipment/${FN}.png"
  if [ ! -f "$IMG" ]; then
    gm convert "${TEX}/${FN}.tga" -background black -flatten "$IMG"
    pngcrush -ow -q "$IMG"
    echo converted ${FN}
  else
    echo skipping ${FN}
  fi
done
