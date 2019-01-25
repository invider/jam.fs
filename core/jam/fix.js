/*
 * Core of Collider.JAM
 */
$ = scene = (function(window) {

"use strict"
// ***********
// environment
let canvasName = 'canvas'

// *********
// utilities
let isObj = function(o) {
    return !!(o && typeof o === 'object')
}
let isFun = function(f) {
    return !!(f && f.constructor && f.call && f.apply);
}
let isString = function(s) {
    return toString.call(s) == "[object String]"
}
let isNumber = function(s) {
    return toString.call(s) == "[object Number]"
}
let isArray = function(a) {
    return Array.isArray(a)
}
let isMutable = function(obj) {
    return ((typeof obj === 'object')
                || (typeof obj === 'function'))
            && (!obj._locked);
}
let isFrame = function(f) {
    return !!(f && f._frame)
}

let mix = function() {
    var arg, prop, mixin = {};
    for (arg = 0; arg < arguments.length; arg++) {
        for (prop in arguments[arg]) {
            if (arguments[arg].hasOwnProperty(prop)) {
                mixin[prop] = arguments[arg][prop];
            }
        }
    }
    return mixin;
}
let augment = function() {
    var arg;
    var prop;
    var mixin = arguments[0];
    for (arg = 1; arg < arguments.length; arg++) {
        if (arguments[arg]) for (prop in arguments[arg]) {
            mixin[prop] = arguments[arg][prop];
        }
    }
    return mixin;
}
let extend = function() {
    var arg;
    var prop;
    var mixin = arguments[0];
    for (arg = 1; arg < arguments.length; arg++) {
        for (prop in arguments[arg]) {
            if (!mixin[prop]) {
                mixin[prop] = arguments[arg][prop];
            }
        }
    }
    return mixin;
}

let before = function(obj, fun, patch) {
    var orig = obj[fun]
    if (!orig) {
        obj[fun] = patch
    } else if (!isFun(orig)) {
        throw new Error("Can't chain before [" + fun + " which is " + (typeof orig))
    } else {
        obj[fun] = function() {
            patch.apply(this, arguments)
            orig.apply(this, arguments)
        }
        obj[fun].first = patch
        obj[fun].after = orig
    }
}

let after = function(obj, fun, patch) {
    var orig = obj[fun]
    if (!orig) {
        obj[fun] = patch
    } else if (!isFun(orig)) {
        throw new Error("Can't chain after [" + fun + " which is " + (typeof orig))
    } else {
        obj[fun] = function() {
            orig.apply(this, arguments)
            patch.apply(this, arguments)
        }
        obj[fun].first = orig 
        obj[fun].after = patch
    }
}

let matchType = function(v) {
    v = v.trim()
    if ((v.startsWith("'") && v.endsWith("'"))
            || (v.startsWith('"') && v.endsWith('"'))) {
        return v.substring(1, v.length - 1)
    } else if (v.startsWith('#')) {
        let n = parseInt(v.substring(1), 16)
        if (!isNaN(n)) return n
    } else if (v.startsWith('0x')) {
        let n = parseInt(v.substring(2), 16)
        if (!isNaN(n)) return n
    }
    let n = parseFloat(v)
    if (!isNaN(n)) return n
    return v
};


// ******************
// system definitions
// ******************

/**
 * @alias sys.Frame
 * @param initObj
 * @constructor
 */
let Frame = function(initObj) {
    this._ = this
    this._ls = []
    this._dir = {}
    if (isString(initObj)) {
        this.name = initObj
    } else if (isObj(initObj)) {
        augment(this, initObj)
    }
}
Frame.prototype._frame = true
Frame.prototype.type = "frame"
Frame.prototype.path = function() {
    if (this.__) return this.__.path() + '/' + this.name
    return '/' + this.name
}
Frame.prototype.touch = function(path) {
    if (path === undefined || path === '') return this
    if (this._locked) throw new Error("can't touch - node is locked")

    // normalize path
    if (path.startsWith('@')) path = path.substring(1)
    if (path.startsWith('/')) path = path.substring(1)

    let i = path.indexOf('/')
    if (i >= 0) {
        // switch to the next target
        let nextName = path.substring(0, i)
        let nextPath = path.substring(i + 1)
        let nextNode = this[nextName]
        if (!nextNode) {
            // provide a new one
            return this.attach(new Frame(nextName)).touch(nextPath)
        }
    } else {
        // we got the name
        return this.attach(new Frame(path))
    }
}
Frame.prototype.attach = function(node, name) {
    if (node === undefined) return
    if (this._locked) throw { src: this, msg: "can't attach - node is locked" }
    if (isObj(node) || isFun(node)) {
        // inject mod, parent and name
        node._ = this._
        node.__ = this
        if (name && isObj(node)) node.name = name
        if (!name && node.name) name = node.name
	}

    if (name) {
        this[name] = node
        this._dir[name] = node
    }
    this._ls.push(node)
    if (isFun(node.init)) node.init() // initialize node
    this.onAttached(node, name, this)
    return node
};
Frame.prototype.onAttached = function(node, name, parent) {
    this.__.onAttached(node, name, parent)
};

Frame.prototype.detach = function(node) {
    if (!node) {
        let i = this.__._ls.indexOf(this);
        if (i >= 0) {
            // find index on parent
            this.__._ls.splice(i, 1);
        }
        if (this.name && this.__._dir[this.name] === this) {
            this.__.detachByName(node.name);
        }
    } else {
        let i = this._ls.indexOf(node);
        if (i >= 0) {
            // find index on parent
            this._ls.splice(i, 1);
        }
        if (node.name && (this._dir[node.name]) === node) {
            this.detachByName(node.name);
        }
    }
};
Frame.prototype.detachAll = function() {
    while(this._ls.length){
        let node = this._ls[0];
        this.detach(node)
    }
};
Frame.prototype.detachByName = function(name) {
    var obj = this[name];
    if (obj === undefined){
        throw new Error("No node with name:" + name);
    }
    //
    //  FINISH called when element detached
    //
    if (this[name].finish) this[name].finish();
    if (obj.propagateDetach){
        if (obj.propagateDetach instanceof Array){
            obj.propagateDetach.forEach(o => o.__.detach(o));
        } else {
            obj.propagateDetach.__.detach(obj.propagateDetach);
        }
    }

    // detach named
    delete this[name];
    delete this._dir[name];
    // detach by index if exists
    let index = this._ls.indexOf(obj);
    if (index >= 0){
        this._ls.splice(index, 1);
    }
};

Frame.prototype.apply = function(fn, predicate) {
    let i = 0
    if (isFun(predicate)) {
		this._ls.forEach( function(e) {
			if (predicate(e)) {
                fn(e)
                i++
            }
		})
    } else if (isString(predicate)) {
        let ls = this.select(predicate)
        ls.forEach( function(e) {
            fn(e)
            i++
        })
    } else {
		this._ls.forEach( function(e) {
            fn(e)
            i++
        })
    }
    return i
}
Frame.prototype.collide = function(fn, predicate) {
    let i = 0
    if (isFun(predicate)) {
        let ls = this._ls
		ls.forEach( function(e) {
			if (predicate(e)) {
                ls.forEach( function(o) {
                    if (predicate(o)) {
                        if (e !== o) fn(e, o)
                    }
                })
            }
		})
    } else if (isString(predicate)) {
        let ls = this.select(predicate)
        ls.forEach( function(e) {
            ls.forEach( function(o) {
                if (e !== o) fn(e, o)
                i++
            })
        })
    } else {
        let ls = this._ls
		ls.forEach( function(e) {
            ls.forEach( function(o) {
                if (e !== o) fn(e, o)
                i++
            })
        })
    }
    return i
}
Frame.prototype.map = function(fn) {
}
Frame.prototype.flatMap = function(fn) {
}
Frame.prototype.reduce = function(fn) {
}
Frame.prototype.selectInstance = function(of) {
    return this.select(o => o instanceof of)
};
Frame.prototype.select = function(predicate) {
	if (isString(predicate)) {
		// select by path
		if (predicate === '') {
			// select the dir
			return this._ls.slice()
		}

		let i = predicate.indexOf('/')
		if (i > 0) {
			let nextName = predicate.substring(0, i)
			let nextPath = predicate.substring(i + 1)
			if (nextName == '..') {
				// move up
				if (!this.__) return []
				return this.__.select(nextPath)
			}

			let res = []
			for (let k in this) {
				let o = this[k]
				if (o && nextName === '*' || k.includes(nextName) || (o.tag && o.tag.includes(nextName))) {
					if (isFrame(o)) {
						res = res.concat(o.select(nextPath))
					} else if (isArray(o)) {
						if (nextPath === '' || nextPath === '*') res = res.concat(o)
						// TODO maybe handle index identifiers?
					} else if (isObj(o)) {
						for (let j in o) {
							if (nextPath === '*' || j.includes(nextPath)) {
								res.push(o[j])
							}
						}
					}
				}
				
			}
			return res

		} else if (i === 0) {
			return _scene.select(predicate.substring(1))
		} else {
			// found the point
			if (predicate === '..') {
				// move up
				if (!this.__) return []
				return this.__
			} else if (predicate === '*') return this._ls.slice()

			let res = []
			for (let k in this._dir) {
				let o = this._dir[k]
				if (k.includes(predicate) || (o.tag && o.tag.includes(predicate))) res.push(o)
			}
			return res
		}

		/*
        // switch to the next target
       return _scene.patch(nextNode, nextPath, node)
    // found the patch point - attach the node
    if (isFrame(target)) {
        if (path === '') {
            target.attach(node)
        } else {
            if (target[path]) {
                augment(target[path], node)
            } else {
                target.attach(node, path)
            }
        }
    } else if (isArray(target)) {
        target.push(node)
    } else if (isObj(target)) {
        if (path === '') throw { src: this, msg: "can't attach anonymous node to " + target }
        if (target[path]) {
            console.log('augmenting: ' + path)
            augment(target[path], node)
        } else {
            console.log('rewriting: ' + path)
            target[path] = node
        }
    }
		*/

	} else if (isFun(predicate)) {
        return this._ls.filter(predicate)
	} else return []
}
Frame.prototype.selectOne = function(predicate) {
	let list = this.select(predicate)
	if (list.length > 0) return list[0]
	return undefined
};

Frame.prototype.selectOneNumber = function(predicate) {
    let list = this.select(predicate)
    if (list.length > 0) {
        if (isNaN(list[0])){
            throw new Error("Error parsing number:" + list[0])
        }
        return parseFloat(list[0]);
    }
    return 0;
}

Frame.prototype.kill = function() {
    this._ls.forEach(node => {
        if (isFun(node.kill)) node.kill()
    })
}

let LabFrame = function(st) {
    Frame.call(this, st)
}
LabFrame.prototype = new Frame()

LabFrame.prototype.touch = function(path) {
    if (path === undefined || path === '') return this
    if (this._locked) throw new Error("can't touch - node is locked")

    // normalize path
    if (path.startsWith('@')) path = path.substring(1)
    if (path.startsWith('/')) path = path.substring(1)

    let i = path.indexOf('/')
    if (i >= 0) {
        // switch to the next target
        let nextName = path.substring(0, i)
        let nextPath = path.substring(i + 1)
        let nextNode = this[nextName]
        if (!nextNode) {
            // provide a new one
            return this.attach(new LabFrame(nextName)).touch(nextPath)
        }
    } else {
        // we got the name
        return this.attach(new LabFrame(path))
    }
}
LabFrame.prototype.onAttached = function(node) {
    //this._.log.sys('spawned ' + node.name)
    // normalize and augment the node
    node.alive = true
    if (!isFun(node.draw)) node.draw = false // ghost
    if (!isFun(node.evo)) node.evo = false   // prop
    if (isFun(node.spawn)) node.spawn() // spawn handler
    if (isNumber(node.x) && isNumber(node.y)) node._positional = true
    else node._positional = false
    if (node._positional
            && isNumber(node.w)
            && isNumber(node.h)) {
        node._sizable = true
    } else {
        node.sizable = false
    }

    // TODO make arbitrary augmentation and dependency injection possible
    //this._.aug._ls.forEach( function(aug) {
    //    aug(node)
    //})

    if (isNumber(node.Z)) {
        // sort by Z
        this._ls.sort((a, b) => {
            if (!isNumber(a.Z) && !isNumber(b.Z)) return 0;
            if (!isNumber(a.Z) && isNumber(b.Z)) return 1;
            if (isNumber(a.Z) && !isNumber(b.Z)) return -1;
            if (a.Z > b.Z) return 1;
            if (a.Z < b.Z) return -1;
            return 0;
        })
    }
},

LabFrame.prototype.draw = function() {
    for (let i = 0; i < this._ls.length; i++) {
        let e = this._ls[i]
        if (e.draw && !e.dead && !e.hidden) {
            e.draw()
        }
    }
}

let evalLoadedContent = function(script, _) {
    //try {
        if (script.ext === 'js') {
            let __ = script.context
            var scope = {}
            var module = {}

            // provide lexical scope for mod context and scope object for this. definitions
            let code = '(function ' + name + '(_, ctx, module, sys, lib, res, dna, env, lab, mod, log, trap) {'
                + "\n /* path: " + script.path + "*/\n"
                + script.src
            + '}).call(scope, __, __.ctx, module, __.sys, __.lib, __.res, __.dna, __.env, __.lab, __.mod, __.log, __.trap)'
            let val;
            try{
                val = eval(code)
            } catch (e) {
                console.error(`Error executing file: ${script.path}`)
                throw (e);
            }


            // apply definitions
            let declarationsFound = _.scan(scope)

            // fix the mode if there is a value
            if (val) {
                _.patch(script.base, script.path, val)
            } else if (module.exports) {
                // no value is reture - try to find a value
                _.patch(script.base, script.path, module.exports)
            } else if (declarationsFound === 0) {
                _scene.log.sys('no value, exports or declarations from ' + script.path)
            }
        } else if (script.ext === 'json') {
            let val = JSON.parse(script.src)
            if (val) _.patch(script.base, script.path, val)
        } else if (script.ext === 'txt') {
            _.patch(script.base, script.path, script.src)
        } else if (script.ext === 'lines') {
            let lines = script.src.match(/[^\r\n]+/g)
            lines = lines.map(l => {
                let ci = l.indexOf('--')
                if (ci >= 0) {
                    return l.substring(0, ci-1).trim()
                } else {
                    return l.trim()
                }
            })
            lines = lines.filter(l => l.length > 0)
            _.patch(script.base, script.path, lines)
        } else if (script.ext === 'csv') {
            let lines = script.src.match(/[^\r\n]+/g);
            // naming array
            let names = lines[0].split(',').map(e => e.trim())
            // parse objects
            let objects = []
            for (let i = 1; i < lines.length; i++) {
                let l = lines[i].trim()
                if (l.length > 0 && !l.startsWith('--')) {
                    // TODO more intellectual parsing, so escaped string can be included (e.g. 'one,two')
                    let ol = l.split(',').map(e => e.trim()).map(e => {
                        return matchType(e)
                    })
                    let obj = {}
                    ol.forEach((e, j) => {
                        if (j < names.length) {
                            obj[names[j]] = e
                        } else {
                            _.log.warn('eval-'+batch, '=> '
                                + script.path + '@' + (i+1)
                                + ': excesive value [' + e + ']')
                        }
                    })
                    objects.push(obj)
                }
            }
            _.patch(script.base, script.path, objects)
        } else if (script.ext === 'prop') {
            let lines = script.src.match(/[^\r\n]+/g);

            // parse definitions
            let prop = {}
            for (let i = 0; i < lines.length; i++) {
                let l = lines[i].trim()
                if (l.length > 0 && !l.startsWith('--')) {
                    let pair = l.split(':')
                    if (pair.length === 2) {
                        let key = matchType(pair[0])
                        let val = matchType(pair[1])
                        prop[key] = val
                    }
                }
            }
            _.patch(script.base, script.path, prop)
        } else if (script.ext === 'fun') {
            // custom function
            script.fun()
        }
    //} catch (e) {
    //    _scene.log.err('jam-loader', 'error in [' + script.path + ']' + e)
    //    throw e
    //}
}


let checkScriptDependencies = function(script, batch) {
    if (script.ext !== 'js') return []

    let res = []

    let extendRegExp = new RegExp('@depends\\((.*?)\\)', 'g')

    let match
    while(match = extendRegExp.exec(script.src)) {
        let key = match[1]
        let dependency
        batch.forEach(s => {
            if (s.path === key) dependency = s
        })
        if (dependency) res.push(dependency)
        else throw 'dependency ' + key + ' is not found'
    }
    return res
}

let sortLoadedBatch = function(batch) {
    //this._execList[batch].sort((a, b) => a.path.localeCompare(b.path))
    let res = []

    var workBatch = batch.slice();

    let check = function(script) {
        checkScriptDependencies(script, batch).forEach(e => check(e))
        let i = workBatch.indexOf(script)
        if (i >= 0) {
            workBatch.splice(i, 1)
            res.push(script)
        }
    }

    while(workBatch.length > 0) {
        check(workBatch[0])
    }

    return res
}

let evalLoadedBatch = function(ibatch, batch, _) {

    let sortedBatch = sortLoadedBatch(batch)

    sortedBatch.forEach( script => {
        _.log.sys('eval-'+ibatch, '=> ' + script.path)
        evalLoadedContent(script, _)
    })
}

// Mod context container
var Mod = function(initObj) {
    this._$ = _scene
    this.ctx = false
    this.focus = true
    this.paused = false
    this.hidden = false

    Frame.call(this, initObj)

    // resources container
    this.attach(new Frame({
        name: 'res',
        _included: 0,
        _loaded: 0,
        _execList: [],

        _exec: function() {

            for (let batch = 0; batch < this._execList.length; batch++) {
                if (!this._execList[batch]) continue
                this._.log.sys('eval-'+batch, '===== evaluating batch #'
                    + batch + ' for ' + this._.name + ' =====')

                // sort batch alphanumerically before the evaluation
                this._execList[batch].sort((a, b) => a.path.localeCompare(b.path))

                evalLoadedBatch(batch, this._execList[batch], this._)
                /*
                this._execList[batch].forEach( script => {
                    let _ = this._
                    _.log.sys('eval-'+batch, '=> ' + script.path)
                    evalLoadedContent(script, _)
                })
                */

                // clean up batch
                this._execList[batch] = []
            }
        },

        _startTrigger: function() {
            if (this._.env.started) return

            if (this._included <= this._loaded) {
                // OK - everything is loaded, call setup functions
                // TODO how to deal with mods with no res? how start would be triggered?
                this._.log.sys('loader', 'Total ' + this._loaded + ' resources are loaded in ' + this._.name)
                this._exec()

                this._.start()
            }
        },


        _onLoaded: function() {
            this._loaded ++
            this._startTrigger()
        },

        onAttached: function(node, name, parent) {
            // on attaching a resource
            // TODO move autoloading by name to another autoloading node
            //      definitelly don't need to autoload here in /res
            //      since this is already autoloaded
            //      avoid double autoloading
            /*
            if (isString(node)) {
                console.log('attaching -> ' + name)
                console.dir(node)
                if (name) {
                    // the name for the node is specified, so put under that one
                    let rs = this._.load(node)
                    parent.attach(rs, name)
                } else {
                    // no name for the node, load to filename
                    this._.load(node, parent)
                }
            
            } else if (isArray(node)) {
                // load resource group
                let _ = this._
                let rgroup = []
                // load
                node.forEach( function(e) {
                    rgroup.push(_.load(e))
                })
                // push
                node.splice(0)
                rgroup.forEach( function(e) {
                    node.push(e)
                })
            } else {
                // just ignore - that probably already loaded resource node
            }
            */
        }
    }))
    // library functions
    this.attach(new Frame("sys"))
    // library functions
    this.attach(new Frame("lib"))
    // log functions
    this.attach(new Frame("log"))


    // prototypes/constructors
    this.attach(new Frame(), 'dna')

    // augment functions
    // TODO remove in favor of .aug
    this.attach(new Frame(), 'aug')

    // static environment data entities
    this.attach(new Frame({
        name: "env",
        started: false,
    }))
    // container for acting entities - actors, ghosts, props
    this.attach(new LabFrame(), 'lab')

    // container for mods
    var mod = function mod(path, name) {
        if (!name) {
            let i = path.lastIndexOf('/')
            if (i >= 0) name = path.substring(i+1)
            else name = path
        }
        let nmod = this.mod.touch(name)
        nmod.fix(nmod, path, 'fix')
    }
    augment(mod, new Frame())

    mod.touch = function(path) {
        if (path === undefined) return
        if (this._locked) throw new Error("can't touch - node is locked")

        // normalize path
        if (path.startsWith('@')) path = path.substring(1)
        if (path.startsWith('/')) path = path.substring(1)

        let i = path.indexOf('/')
        if (i >= 0) {
            // switch to the next target
            let nextName = path.substring(0, i)
            let nextPath = path.substring(i + 1)
            let nextNode = this[nextName]
            if (!nextNode) {
                // provide a new one
                return this.attach(new Mod(nextName)).touch(nextPath)
            }
        } else {
            // we got the name
            return this.attach(new Mod(path))
        }
    }
    this.attach(mod)

    // container for traps
    var trap = function trap(key, data, chain) {
        return trap.echo(key, data, chain)
    }

    trap.echo = function(key, data, chain) {
        var fn = trap[key]
        if (isFun(fn)) {
            if (fn(data) === false) return false
        }

        if (chain) {
            // propagate event
            this._.mod._ls.forEach( m => {
                m.trap(key, data, chain)
            })
        }
        return true
    }

    augment(trap, new Frame())
    this.attach(trap)
}

Mod.prototype = new Frame()

Mod.prototype.init = function() {
    this.___ = this._ // save node context as parent mod
    this._ = this // must be in init, since it is assigned during the regular node.attach()
    if (!this.ctx) this.ctx = this.___.ctx // clone draw context from parent mod if not set explicitly
    this.inherit()
} 

Mod.prototype.start = function() {
    if (this.env.started) return
    this.inherit()

    if (isFun(this.setup)) {
        this.setup()
    } if (isFrame(this.setup)) {
        this.setup._ls.forEach( f => f() )
    }

    this.mod._ls.forEach( mod => mod.start() )

    _scene.log.sys('starting evolution...')
    this.env.started = true
}

Mod.prototype.inherit = function() {
    extend(this.sys, this.___.sys)
    extend(this.log, this.___.log)
}

Mod.prototype.touch = function(path) {
        if (path === undefined || path === '') return this
        if (this._locked) throw new Error("can't touch - node is locked")

        // normalize path
        if (path.startsWith('@')) path = path.substring(1)
        if (path.startsWith('/')) path = path.substring(1)

        if (path === 'boot' || path.startsWith('boot/')) {
            if (!isFrame(this.boot)) {
                this.attach(new Mod('boot'))
            }
            return Frame.prototype.touch.call(this.boot, path.substring(5))
        } else if (path.startsWith('mod')) {
            // TODO put /mod node construction here
        } else {
            return Frame.prototype.touch.call(this, path)
        }
}

Mod.prototype.onAttached = function(node, name, parent) {
    if (this.__) this.__.onAttached(node, name, parent)
}

Mod.prototype.evo = function(dt) {
    // boot logic
    if (!this.env.started) {
        // try to find and evolve boot node or mod
        if (this.boot && isFun(this.boot.evo)) {
            this.boot.evo()
        }
        return
    }
    if (this.paused) return

    // evolve all entities in the lab
    this.lab._ls.forEach( e => {
        if (e.evo && !e.dead && !e.paused) e.evo(dt)
    });

    // evolve all mods
    this.mod._ls.map( function(m) {
        if (m.evo && !m.paused) m.evo(dt)
    });
}

Mod.prototype.draw = function() {
    if (!this.ctx || this.hidden) return

    // boot logic
    if (!this.env.started) {
        // try to find and draw boot node or mod
        if (isFun(this.boot)) {
            this.boot()
        } else if (this.boot && isFun(this.boot.draw)) {
            this.boot.draw()
        }
        return
    }

    // draw entities in the lab
    // we might integrate this mod display as a link in the mod list
    this.lab.draw()

    // draw mods
    for (let i = 0; i < this.mod._ls.length; i++) {
        let m = this.mod._ls[i]
        if (m.draw && !m.hidden) {
            m.draw()
        }
    }
}
Mod.prototype.scan = function(target) {
    // normalize target
    if (!target) target = window

    let found = 0
    // search for declarations
    for (var key in target) {
        if (key.startsWith('_boot$')) {
            let node = target[key]
            if (isFun(node)) {
                found++
                _scene.log.sys('executing: ' + key)
                node(_scene)
                target[key] = false
            }

        } else if (key.startsWith('_patch$')) {
            let node = target[key]
            if (node) {
                found++
                let path = ''
                if (node._$patchAt) {
                    path = node._$patchAt
                    if (!path.endsWith('/')) path += '/'
                }
                for (var pkey in node) {
                    if (!pkey.startsWith('_')) {
                        let fullPath = path + pkey
                        let val = node[pkey]
                        if (val) {
                            _scene.log.sys('~~ ' + fullPath + ' << ' + (val._info? val._info : (val.name? val.name : '')))
                            _scene.patch(_scene, fullPath, val)
                        }
                    }
                }
                target[key] = false
            }
            
        } else if (key.indexOf('@') >= 0) {
            let node = target[key]
            if (node) {
                found++
                let path = key.substring(key.indexOf('@') + 1)
                _scene.log.sys('~~ ' + path + ' << ' + (node._info? node._info : (node.name? node.name : '')))
                _scene.patch(_scene, path, target[key])
                target[key] = false
            }
        } else if (key.startsWith('_$') && node && isString(node._$patchAt)) {
            found++
            let path = node._$patchAt
            _scene.log.sys('~~ ' + path + ' << ' + (val._info? val._info : (val.name? val.name : '')))
            _scene.patch(_scene, fullPath, val)
        }
        /*
        } else if (key.startsWith('_lib$')) {
            var node = target[key]
            var name = key.substring(4, key.length)
            if (node.name !== undefined) {
                name = node.name
            }
            _scene.patch('lib', name, node)
            target[key] = "loaded"

        } else if (key.startsWith('_env$')) {
            var node = target[key]
            var name = key.substring(4, key.length)
            if (node.name !== undefined) {
                name = node.name
            }
            _scene.patch('env', name, node)
            target[key] = "loaded"

        } else if (key.startsWith('_lab$')) {
            var node = target[key]
            var name = key.substring(4, key.length)
            if (node.name !== undefined) {
                name = node.name
            }
            _scene.patch('lab', name, node)
            target[key] = "loaded"
        }
        */
    }
    return found
}
Mod.prototype.patch = function(target, path, node) {
    if (!isMutable(target)) throw { src: this, msg: "can't attach to imutable node @" + path }

    if (path.startsWith('@')) path = path.substring(1)
    if (path.startsWith('/')) path = path.substring(1)

    if (path === '') {
        // patch point is a directory - find if node is named
        if (node && isString(node.name)) {
            path = node.name
        }
    }

    let i = path.indexOf('/')
    if (i >= 0) {
        // switch to the next target
        let nextName = path.substring(0, i)
        let nextPath = path.substring(i + 1)
        let nextNode = target[nextName]

        if (!nextNode) {
            // touch for a new node
            if (isFrame(target)) {
                nextNode = target.touch(nextName)
            } else if (isObj(target) || isFun(target)) {
                nextNode = {}
                target[nextName] = nextNode
            } else {
                this.log.sys('unable to patch @' + path + ' - unable to attach [' + nextName + '] to parent')
                return false
            }
            return this.patch(nextNode, nextPath, node)

        } else if (!isFrame(nextNode) && !isObj(nextNode)) {
            this.log.sys('unable to patch @' + path + ' - [' + nextName + '] is not valid for patching')
            return false
        } else {
            return this.patch(nextNode, nextPath, node)
        }
    }

    let index = -1
    let di = path.lastIndexOf('-')
    if (di > 0) {
        let strIndex = path.substring(di+1)
        index = parseInt(strIndex)
        if (isNaN(index)) {
            index = -1
        } else {
            path = path.substring(0, di)
        }
    }

    if (node !== undefined) {
        // found the patch point - attach the node
        if (isFrame(target)) {
            if (path === '') {
                target.attach(node)
            } else if (index >= 0) {
                if (!isArray(target[path])) {
                    target.attach([], path)
                }
                target[path][index] = node
            } else {
                if (isObj(target[path])) {
                    // TODO replace or augment? how to decide?
                    //      there might be different patch modes?
                    augment(target[path], node)
                    //target[path] = node
                } else if (target[path] !== undefined) {
                    // already defined - replace
                    // TODO doesn't work property for frames - _dir and _ls stays the same
                    //      maybe different patch modes?
                    target[path] = node
                    target._dir[path] = node
                } else {
                    target.attach(node, path)
                }
            }
        } else if (isArray(target)) {
            if (index >= 0) {
                target[index] = node
            } else {
                target.push(node)
            }
        } else if (isObj(target)) {
            if (path === '') throw { src: this, msg: "can't attach anonymous node to " + target }
            if (index >= 0) {
                if (!isArray(target[path])) {
                    target[path] = []
                }
                target[path][index] = node
            } else if (isObj(target[path])) {
                augment(target[path], node)
            } else if (target[path] !== undefined) {
                // TODO doesn't work property for frames - _dir and _ls stays the same
                target[path] = node
                target._dir[path] = node
            }
        }

        // load resources if applicable
        if (isFun(node.onLoad)) {
            node.onLoad(this)
            node.onLoad = true // replace function with true, so we'd not call it second time
        }
    }
}
Mod.prototype.batchLoad = function(batch, context, src, base, path, ext) {
    let _ = this
    //_.log.sys('loader-' + batch, src + ' ' + base.name + path)
    let target = src + ' -> ' + base.name + path

    if (!_.res._execList[batch]) {
        _.res._execList[batch] = []
    }

    function onLoad() {
        _.res._onLoaded()
        /*
        // enable slow network loading simulation
        let max_wait = 10
        let delay = Math.floor(Math.random() * max_wait) * 1000
        setTimeout(function() {
            _.res._onLoaded()
        }, delay)
        */
    }

    // normalize extention
    if (!ext) ext = src.slice((Math.max(0, src.lastIndexOf(".")) || Infinity) + 1).toLowerCase();

    let srcName = src.replace(/^.*[\\\/]/, '') // remove path
    srcName = srcName.replace(/\.[^/.]+$/, '') // remove extension
    let name = srcName
    let classifier = false

    let i = srcName.indexOf('.')
    if (i > 0) {
        name = srcName.substring(0, i)
        classifier = srcName.substring(i+1)
    }

    let pathName
    if (path) {
        pathName = path.replace(/^.*[\\\/]/, '') // remove path
        name = pathName
    }

    if (ext === 'png' || ext === 'jpeg' || ext === 'jpg') {
        _.log.sys('loader', 'image @' + target)
        _.res._included ++
        var img = new Image()
        img.src = src
        img.onload = onLoad

        if (classifier && classifier.startsWith('map')) {
            let mx = classifier.substring(3)
            let wh = mx.split('x', 2)
            if (wh.length === 2) {
                let w = parseInt(wh[0])
                let h = parseInt(wh[1])
                _.res._execList[batch].push({
                    context: context,
                    path: path,
                    base: base,
                    ext: 'fun',
                    fun: function() {
                        let tileSet = new _scene.lib.img.TileSet(img, 0, 0, w, h)
                        _.patch(base, path, tileSet)
                    }
                })
            }
        } else {
            _.patch(base, path, img)
        }
        //if (isFrame(target)) target.attach(img, name)
        //else if (isObj(target)) target[name] = img

        return img

    } else if (ext === 'ttf') {
        _.log.sys('loader-' + batch, 'font ' + target)

        var fontStyle = document.createElement('style');
        fontStyle.appendChild(document.createTextNode("\n\
        @font-face {\n\
            font-family: '" + name + "';\n\
            src: url('" + src + "'); \n\
        }\
        "));
        document.head.appendChild(fontStyle);

    } else if (ext === 'wav') {
        _.log.sys('loader-' + batch, 'sfx ' + target)
        var node = new Audio(src);
        node.preload = true;
        node.loop = false;
        node.autoplay = false;

        if (base) _.patch(base, path, node)
        //if (isFrame(target)) target.attach(node, name)
        //else if (isObj(target)) target[name] = node
        return node

    } else if (ext === 'ogg') {

    } else if (ext === 'json') {
        this.log.sys('loader-' + batch, 'json: ' + target)

        this.res._included ++
        let usrc = src + "?" + Math.random() // fix possible cache issue

        // store current mod for async access
        let _ = this

        // can't use ajax on local resources
        var ajax = new XMLHttpRequest()
        ajax.onreadystatechange = function() {
            if (this.readyState == 4 && this.status == 200) {
                // json is loaded
                // store it in the exec list
                _.res._execList[batch].push({
                    context: context,
                    path: path,
                    base: base,
                    ext: ext,
                    src: this.responseText,
                })
                _.res._onLoaded()
            }
        }
        ajax.open("GET", src, true);
        ajax.send();

    } else if (ext === 'yaml') {
        // TODO how to load that? only AJAX?
    } else if (ext === 'txt' || ext === 'prop' || ext === 'lines') {
        _.log.sys('loader-' + batch, 'text ' + target)
        
        _.res._included ++
        let usrc = src + "?" + Math.random() // fix possible cache issue

        var ajax = new XMLHttpRequest()
        ajax.onreadystatechange = function() {
            if (this.readyState == 4 && this.status == 200) {
                // file is loaded
                _.res._execList[batch].push({
                    context: context,
                    path: path,
                    base: base,
                    ext: ext,
                    src: this.responseText,
                })
                _.res._onLoaded()
            }
        }
        ajax.open("GET", src, true);
        ajax.send();

    } else if (ext === 'csv') {
        _.log.sys('loader-' + batch, 'csv ' + target)
        
        _.res._included ++
        let usrc = src + "?" + Math.random() // fix possible cache issue

        var ajax = new XMLHttpRequest()
        ajax.onreadystatechange = function() {
            if (this.readyState == 4 && this.status == 200) {
                // file is loaded
                _.res._execList[batch].push({
                    context: context,
                    path: path,
                    base: base,
                    ext: ext,
                    src: this.responseText,
                })
                _.res._onLoaded()
            }
        }
        ajax.open("GET", src, true);
        ajax.send();

    } else if (ext === 'js') {
        this.log.sys('loader-' + batch, 'script: ' + target)

        this.res._included ++
        let usrc = src + "?" + Math.random() // fix possible cache issue

        // store current mod for async access
        let _ = this

        // can't use ajax on local resources
        var ajax = new XMLHttpRequest()
        ajax.onreadystatechange = function() {
            if (this.readyState == 4 && this.status == 200) {
                // script is loaded
                // store it in the exec list
                _.res._execList[batch].push({
                    context: context,
                    path: path,
                    base: base,
                    ext: ext,
                    src: this.responseText,
                })
                _.res._onLoaded()
            }
        }
        ajax.open("GET", src, true);
        ajax.send();

        // TODO we might return some kind of promise of a container for future value?
    } else {
        _.log.sys('loader-' + batch, 'ignoring resource: [' + target + ']')
    }
}

Mod.prototype.fixRes = function(target, base, ignore, batch, src, path) {
    if (path.startsWith(base)) {
        // refix without base
        path = path.substring(base.length)
        this.fixRes(target, base, ignore, batch, src, path)
    } else {
        //_scene.log.sys('fixer-'+batch+'!'+this.name, ': [' + src + '] -> ' + path)
        if (ignore && path.startsWith(ignore)) {
            _scene.log.sys('loader-'+batch, 'ignoring: [' + src + ']')
        } else {
            path = path.replace(/\..+$/, '');

            // determine target mod
            if (path.startsWith('mod')) {
                let i = path.indexOf('/', 4)
                if (i > 0) {
                    let modPath = path.substring(0, i)
                    let modName = path.substring(4, i)
                    // TODO fix mod loading
                    //path = path.substring(i+1)
                    let mod = this.mod._dir[modName]
                    if (!isFrame(mod)) {
                        mod = this.mod.touch(modName)
                    }
                    // load in other mod's context in the next batch
                    this.batchLoad(batch+1, mod, base + src, target, path)
                } else {
                    _scene.log.sys('loader-'+batch, 'ignoring: [' + src + ']')
                }
            } else if (path.startsWith('boot')) {
                let i = path.indexOf('/', 4)
                if (i > 0) {
                    let modPath = path.substring(0, i)
                    let modName = path.substring(4, i)
                    path = path.substring(i+1)
                    let boot = this._dir['boot']
                    if (!isFrame(boot)) {
                        boot = this.touch('boot')
                    }
                    // load in other mod's context in the previous batch
                    boot.batchLoad(batch-1, boot, base + src, boot, path)
                } else {
                    _scene.log.sys('loader-'+batch, 'ignoring: [' + src + ']')
                }

            } else {
                this.batchLoad(batch, this, base + src, target, path)
            }
        }
    }
}

// TODO provide topology path, so we can have just couple of topologies (sys and base)
//      topology must be failproof - if we got one, use it
//      don't overload many times
var modBatch = 0
Mod.prototype.fix = function(target, base, ignore, forceBatch, onLoaded) {
    let batch
    if (forceBatch) {
        batch = forceBatch
    } else {
        batch = modBatch++ // load the next batch
    }

    // normalize base
    if (base.length > 0 && !base.endsWith('/')) {
        base = base + '/'
    }

    // get and process new topology for the given base at the target node
    this.log.sys('fix', target.name + ' <= ' + base)

    let currentMod = this
    let ajax = new XMLHttpRequest()
    ajax.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
            // topology is loaded
            // place in context and execute
            let topology = JSON.parse(this.responseText)
            topology.forEach(src => currentMod.fixRes(target, base, ignore, batch, src, src))
            if (isFun(onLoaded)) onLoaded(topology)
            // NOTE do not count topology in res._loaded - it can be missing!
        }
    }

    // TODO get topology just in 2 places - base and sys
    //      there could be a special way to load stuff outside the base
    try {
        let src = base + 'topology' + "?" + Math.random() // fix possible cache issue
        ajax.open("GET", src, true);
        ajax.send();
    } catch (e) {
        _scene.log.sys('loader', 'no topology for ' + base)
    }
}

