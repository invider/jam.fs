let Tiles = function(dat) {
    this.x = 0
    this.y = 0
    this.tilew = 32
    this.viewport = false
    sys.augment(this, dat)

    if (!this.map) throw 'no map defined for tiles'
    if (!this.set) throw 'tileset is not mapped'

    if (this.map instanceof Image) {
        this.mapImg(this.map, this.set)
    } else if (sys.isString(this.map)) {
        this.mapTxt(this.map, this.set)
    } else if (sys.isArray(this.map)) {
        this.mapArray(this.map, this.set)
    }
}

Tiles.prototype.mapZero = function(w, h) {
    this.tw = w
    this.th = h
    this.w = w * this.tilew
    this.h = h * this.tilew

    // init with 0 values
    this.front = new Array(this.tw)
    for (let x = 0; x < this.tw; x++) {
        this.front[x] = new Array(this.th).fill(0)
    }
}

Tiles.prototype.mapImg = function(img, set) {
    this.mapZero(img.width, img.height)

    let data = lib.img.imgData(img).data

    for (let x = 0; x < this.tw; x++) {
        for (let y = 0; y < this.th; y++) {
            let p = (y * this.tw + x) * 4
            let v = (data[p++] << 16) | (data[p++] << 8) | data[p];
            let t = set[v]

            if (t) {
                this.front[x][y] = t
            } else {
                this.front[x][y] = 0
                if (v && v !== 0xffffff) {
                    // something is not properly mapped
                    log.warn('no tile mapped for #' + v.toString(16))
                }
            }
        }
    }
}

Tiles.prototype.mapTxt = function(txt, set) {
    let lines = txt.src.match(/[^\r\n]+/g);
    this.mapZero(lines[0].length, lines.length)

    for (let y = 0; 0 < lines.length; y++) {
        Array.from(lines[y]).forEach(c, x => {
            let t = set[c]
            if (t) {
                this.front[x][y] = t
            } else {
                this.front[x][y] = 0
                if (c !== ' ') {
                    log.warn('no tile mapped for [' + c + ']')
                }
            }
        })
    }
}

Tiles.prototype.mapArray = function(map, set) {
    this.tw = map.length
    this.th = map[0].length
    this.front = map
    // TODO remap array with set?
}

Tiles.prototype.draw = function() {
    let sx = this.x - this.w/2
    let sy = this.y - this.h/2
    let vp = false
    if (this.viewport) vp = this.viewport()

    let stx = 0
    let sty = 0
    let etx = this.tw
    let ety = this.th

    if (vp) {
        stx = Math.floor((vp[0] - sx)/this.tilew)
        if (stx < 0) stx = 0
        else if (stx > this.tw) return // out of viewport

        sty = Math.floor((vp[1] - sy)/this.tilew)
        if (sty < 0) sty = 0
        else if (sty > this.th) return // out of viewport

        etx = Math.ceil((vp[2] - sx)/this.tilew)
        if (etx > this.tw) etx = this.tw
        else if (etx < 0) return // out of viewport

        ety = Math.ceil((vp[3] - sy)/this.tilew)
        if (ety > this.th) ety = this.th
        else if (ety < 0) return // out of viewport
    }

    for (let y = sty; y < ety; y++) {
        for (let x = stx; x < etx; x++) {
            let t = this.front[x][y]
            if (t) {
                res.tileset.draw(t,
                    sx + x*this.tilew,
                    sy + y*this.tilew,
                    this.tilew, this.tilew)
            }
        }
    }
}

module.exports = Tiles
