let Container = function(dat) {
    sys.Frame.call(this, dat)
    this.clip = true
}
Container.prototype = Object.create(sys.Frame.prototype)

Container.prototype.onAttached = function(node) {
    // normalize and augment the node
    if (!isFun(node.draw)) node.draw = false
    if (!isFun(node.evo)) node.evo = false

    // insert in the proper Z-order
    if (isNumber(node.Z)) {
        // sort by Z
        node.__._ls.sort((a, b) => {
            if (!isNumber(a.Z) && !isNumber(b.Z)) return 0;
            if (!isNumber(a.Z) && isNumber(b.Z)) return 1;
            if (isNumber(a.Z) && !isNumber(b.Z)) return -1;
            if (a.Z > b.Z) return 1;
            if (a.Z < b.Z) return -1;
            return 0;
        })
    }
}

Container.prototype.onClick = function(x, y) {
    if (x < 0 || y < 0 || x > this.w || y > this.h) return
    log.debug('click container ' + this.name + ' @' + x + 'x' + y)
    this._ls.forEach(f => {
        if (sys.isFun(f.onClick)) {
            let lx = x - f.x
            let ly = y - f.y
            if (lx >= 0 && lx <= f.w && ly >= 0 && ly <= f.h) {
                f.onClick(lx, ly)
            }
        }
    })
}

Container.prototype.evo = function(dt) {
}

Container.prototype.drawBackground = function() {
    ctx.fillStyle = '#40404060'
    ctx.fillRect(0, 0, this.w, this.h+200)
}

Container.prototype.draw = function() {
    if (this.hidden) return
    ctx.save()
    ctx.translate(this.x, this.y)
    if (this.clip) {
        ctx.beginPath()
        ctx.rect(0,0,this.w,this.h)
        ctx.clip()
    }

    this.drawBackground()
    for (let i = 0; i < this._ls.length; i++) {
        let e = this._ls[i]
        if (e.draw && !e.hidden) {
            e.draw()
        }
    }

    ctx.restore()
}

module.exports = Container