// ***********************
// scene tree construction
var _scene = new Mod()
_scene.name = '/'
_scene._ = _scene // set the context
_scene._$ = _scene // root context
_scene.__ = false // don't have any parents
_scene.___ = _scene// parent context
_scene.inherit = function() {}

_scene.path = function() {
    return ''
}

// env
augment(_scene.env, window['_env$'])

// ***
// log
_scene.attach(new Frame({
    name: 'log',
    err: function(msg, post) {
        post? console.log('! [' + msg + '] ' + post) : console.log('! ' + msg) 
    },
    warn: function(msg, post) {
        post? console.log('? [' + msg + '] ' + post) : console.log('? ' + msg) 
    },
    out: function(msg, post) {
        post? console.log('> [' + msg + '] ' + post) : console.log('> ' + msg) 
    },
    debug: function(msg, post) {
        post? console.log('# [' + msg + '] ' + post) : console.log('# ' + msg) 
    },
    sys: function(msg, post) {
        post? console.log('$ [' + msg + '] ' + post) : console.log('> ' + msg) 
    },
    dump: function(obj) {
        console.dir(obj)
    },
}))

_scene.packDeclarations = function(target) {
    // normalize target
    if (!isObj(target)) target = window

    var pak = {}
    target['_def$'] = pak

    // search for declarations
    for (var key in target) {
        if (key.startsWith('_boot$') || key.startsWith('_patch$') || key.indexOf('@') >= 0) {
            pak[key] = target[key]
            target[key] = false
        }
    }
}

  
// ********************************************
// sys functions
_scene.attach(new Frame({
    name: "sys",
}))
_scene.sys.attach(mix)
_scene.sys.attach(augment)
_scene.sys.attach(extend)
_scene.sys.attach(before)
_scene.sys.attach(after)

