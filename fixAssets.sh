#!/bin/bash
shopt -s extglob
rm -rf build
mkdir -p build
cp -rp !(build) build/
sed -i 's^"assets^"qrc:///assets^g' build/index.html
#mv build/index.html.min build/index.html
assets=`find assets/ -type f`
> build/shadow.qrc
IFS=$'\n'
IGNORE="
assets//plugins/framework/framework.js
assets//plugins/boostrapv3/css/bootstrap.css
assets//css/font-awesome-buttons.css
assets//css/framework-icons.css
assets//css/framework.css
assets//css/shadow.css
assets//js/navigation.js
assets//js/pages/send.js
assets//js/qrcode.js
assets//js/tooltip.js
assets//js/shadow.js
assets/js/shadow.js
"
while read line
do
    echo "$line" >> build/shadow.qrc
    if [ "$line" == '    <qresource prefix="/">' ]
    then
        for asset in $assets
        do
            [[ $IGNORE =~ $asset ]] && continue
            echo '        <file alias="'$asset'">../Shadow-UI/build/'$asset'</file>' >> build/shadow.qrc
        done
    fi
done < shadow.qrc

ALIASES=()
FILES=()
unset IFS
while read line
do
    [ "$line" == '<qresource prefix="/">' ] && RES=true
    [ "$line" == '</qresource>' ] && break
    if [ "$RES" = true ]
    then
        line=`echo $line | sed 's^<file alias="\(.*\)">\(.*\)</file>^\1,\2^'`
        ALIASES+=(${line%,*})
        FILES+=(${line#*,})
    fi
done < build/shadow.qrc

for index in ${!FILES[*]}
do
    file=${FILES[$index]}
    alias=${ALIASES[$index]}
    if [[ $file == *".css" ]] && [ $(fgrep "url(" $file -l) ]
    then
        DIR=`dirname $alias`
        PREVDIR=`dirname $DIR`
        REPLACE=$(fgrep "url(" $file | grep -o 'url(['\''"]\?\([^'\''")]\+\)["'\'']\?)' | sed 's/url(\|["'\'']\|)//g'|sed 's/&/\\&/g')
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

    if [[ $file == *".js" ]] && [ $(fgrep "assets" $file -l) ]
    then
        sed -i 's^\(assets/\(js\|icons\|images\|plugins\)\)^qrc:///\1^g' $file
        sed -i 's^\./qrc:///^qrc:///^g' $file

        echo $file
    fi
done
