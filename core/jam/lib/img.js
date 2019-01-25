'use strict'

var TileSet = function(img, sx, sy, tw, th) {
    this.img = img
    this.sx = sx
    this.sy = sy
    this.tw = tw
    this.th = th
    this.smooth = false
}

TileSet.prototype.init = function() {
    this.ctx = this._.ctx
}

TileSet.prototype.draw = function(tilex, x, y, w, h) {
    if (!w) w = this.tw
    if (!h) h = this.th

    let ix = this.sx + tilex*this.tw
    let iy = this.sy + this.th * Math.floor(ix / this.img.width)
    ix = ix % this.img.width

    this.ctx.imageSmoothingEnabled = this.smooth

    this.ctx.drawImage(this.img, ix, iy, this.tw, this.th, x, y, w, h)
}

module.exports = {
    TileSet: TileSet,

    screenshot: function(filename) {
        if (!filename) filename = 'jam-screenshot'
        // open in a new tab
        // window.open(ctx.canvas.toDataURL('image/png'));
        let gh = ctx.canvas.toDataURL('png');

        let a  = document.createElement('a');
        a.href = gh;
        a.download = filename + '.png';
        a.click()
    },

    imgData: function(img) {
      let canvas = document.createElement('canvas')
      let context = canvas.getContext('2d')
      context.drawImage(img, 0, 0)
      return context.getImageData(0, 0, img.width, img.height)
    },
}
