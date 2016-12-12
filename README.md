Umbra
======
Umbra HTML5 UI


Windows usage:
In C:\ root, `git clone git@github.com:shadowproject/Shadow-UI.git shadow`

Linux / Mac usage:
in /opt, `git clone git@github.com:shadowproject/Shadow-UI.git shadow`


## New linux way
In the home directory do,
`git clone git@github.com:shadowproject/Shadow-UI.git`

`cd Shadow-UI`

Then get the current path, keep note of this:
`pwd`

Now move to the directory where your shadow fork is stored or clone the repo if you don't have it yet
`cd ..`

`git clone git@github.com:shadowproject/shadow.git`

Move into the directory
`cd shadow`

Then symlink /opt/shadow
`ln -s that_pwd_path /opt/shadow`

RUn ./umbra and the GUI should be loaded from Shadow-UI



Feel free to customise it :)

To compile into executable, run `fixAssets.sh`, copy `build/*` into appropriate directories.

Depends:
https://www.npmjs.com/package/minify
