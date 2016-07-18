#!/bin/bash

shopt -s extglob
rm -rf build
mkdir -p build
cp -rp !(build) build/
sed -i 's^assets^qrc:///assets^g' build/index.html # fix index.html

ALIASES=()
FILES=()

while read line
do
    [ "$line" == '<qresource prefix="/">' ] && RES=true
    [ "$line" == '</qresource>' ] && echo done && break
    if [ "$RES" = true ]
    then
        line=`echo $line | sed 's^<file alias="\(.*\)">\(.*\)</file>^\1,\2^'`
        ALIASES+=(${line%,*})
        FILES+=(${line#*,})
    fi
done < shadow.qrc

for index in ${!FILES[*]}
do
    file=${FILES[$index]}
    alias=${ALIASES[$index]}
    if [[ $file == *".css" ]] && [ $(fgrep "url(" $file -l) ]
    then
        DIR=`dirname $alias`
        PREVDIR=`dirname $DIR`
        REPLACE=$(fgrep "url(" $file | grep -o 'url(['\''"]\?\([^'\''")]\+\)["'\'']\?)' | sed 's/url(\|["'\'']\|)//g')
        for filename in $REPLACE
        do
            [[ $filename == "qrc:"* ]] && continue

            if [[ $filename == "../"* ]]
            then
              replacement=`echo $filename|sed 's!^..!qrc:///'$PREVDIR'!'`
              sed -i 's^url(['\''"]\?'$filename'['\''"]\?)^url('$replacement')^g' $file
            else
              replacement="qrc:///$DIR/$filename"
              sed -i 's^url(['\''"]\?'$filename'['\''"]\?)^url('$replacement')^g' $file
              #sed -i '
            fi
        done
        echo $file
    fi
done
