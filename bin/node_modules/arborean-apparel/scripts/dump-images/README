Run `get-icons.sh` (requires `sh`, of course) and then `prune-icons.js`.

To run `get-icons.sh` you will need:
- [`umodel`](http://www.gildor.org/en/projects/umodel)
- [`gm`](http://www.graphicsmagick.org/)
- [`pngcrush`](https://pmt.sourceforge.io/pngcrush/)

You can change the paths to these by changing the aliases in `get-icons.sh`.
(Technically you don't need `pngcrush` but I wanted to minimize asset size for
downloads.)

`get-icons.sh` will dump all equipment icons and convert them to PNG. You can
run this anytime and it'll only run PNG conversion if a converted version does
not already exist.

`prune-icons.js` will move them into `used` and `unused` directories based on
`items.json`, correcting filename case to match the dumped item data. You can
pretty much ignore the `unused` directory and just convert the `used` directory
into `www/img/Icon_Equipments`.

You will have to edit some stuff for `Icon_Items` and slots and some emotes,
although emote support is currently broken and should probably be removed.