_scene.sys.attach(Frame)
_scene.sys.attach(LabFrame)

_scene.sys.attach(isObj)
_scene.sys.attach(isFun)
_scene.sys.attach(isNumber)
_scene.sys.attach(isString)
_scene.sys.attach(isArray)
_scene.sys.attach(isMutable)
_scene.sys.attach(isFrame)

_scene.env.TARGET_FPS = 60
_scene.env.MAX_EVO_STEP = 0.01
_scene.env.MAX_EVO_PER_CYCLE = 0.3
_scene.env.lastFrame = Date.now()
_scene.env.mouseX = 0
_scene.env.mouseY = 0
_scene.env.keys = {}  // down key set



// *****************************************************
// LIFECYCLE
// main scene lifecycle - bootstrap, cycle[evo, draw]
//
function bootstrap() {
    console.log('*** [jam] booting up ***')
    // binding to the graphical context by convention
    let canvas = document.getElementById(canvasName)
    if (canvas == null) {
        // precreated canvas is not found, so create one
        canvas = document.createElement(canvasName);
        canvas.id = canvasName;
        canvas.style.zIndex   = 1;
        canvas.style.border   = "0px";
        canvas.style.margin = "0px";
        canvas.style.padding = "0px";
        canvas.style.position = "absolute";
        canvas.style.display = "block";
        document.body.appendChild(canvas);

        // style body
        document.body.style.margin = "0"
        document.body.style.padding = "0"
        document.body.style.overflow = "hiddenq";
        document.body.setAttribute("scroll", "no");
    }
    _scene.ctx = canvas.getContext("2d")

    // pack existing declarations in global scope first
    _scene.packDeclarations()

    // load jam root mod
    _scene.fix(_scene, _scene.env.syspath + 'jam', 'fix')
    // loading ext in basepath, if not found - loading in syspath
    _scene.fix(_scene, 'ext', 'fix', false, function(topology) {
        if (topology.length === 0) {
            _scene.log.sys('fix', 'no ext mod found in basepath! Loading system ext')
            _scene.fix(_scene, _scene.env.syspath + 'ext', 'fix', 2)
        }
    })
    // load default mod
    try {
        _scene.fix(_scene, 'mod', 'fix')
    } catch (e) {}
    // load default named mod (for foo.html -> foo/ or foo.mod/)
    if (_scene.env.basename && _scene.env.basename.length > 0 && _scene.env.basename != 'mod') {
        try {
            _scene.fix(_scene, _scene.env.basename, 'fix')
        } catch (e) {}
        try {
            _scene.fix(_scene, _scene.env.basename + '.mod', 'fix')
        } catch (e) {}
    }

    // scan global just in case of some definitions there
    _scene.scan()

    // load custom declarations packed before
    // TODO - maybe a better way to postpone it? scripts are loaded async
    //        so we need an event when core is loaded for that
    _scene.scan(window._def$)
    
    //canvas.webkitRequestFullScreen(Element.ALLOW_KEYBOARD_INPUT); //Chrome
    //canvas.mozRequestFullScreen(); //Firefox
    //canvas.msRequestFullscreen();
    //canvas.requestFullscreen();

    expandCanvas(canvasName)
    focus()
    setInterval(focus, 100)

    // initiate the game loop
    console.log('*** [jam] starting main cycle ***')
    window.requestAnimFrame(cycle)
    /*
    // old-fasioned way to setup animation
    if (_scene.env.TARGET_FPS <= 0) {
        setInterval(cycle, 1)
    } else {
        setInterval(cycle, 1000/_scene.env.TARGET_FPS)
    }
    */
}

