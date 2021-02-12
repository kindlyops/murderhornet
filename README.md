# murder hornet

## TODO

## installing dependencies

* `brew cask install xquartz`
* `brew cask install wine-stable`
* `brew install fakeroot`
* `brew install dpkg`
* `brew install rpm`
* `brew install mono`

## work around Squirrel.Windows error on MacOS catalina

Alias wine (32-bit) to wine64

    unlink /usr/local/bin/wine
    ln -s '/Applications/Wine Stable.app/Contents/Resources/wine/bin/wine64' /usr/local/bin/wine

Replace xcedit.exe with 64 bit version

https://github.com/electron/node-rcedit/issues/51#issuecomment-557784268

Remove quarantine attribute

    xattr -d com.apple.quarantine node_modules/electron-winstaller/vendor/rcedit.exe 

## publishing a release

1. increment version in package.json, commit
1. tag your commit, ie: `git tag v1.2.3`
1. push changes and tags to github (`git push && git push --tags`)
1. after builds finish, edit github draft release and change to published

## Credits

* Murder Hornet Icon based on 'Asian giant Hornet' photograph
  By Yasunori Koide - Own work, CC BY-SA 4.0, https://commons.wikimedia.org/w/index.php?curid=63832922
 * DMG background image Photo by Ezra Jeffrey-Comeau on Unsplash