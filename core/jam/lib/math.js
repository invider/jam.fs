'use strict'
module.exports = (function() { 

const PI = Math.PI
const PI2 = PI*2

// LCG random generator implementation
var _rnd_m = 0xFFFFFFFF, _rnd_a = 1664525, _rnd_c = 1013904223;
var _seed = 1

function rndv() {
	_seed = (_rnd_a * _seed + _rnd_c) % _rnd_m
	return _seed
}

return {
    name: 'math',
    _info: 'library of math functions',

    PI: PI,
    PI2: PI2,

    length: function(x, y) {
        return Math.sqrt(x*x + y*y)
    },

    // get normalized vector as array
    normalize: function(x, y) {
        var len = this.length(x, y)
        if (len === 0) return [0, 0];
        return [x/len, y/len]
    },
    /**
     * returns distance between 2 dots
     * @param x1
     * @param y1
     * @param x2
     * @param y2
     * @returns {number}
     */
    distance: function(x1, y1, x2, y2) {
        var dx = x2 - x1;
        var dy = y2 - y1;
        return Math.sqrt(dx*dx + dy*dy)
    },
    /**
     * returns square of distance between 2 dots
     * @param x1
     * @param y1
     * @param x2
     * @param y2
     * @returns {number}
     */
    distanceSq: function(x1, y1, x2, y2) {
        var dx = x2 - x1;
        var dy = y2 - y1;
        return dx*dx + dy*dy
    },
    /**
     *
     * @param px
     * @param py
     * @param x1
     * @param y1
     * @param x2
     * @param y2
     * @returns {*|number}
     */
    distanceToSegmentSq: function(px, py, x1, y1, x2, y2) {
        let segLen2 = this.distanceSq(x1, y1, x2, y2);
        if (segLen2 === 0) return this.distanceSq(px, py, x1, y1);
        var t = ((px - x1)*(x2 - x1) + (py - y1)*(y2 - y1)) / segLen2;
        if (t < 0) return this.distanceSq(px, py, x1, y1);
        if (t > 1) return this.distanceSq(px, py, x2, y2);
        return this.distanceSq(px, py, x1 + t*(x2 - x1), y1 + t*(y2 - y1));
    },

    distanceToSegment: function(px, py, x1, y1, x2, y2) {
        return Math.sqrt(this.distanceToSegmentSq(px, py, x1, y1, x2, y2))
    },

    // angle from source to target vectors
    targetAngle: function(sx, sy, tx, ty) {
        return Math.atan2(tx - sx, ty - sy)
    },

    normalizeAngle: function(a) {
        a = a % (2*Math.PI)
        return a < 0? a + 2*Math.PI : a
    },

    reverseAngle: function(a) {
        a = (a + Math.PI) % (2*Math.PI)
        return a < 0? a + 2*Math.PI : a
    },

    limitedAdd: function(val, q, max) {
        return Math.min(val+q, max)
    },

    limitedSub: function(val, q, min) {
        return Math.max(val-q, min)
    },

    limitValue: function(val, min, max) {
        return val < min? min : val > max? max : val
    },

    limitMin: function(val, min) {
        return val < min? min : val
    },

    limitMax: function(val, max) {
        return val > max? max : val
    },

    wrap: function(val, min, max) {
        var range = max - min
        if (range <= 0) return 0;
        var res = (val - min) % range
        if (res < 0) res += range;
        return res + min
    },

    // linear interpolation value for v1 and v2 and t[0..1]
    linear: function(v1, v2, t) {
        return (v2 - v1) * t + v1
    },

    // useful for interception of moving objects
    dotProduct: function(x1, y1, x2, y2) {
        return x1*x2 + y1*y2
    },

    // get vector's angle in rad
    vecAngle: function(x, y) {
        return Math.atan2(y, x)
    },

    // get unit vector x from angle
    vecX: function(a) {
        return Math.cos(a)
    },

    // get unit vector y from angle
    vecY: function(a) {
        return Math.sin(a)
    },

    degToRad: function(d) {
        return d * (Math.PI / 180)
    },

    radToDeg: function(r) {
        return r * (180 / Math.PI)
    },

	// randomness
	rndf: function rndf() {
		return rndv()/_rnd_m
	},

	rndfi: function rndfi() {
		return this.rndf()*PI2 - PI
	},

	rnd: function rnd(maxValue){
		return rndv()/_rnd_m * maxValue
	},

	rndi: function rndi(maxValue){
		return ~~this.rnd(maxValue)
	},

	rnds: function rnds() {
		return this.rndf() < .5? -1 : 1
	},
}

})()