// > implement 'keepOriginalAspectRatio'&'aspectRatio' option
function expandCanvas(name) {
    if (_scene.env.canvasStyle === 'preserve') {
        var canvas = document.getElementById(name)
        _scene.env.width = _scene.ctx.width = canvas.width
        _scene.env.height = _scene.ctx.height = canvas.height
        _scene.draw() // it doesn't work without forced redraw
    } else {
        // default full-screen canvas
        var canvas = document.getElementById(name)
        var newWidth = window.innerWidth
        var newHeight = window.innerHeight
        _scene.env.width = _scene.ctx.width = canvas.width = newWidth
        _scene.env.height = _scene.ctx.height = canvas.height = newHeight
        canvas.style.width = newWidth + 'px'
        canvas.style.height = newHeight + 'px'
        _scene.draw() // it doesn't work without forced redraw
    }
}

function expandView() {
    // TODO modify to support multiple canvases and custom resize
    expandCanvas(canvasName)
}


// ******************************************************
function cycle() {
    var now = Date.now()
    var dt = (now - _scene.env.lastFrame)/1000

    // show, react and update cycle
    _scene.draw()

    // max evolution threshold
    if (dt > _scene.env.MAX_EVO_PER_CYCLE) {
        dt = _scene.env.MAX_EVO_PER_CYCLE
    }

    // evolve multiple times in small quants
    // to compensate possible lag due to rendering delays
    while(dt > 0) {
        if (dt > _scene.env.MAX_EVO_STEP) {
            _scene.evo(_scene.env.MAX_EVO_STEP);
        } else {
            _scene.evo(dt);
        }
        dt -= _scene.env.MAX_EVO_STEP
    }
    _scene.env.lastFrame = now
	window.requestAnimFrame(cycle)
}



