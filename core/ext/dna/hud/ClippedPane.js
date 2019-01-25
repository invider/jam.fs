let ClippedPane = function(st) {
    this.x = 0
    this.y = 0
    this.w = 0
    this.h = 0
    sys.augment(this, st)
}

ClippedPane.prototype.drawContent = function() {
}

ClippedPane.prototype.draw = function() {
    if (this.hidden) return
    ctx.save()
    ctx.translate(this.x, this.y)
    // clip
    ctx.beginPath()
    ctx.rect(0,0,this.w,this.h)
    ctx.clip()

    this.drawBackground()
    for (let i = 0; i < this._ls.length; i++) {
        let e = this._ls[i]
        if (e.draw && !e.hidden) {
            e.draw()
        }
    }

    ctx.restore()
}

module.exports = ClippedPane
