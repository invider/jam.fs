/** @alias lab.scroll */
module.exports = function(init) {
    let res = {
        timer: 0,
        dtimer: 1,
        line: 0,
        align: 'center',

        init: function() {
            if (!this.txt) this.txt = 'text is missing'
            this.txt = this.txt.split(/\r?\n/)
        },

        spawnLine: function(msg) {
            sys.spawn('text/fadeText', {
                rx: this.rx,
                ry: this.ry,
                text: msg,
                font: this.font,
                fillStyle: this.color,
                align: this.align,
                ttl: this.time,
                tti: this.fadein,
                ttf: this.fadeout,
                dy: this.speed,
            })
            this.dtimer = this.time
        },

        evo: function(dt) {
            if (!this.alive) return

            this.timer -= dt
            this.dtimer -= dt

            if (this.timer < 0 && this.line < this.txt.length) {
                this.timer = this.period
                this.spawnLine(this.txt[this.line++])
            }

            if (this.line >= this.txt.length && this.dtimer < 0) {
                this.alive = false
                this.__.detach(this)
            }
        },
    }

    sys.augment(res, init)
    return res
};