// ***************
// events handling
// TODO move to external system traps

function handleMouseMove(e) {
    e = e || window.event
    _scene.env.mouseX = e.pageX
    _scene.env.mouseY = e.pageY
    e.preventDefault()
    e.stopPropagation()
    return false;
}

function handleMouseDown(e) {
    _scene.trap('mouseDown', e, true)
    e.preventDefault()
    e.stopPropagation()
    return false;
}

function handleMouseUp(e) {
    _scene.trap('mouseUp', e, true)
    e.preventDefault()
    e.stopPropagation()
    return false;
}

function handleMouseClick(e) {
    _scene.trap('click', e, true)
    e.preventDefault()
    e.stopPropagation()
    return false;
}

function handleMouseDoubleClick(e) {
    switch (e.button) {
    case 0: 
            break;
    case 1:
            break;
    case 2:
            break;
    }
    e.preventDefault()
    e.stopPropagation()
    return false;
}

function handleMouseOut(e) {
    for (var k in _scene.env.keys) {
        delete _scene.env.keys[k]
    }
}

function handleContextMenu(e) {
    e.preventDefault()
    e.stopPropagation()
    return false;
}

function handleKeyDown(e) {
    var code = e.which || e.keyCode

    _scene.env.keys[code] = 1
    let ename = e.code.toLowerCase() + 'Down'

    let chain = _scene.trap(ename, e, true)
    if (chain) {
        chain = _scene.trap('keyDown', e, true)
    }

    if (!chain)  {
        e.preventDefault()
        e.stopPropagation()
        return false;
    }
    return true
}

function handleKeyUp(e) {
    var code = e.which || e.keyCode
    delete _scene.env.keys[code]

    let ename = e.code.toLowerCase() + 'Up'

    let chain = _scene.trap(ename, e, true)
    if (chain) {
        chain = _scene.trap('keyUp', e, true)
    }

    if (!chain)  {
        e.preventDefault()
        e.stopPropagation()
        return false;
    }
    return true
}


// *****************
// setup environment

// determine system path
let scripts = document.getElementsByTagName('script')
for (let i = 0; i < scripts.length; i++) {
    if (scripts[i].src.endsWith('jam/fix.js')) {
        let path = scripts[i].src.split('?')[0]
        let syspath = path.split('/').slice(0, -2).join('/')+'/'
        let htmlhost = location.href.split('/').slice(0, -1).join('/')+'/'
        let pagename = location.href.split('/').slice(-1).join('').split('?').slice(0, 1).join('')
        let htmlname = pagename.split('.').slice(0, -1).join('')
        
        if (syspath.startsWith(htmlhost)) {
            // we can shorten the syspath to a relative value
            syspath = syspath.substring(htmlhost.length)
        }
        _scene.env.basepath = htmlhost
        _scene.env.basename = htmlname
        _scene.env.syspath = syspath

        console.log('=== Environment ===')
        console.log('NAME: ' + _scene.env.basename)
        console.log('SYSPATH: ' + _scene.env.syspath)
        console.log('BASEPATH: ' + _scene.env.basepath)
        break;
    }
}

function focus() {
    window.focus()
}

// bind events to target
// TODO move to external system setup
function bindHandlers(target) {
    if (!target) return
    target.onresize = expandView
    target.onload = bootstrap
    target.onmousedown = handleMouseDown
    target.onmouseup = handleMouseUp
    target.onclick = handleMouseClick
    target.onmouseout = handleMouseOut
    target.ondblclick = handleMouseDoubleClick
    target.oncontextmenu = handleContextMenu
    target.onmousemove = handleMouseMove
    target.onkeydown = handleKeyDown
    target.onkeyup = handleKeyUp
}
bindHandlers(window)


// extend window with universal requestAnimFrame
window.requestAnimFrame = (function() {
  return window.requestAnimationFrame ||
         window.webkitRequestAnimationFrame ||
         window.mozRequestAnimationFrame ||
         window.oRequestAnimationFrame ||
         window.msRequestAnimationFrame ||
         function(callback, element) {
            window.setTimeout(callback, 1000/60);
         };
})();

return _scene;

}(window))
