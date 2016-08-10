/*
Copyright (c) 2010 Caleb Helbling

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
*/

Object.accessors = function(obj,name,get,set) {
	if (Object.defineProperty !== undefined) { // ECMAScript 5
		Object.defineProperty(obj,name,{
			get: get,
			set: set
		});
	} else if (Object.prototype.__defineGetter__ !== undefined) { // Nonstandard
		obj.__defineGetter__(name,get);
		obj.__defineSetter__(name,set);
	}
};

if (!Object.prototype.watch) {
    Object.prototype.watch = function (prop, handler) {
        var oldvalue = this[prop], newvalue = oldvalue,
			getter = function () {
				return newvalue;
			},
			setter = function (value) {
				oldvalue = newvalue;
				newvalue = handler.call(this, prop, oldvalue, value);
				return newvalue;
			};
			
        if (delete this[prop]) { // can't watch constants
            if (Object.defineProperty) { // ECMAScript 5
                Object.defineProperty(this, prop, {
                    get: getter,
                    set: setter
                });
            } else if (Object.prototype.__defineGetter__ && Object.prototype.__defineSetter__) { // legacy
                Object.prototype.__defineGetter__.call(this, prop, getter);
                Object.prototype.__defineSetter__.call(this, prop, setter);
            }
        }
    };
}

if (!Object.prototype.unwatch) {
    Object.prototype.unwatch = function (prop) {
        var value = this[prop];
        delete this[prop]; // remove accessors
        this[prop] = value;
    };
}

if (!Array.prototype.indexOf) {
	Array.prototype.indexOf = function(needle) {
		var len = this.length;
		for (var i = 0; i < len; i++) {
			if (this[i] === needle) {
				return i;
			}
		}
		
		return -1;
	};
}

if (!Object.create) {
	Object.create = (function() {
		var F = function() {};
		
		return function (obj) {
			F.prototype = obj;
			return new F();
		};
	})();
}

Object.accessors(Object.prototype,'proto',function() {
	if (Object.getPrototypeOf !== undefined) {
		return Object.getPrototypeOf(this);
	} else {
		return this.__proto__;
	}
},function(value) {	
	this.__proto__ = value;
	return value;
});

Math.choose = function() {
	return arguments[Math.floor(Math.random()*arguments.length)];
};

Math.pointDirection = function(x1,y1,x2,y2) {
	var angle = Math.atan2(y2-y1,x2-x1);
	
	if (angle < 0) {
		angle += 6.283185307179586;
	}
	
	return angle;
};

Math.pointDistance = function(x1,y1,x2,y2) {
	var s1 = x1-x2,
		s2 = y1-y2;
	return Math.sqrt(s1*s1+s2*s2);
};

Math.degToRad = function(deg) {
	return deg*0.017453292519943295;
};

Math.radToDeg = function(rad) {
	return rad*57.29577951308232;
};

Math.polarToRectX = function(angle,length) {
	return Math.cos(angle)*length;
};

Math.polarToRectY = function(angle,length) {
	return Math.sin(angle)*length;
};

var PP = {
// Resource objects for the developer
	spr: {},
	rm: {},
	obj: {},
	snd: {},
	al: {},
	global: {},
	
	Alarm: function(callback) {
		// Make sure it's called as a constructor
		if (!(this instanceof PP.Alarm)) {
			return new PP.Alarm(callback);
		}
		
		this.time = null;
		this.callback = callback;
		
		PP.Alarm.list[PP.Alarm.list.length] = this;
		
		return this;
	},
	
	collision: {
		masks: function(mask1,x1,y1,angle1,mask2,x2,y2,angle2) {
			return PP.collision.sat(PP.collision.resolveShape(mask1,x1,y1,angle1),PP.collision.resolveShape(mask2,x2,y2,angle2));
		},
		
		point: function(mask,mx,my,angle,px,py) {
			return PP.collision.sat(PP.collision.resolveShape(mask,mx,my,angle),[[px,py]]);
		},
		
		rectangle: function(mask,mx,my,angle,x1,y1,width,height) {
			var x2 = x1+width,
				y2 = y1+height;
				
			return PP.collision.sat(PP.collision.resolveShape(mask,mx,my,angle),[[x1,y1],[x2,y1],[x2,y2],[x1,y2]]);
		},
		
		line: function(mask,mx,my,angle,x1,y1,x2,y2) {
			return PP.collision.sat(PP.collision.resolveShape(mask,mx,my,angle),[[x1,y1],[x2,y2]]);
		},
		
		// The SAT algorithm is capable of collision detection between points,
		// line segments, and any concave polygon
		sat: (function() {
			var vector = {
				normalize: function(vector) {
					var x = vector[0],
						y = vector[1],
						len = Math.sqrt(x*x+y*y);
					
					vector[0] = x/len;
					vector[1] = y/len;
					
					return vector;
				},
				
				dot: function(a,b) {
					return a[0]*b[0]+a[1]*b[1];
				},
				
				leftNormal: function(v) {
					return [-v[1],v[0]];
				}
			};
			
			var getAxes = function(s,array) {
				// s = shape
				var p1,p2,edge;
				
				if (s.length !== 1) {
					for (var i = 0; i < s.length; i++) {
						if (s.length === 2 && i === 1) {
							break;
						}
						
						// Get the current vertex
						p1 = s[i];
						
						// Get the next vertex
						p2 = s[i+1 === s.length ? 0 : i+1];
						
						// Subtract the two to get the edge vector
						edge = [p1[0]-p2[0],p1[1]-p2[1]];
						
						// The axis will be the normal of the edge
						array.push(vector.normalize(vector.leftNormal(edge)));
					}
				}
				
				return array;
			};
			
			var project = function(shape,axis) {
				var min = null,
					max = null;
					
				for (var i = 0; i < shape.length; i++) {
					var p = vector.dot(axis,shape[i]);
					
					if (p < min || min === null) {
						min = p;
					}
					
					if (p > max || max === null) {
						max = p;
					}
				}
				
				return  {
					min: min,
					max: max
				};
			};
			
			return function(shape1,shape2) {
				// Determine the axes
				var axes = getAxes(shape1,[]);
				getAxes(shape2,axes);
				
				// Project each shape onto each axis			
				var proj1,proj2;
				for (var i = 0; i < axes.length; i++) {
					proj1 = project(shape1,axes[i]);
					proj2 = project(shape2,axes[i]);
					
					// Check for overlaps between the projections
					if (!((proj1.min >= proj2.min && proj1.min <= proj2.max) || (proj1.max >= proj2.min && proj1.max <= proj2.max) || (proj2.min >= proj1.min && proj2.min <= proj1.max) || (proj2.max >= proj1.min && proj2.max <= proj1.max))) {
						return false;
					}
				}
				
				return true;
			};
		})(),
		
		// Takes the unrotated relatively position mask and rotates it
		// and absolutely aligns it
		resolveShape: (function() {
			var resolvePoint = function(point,x,y,angle) {
				var s = Math.sin(angle),
					c = Math.cos(angle);
				
				return [x+Math.floor(point[0]*c-point[1]*s),y+Math.floor(point[0]*s+point[1]*c)];
			};
		
			return function(mask,x,y,angle) {
				var newShape = [];
				for (var i = 0; i <mask.length; i++) {
					newShape.push(resolvePoint(mask[i],x,y,angle));
				}
				
				return newShape;
			};
		})()
	},
	
	draw: {
		get alpha() {
			return PP.draw.displayCanvas.ctx.globalAlpha;
		},
		
		set alpha(value) {
			PP.draw.displayCanvas.ctx.globalAlpha = value;
			return value;
		},
		
		get color() {
			return PP.draw.displayCanvas.ctx.fillStyle;
		},
		
		set color(value) {
			var ctx = PP.draw.displayCanvas.ctx;
			
			ctx.fillStyle = value;
			ctx.strokeStyle = value;
			
			return value;
		},
		
		get cursor() {
			return PP.draw.displayCanvas.style.cursor;
		},
		
		set cursor(value) {
			PP.draw.displayCanvas.style.cursor = value;
			return value;
		},
		
		get font() {
			return PP.draw.displayCanvas.ctx.font;
		},
		
		set font(value) {
			PP.draw.displayCanvas.ctx.font = value;
			return value;
		},
		
		get lineWidth() {
			return PP.draw.displayCanvas.ctx.lineWidth;
		},
		
		set lineWidth(value) {
			PP.draw.displayCanvas.ctx.lineWidth = value;
			return value;
		},
		
		get lineCap() {
			return PP.draw.displayCanvas.ctx.lineCap
		},
		
		set lineCap(value) {
			PP.draw.displayCanvas.ctx.lineCap = value;
			return value;
		},
		
		get textHalign() {
			return PP.draw.displayCanvas.ctx.textAlign;
		},
		
		set textHalign(value) {
			PP.draw.displayCanvas.ctx.textAlign = value;
			return value;
		},
		
		get textValign() {
			return PP.draw.displayCanvas.ctx.textBaseline;
		},
		
		set textValign(value) {
			PP.draw.displayCanvas.ctx.textBaseline = value;
			return value;
		},
		
		clear: function(ctx) {
			ctx = ctx || PP.draw.displayCanvas.ctx;
			/*PP.draw.displayCanvas.ctx.clearRect(0,0,PP.view.width,PP.view.height);
			PP.draw.displayCanvas.ctx.clearRect(0,0,PP.view.width,PP.view.height);*/
			ctx.clearRect(0,0,PP.view.width,PP.view.height);
		},
		
		circle: function(x,y,radius,stroke,color) {
			if (color !== undefined) {
				PP.draw.color = color;
			}
			
			x -= PP.view.x;
			y -= PP.view.y;
			
			PP.draw.displayCanvas.ctx.beginPath();
			PP.draw.displayCanvas.ctx.arc(x,y,radius,0,6.283185307179586,false);
			
			if (stroke) {
				PP.draw.displayCanvas.ctx.stroke();
			} else {
				PP.draw.displayCanvas.ctx.fill();
			}
		},
		
		depth: function(obj,depth) {
			obj.depth = depth;
			PP.draw.depth.update = true;
		},
		
		line: function(x1,y1,x2,y2,width,color) {
			if (width !== undefined) {
				PP.draw.lineWidth = width;
			}
			
			if (color !== undefined) {
				PP.draw.color = color;
			}
			
			x1 -= PP.view.x+0.5;
			y1 -= PP.view.y+0.5;
			x2 -= PP.view.x+0.5;
			y2 -= PP.view.y+0.5;
			
			PP.draw.displayCanvas.ctx.beginPath();
			PP.draw.displayCanvas.ctx.moveTo(x1,y1);
			PP.draw.displayCanvas.ctx.lineTo(x2,y2);
			PP.draw.displayCanvas.ctx.stroke();
		},
		
		rectangle: function(x1,y1,width,height,stroke,color) {
			if (color !== undefined) {
				PP.draw.color = color;
			}
			
			if (width !== 0 && height !== 0) {
				x1 -= PP.view.x;
				y1 -= PP.view.y;
						
				if (stroke) {
					PP.draw.displayCanvas.ctx.strokeRect(x1,y1,width,height);
				} else {
					PP.draw.displayCanvas.ctx.fillRect(x1,y1,width,height);
				}
			}
		},
		
		text: function(x,y,text,stroke,maxWidth) {
			x -= PP.view.x;
			y -= PP.view.y;
			
			if (stroke) {
				if (maxWidth !== undefined) {
					PP.draw.displayCanvas.ctx.strokeText(text,x,y,maxWidth);
				} else {
					PP.draw.displayCanvas.ctx.strokeText(text,x,y);
				}
			} else {
				if (maxWidth !== undefined) {
					PP.draw.displayCanvas.ctx.fillText(text,x,y,maxWidth);
				} else {
					PP.draw.displayCanvas.ctx.fillText(text,x,y);
				}
			}
		},
		
		triangle: function(x1,y1,x2,y2,x3,y3,stroke,color) {
			if (color !== undefined) {
				PP.draw.color = color;
			}
			
			var ctx = PP.draw.displayCanvas.ctx;
			
			x1 -= PP.view.x;
			y1 -= PP.view.y;
			x2 -= PP.view.x;
			y2 -= PP.view.y;
			x3 -= PP.view.x;
			y3 -= PP.view.y;
			
			ctx.beginPath();
			ctx.moveTo(x1,y1);
			ctx.lineTo(x2,y2);
			ctx.lineTo(x3,y3);
			
			if (stroke) {
				ctx.closePath();  
				ctx.stroke();
			} else {
				ctx.fill();
			}
		}
	},
	
	init: function(id,displayWidth,displayHeight) {
		if (navigator.userAgent.indexOf('Opera') !== -1) {
			PP.initisOpera = true;
		} else {
			PP.initisOpera = false;
		}

		var canvas = document.getElementById(id);
		canvas.ctx = canvas.getContext('2d');
		PP.draw.displayCanvas = canvas;
		
		if (displayWidth !== undefined) {
			canvas.style.width = displayWidth+'px';
		}
		
		if (displayHeight !== undefined) {
			canvas.style.height = displayHeight+'px';
		}
		
		PP.view.width = canvas.width || canvas.style.width;
		PP.view.height = canvas.height || canvas.style.height;
		
		window.onkeydown = function(event) {
			var keyobj = PP.key.number[event.keyCode || event.which];
			
			if (keyobj !== undefined) {
				if (keyobj.pressed === false) {
					keyobj.down = true;
					keyobj.pressed = true;
				}
			}
			
			// Don't interfere with the built in browser shortcuts
			if (event.ctrlKey || event.altKey || event.metaKey) {
				return true;
			}
			
			return false;
		};
		
		window.onkeyup = function(event) {
			var keyobj = PP.key.number[event.keyCode || event.which];
			
			if (keyobj !== undefined) {
				keyobj.pressed = false;
				keyobj.up = true;
			}
			
			if (event.ctrlKey || event.altKey || event.metaKey) {
				return true;
			}
			
			return false;
		};
		
		var loffset = function(elem) {
			var o = elem.offsetLeft;

			if (elem.offsetParent !== null) {
				o += loffset(elem.offsetParent);
			}
			
			return o;
		};

		var toffset = function(elem) {
			var o = elem.offsetTop;

			if (elem.offsetParent !== null) {
				o += toffset(elem.offsetParent);
			}
			
			return o;
		};

		var offsetLeft = loffset(canvas);
		var offsetTop = toffset(canvas);
		
		window.onmousemove = function(e) {
			var posx = 0;
			var posy = 0;
			if (!e) {
				e = window.event;
			}
			
			if (e.pageX || e.pageY) {
				posx = e.pageX;
				posy = e.pageY;
			} else if (e.clientX || e.clientY) {
				posx = e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
				posy = e.clientY + document.body.scrollTop + document.documentElement.scrollTop;
			}
			
			posx = posx-offsetLeft;
			posy = posy-offsetTop;
			
			PP.mouse.x = (posx/displayWidth)*PP.view.width+PP.view.x;
			PP.mouse.y = (posy/displayHeight)*PP.view.height+PP.view.y;
		};
		
		window.onmousedown = function(e) {
			var button;
			
			switch(e.button) {
				case 0:
					button = PP.mouse.left;
				break;
				
				case 1:
					button = PP.mouse.middle;
				break;
				
				case 2:
					button = PP.mouse.right;
				break;
			}
			
			button.down = true;
			button.pressed = true;
		};
		
		window.onmouseup = function(e) {
			var button;
			
			switch(e.button) {
				case 0:
					button = PP.mouse.left;
				break;
				
				case 1:
					button = PP.mouse.middle;
				break;
				
				case 2:
					button = PP.mouse.right;
				break;
			}
			
			button.up = true;
			button.pressed = false;
		};
		
		// Event handler for mouse wheel event.
		var wheel = function(event){
			var delta = 0;
			
			if (event.wheelDelta) { // Opera and Chrome
				delta = event.wheelDelta;
			} else if (event.detail) { // Firefox
				delta = -event.detail;
			}

			// Positive delta: wheel up
			// Negative delta: wheel down
			if (delta < 0) {
				PP.mouse.wheel.down = true;
			} else {
				PP.mouse.wheel.up = true;
			}
			
			// Prevent default scroll actions
			if (event.preventDefault) {
				event.preventDefault();
			}
			event.returnvalue = false;
		};

		// Mouse wheel initialization code
		if (window.addEventListener) {
			// DOMMouseScroll is for Firefox
			window.addEventListener('DOMMouseScroll', wheel, false);
		}
		// Opera and Chrome
		window.onmousewheel = wheel;
		document.onmousewheel = wheel;
	},
	
	key: {
		a: {code: 65},
		b: {code: 66},
		c: {code: 67},
		d: {code: 68},
		e: {code: 69},
		f: {code: 70},
		g: {code: 71},
		h: {code: 72},
		i: {code: 73},
		j: {code: 74},
		k: {code: 75},
		l: {code: 76},
		m: {code: 77},
		n: {code: 78},
		o: {code: 79},
		p: {code: 80},
		q: {code: 81},
		r: {code: 82},
		s: {code: 83},
		t: {code: 84},
		u: {code: 85},
		v: {code: 86},
		w: {code: 87},
		x: {code: 88},
		y: {code: 89},
		z: {code: 90},
		
		space: {code: 32},
		enter: {code: 13},
		tab: {code: 9},
		escape: {code: 27},
		backspace: {code: 8},
		shift: {code: 16},
		control: {code: 17},
		alt: {code: 18},
		capsLock: {code: 20},
		numLock: {code: 144},
		
		'0': {code: 48},
		'1': {code: 49},
		'2': {code: 50},
		'3': {code: 51},
		'4': {code: 52},
		'5': {code: 53},
		'6': {code: 54},
		'7': {code: 55},
		'8': {code: 56},
		'9': {code: 57},
		
		left: {code: 37},
		up: {code: 38},
		right: {code: 39},
		down: {code: 40},
		
		insert: {code: 45},
		del: {code: 46},
		home: {code: 36},
		end: {code: 35},
		pageUp: {code: 33},
		pageDown: {code: 34},
		
		f1: {code: 112},
		f2: {code: 113},
		f3: {code: 114},
		f4: {code: 115},
		f5: {code: 116},
		f6: {code: 117},
		f7: {code: 118},
		f8: {code: 119},
		f9: {code: 120},
		f10: {code: 121},
		f11: {code: 122},
		f12: {code: 123},
		
		// A cache is created so that all the keys can be easily be looped through when key states are reset every loop
		
		// Cache each key in an array
		cache: [],
		
		// Cache by a key's code
		number: []
	},
	
	load: (function() {	
		var loadAudio = function() {
			var imgArray = PP.load.spritesList,
				audio = PP.load.soundList;
			
			// Controls what happens when the audio finishes loading
			var finished = function() {
				PP.load.soundList.shift();
				PP.load.completed += 1;
				
				// Start loading the next audio file
				loadAudio();
			};
			
			if (PP.load.soundList.length > 0) {
				var thisAud = PP.load.soundList[0];
				thisAud.src = thisAud.url;
				
				// Firefox won't begin loading the audio until something is done with the audio object.
				thisAud.pause();
				
				var canplaythroughListener = function() {
					// Make sure it doesn't fire again...
					thisAud.removeEventListener('canplaythrough',canplaythroughListener,true);
					
					finished();
				};
				
				// Detection to check if the audio finished loading or if an error happened
				thisAud.addEventListener('canplaythrough',canplaythroughListener,true);
				
				var errorListener = function() {
					// Make sure it doesn't fire again...
					thisAud.removeEventListern('error',errorListener,true);
					
					finished();
				};
				
				thisAud.addEventListener('error',errorListener,true);
				
			} else {
				// Everything is finished loading :D Invoke the callback
				PP.load.callback();
			}
		};
		
		var loadImage = function() {
			var imgArray = PP.load.spritesList,
				audio = PP.load.soundList;
				
			if (imgArray.length > 0) {
				var img = imgArray[0].imgObj;
				img.src = imgArray[0].url;
				
				img.onload = function() {
					var img = imgArray[0];
					img.width = img.imgObj.width;
					img.height = img.imgObj.height;
					
					// Width of each subimage for sprite strips
					img.subWidth = img.width/img.subimg;
					
					// Set up the default mask
					img.mask = [[-img.xorig,-img.yorig],[img.subWidth-img.xorig,-img.yorig],[img.subWidth-img.xorig,img.height-img.yorig],[-img.xorig,img.height-img.yorig]];
					
					img.pattern = PP.draw.displayCanvas.ctx.createPattern(img.imgObj,'repeat');
					imgArray.shift();
					
					PP.load.completed += 1;
					
					// Start loading the next image
					loadImage();
				};
			} else {
				// Start loading audio when all the sprites are done loading
				loadAudio();
			}
		};
		
		return function(callback) {
			PP.load.callback = callback;
			PP.load.total = PP.load.spritesList.length + PP.load.soundList.length;
			PP.load.completed = 0;
			
			loadImage();
		};
	}()),
	
	loop: {
		register: function(obj,x,y) {
			// Registered objects shouldn't be registered again....
			if (!obj.registered || !obj.hasOwnProperty('registered')) {
				var proto = obj.proto;
				
				if (x !== undefined) {
					obj.x = x;
				}
				
				if (y !== undefined) {
					obj.y = y;
				}
				
				if (!proto.hasOwnProperty('children')) {
					proto.children = [];
				}
				
				// Caches the postion of the object in the objects' prototype's children array so it can
				// be quickly removed from it by the remove function
				obj.childrenIndex = proto.children.length;
				proto.children.push(obj);
				
				// Caches the position of the object in the object registration list
				obj.objectsIndex = PP.loop.regObjects.length;
				
				// Register the object to the objects array so it will be included in the loop
				PP.loop.regObjects[obj.objectsIndex] = obj;
				
				obj.registered = true;
				
				// Attempt to invoke the initialize method
				if (typeof obj.initialize === 'function') {
					obj.initialize(obj);
				}
			}
			
			return obj;
		},
		
		remove: function(obj,preventOnRemove) {
			obj.registered = false;
			
			delete obj.proto.children[obj.childrenIndex];
			delete PP.loop.regObjects[obj.objectsIndex];
			
			if (!preventOnRemove && typeof obj.onRemove === 'function') {
				obj.onRemove(obj);
			}
			
			return obj;
		},
		
		beget: function(obj,x,y) {
			return PP.loop.register(Object.create(obj),x,y);
		},
		
		// A list of all registered objects
		regObjects: [],
		
		// This function controls the entirety of the tick, including firing objects's methods, and finishing the double buffer interaction.
		tick: function() {
			var regObjs = PP.loop.regObjects;
		
			//PP.draw.clear(PP.draw.displayCanvas.ctx);
			
			var methodNames = PP.loop.methods;
			var ilen = methodNames.length;
			for (var i = 0; i < ilen; i++) {
				var thisName = methodNames[i];
				
				if (typeof thisName === 'function') {
					thisName = thisName();
				}
				
				if (PP.draw.depth.update) {
					PP.draw.depth.update = false;
					PP.loop.regObjects.sort(function(a,b) {
						var ad = a.depth || 0,
							bd = b.depth || 0;
						
						return ad-bd;
					});
					
					var mlen = regObjs.length;
					for (var m = 0; m < mlen; m++) {
						var obj = regObjs[i];
						
						// The position of the object in the registration array stored within every object needs to be updated
						// to reflect changes made by the sorting
						if (obj) {
							obj.objectsIndex = m;
						}
					}
				}
				
				if (thisName) {
					if (thisName === 'ALARMS') {
						for (var k = 0; k < PP.Alarm.list.length; k++) {
							var thisAlarm = PP.Alarm.list[k];
							
							if (thisAlarm) {
								if (thisAlarm.time !== null) {
									thisAlarm.time -= 1;
									
									if (thisAlarm.time <= 0) {
										thisAlarm.time = null;
										thisAlarm.callback();
									}
								}
							}
						}
					} else {
						// For this loop, the length can't be cached because objects could be registered in the methods
						for (var j = 0; j < regObjs.length; j++) {
							var obj = regObjs[j];
							
							if (obj) {					
								var method = obj[thisName];
								if (method) {
									method.call(obj,obj);
								}
							}
						}
					}
				}
			}
			
			// Reset the mouse variables for the next loop
			PP.mouse.left.down = false;
			PP.mouse.left.up = false;
			PP.mouse.middle.down = false;
			PP.mouse.middle.up = false;
			PP.mouse.right.down = false;
			PP.mouse.right.up = false;
			PP.mouse.wheel.up = false;
			PP.mouse.wheel.down = false;
			
			// Reset the key variables for the next loop
			var len = PP.key.cache.length;
			for (i = 0; i < len; i++) {
				var thisKey = PP.key.cache[i];
				thisKey.down = false;
				thisKey.up = false;
			}
		},
		
		methods: ['beginTick','ALARMS','tick','draw','endTick']
	},
	
	mouse: {
		x: null,
		y: null,
		
		left: {
			down: false,
			pressed: false,
			up: false
		},
		
		middle: {
			down: false,
			pressed: false,
			up: false
		},
		
		right: {
			down: false,
			pressed: false,
			up: false
		},
		
		wheel: {
			up: false,
			down: false
		}
	},
	
	physics: {
		velocity: function(obj,angle,magnitude) {		
			obj.hVelocity = Math.polarToRectX(angle,magnitude);
			obj.vVelocity = Math.polarToRectY(angle,magnitude);
			
			return obj;
		},
		
		accelerate: function(obj,angle,magnitude) {
			obj.hVelocity = (obj.hVelocity || 0)+Math.polarToRectX(angle,magnitude);
			obj.vVelocity = (obj.vVelocity || 0)+Math.polarToRectY(angle,magnitude);

			return obj;
		},
		
		update: function(obj) {
			obj.x += obj.hVelocity;
			obj.y += obj.vVelocity;
			
			return Math.atan2(obj.vVelocity,obj.hVelocity);
		},
		
		jump: function(obj,angle,distance) {
			obj.x += Math.polarToRectX(angle,distance);
			obj.y += Math.polarToRectY(angle,distance);
			
			return obj;
		}
	},

	Sound: function(url) {
		var audObj = new Audio('');
		
		// The actual audio object won't get a src until load is called
		audObj.url = url;
		
		// Queue it to be loaded
		PP.load.soundList[PP.load.soundList.length] = audObj;
		
		return audObj;
	},
	
	SoundEffect: (function() {
		// "Recycle" the audio object for another playing
		var ended = function() {
			this.currentTime = 0;
			this.pause();
		};
		
		return function(url,amount) {
			// amount is the number of audio objects that should be made for this sound effect
			var that = [];
					
			for (var i = 0; i < amount; i++) {
				var audObj = new Audio('');
				audObj.url = url;
				audObj.effect = that;
				that[i] = audObj;
				PP.load.soundList[PP.load.soundList.length] = audObj;
				
				audObj.addEventListener('ended',ended,true);
			}
			
			that.position = 0;
			that.play = function() {
				// Move the next available audio object to the end of the list
				var aud = this[this.position];
				this[this.length] = aud;
				
				// Remove the audio object from the top of the list
				delete this[this.position];
				
				// Update the position so the next audio object will be ready for the next play
				this.position += 1;
				
				aud.play();
				
				return true;
			};
			
			// Stop all the sound effects from playing
			that.stop = function() {
				var pos = this.position,
					len = this.length;
					
				for (var i = pos; i < len; i++) {
					ended.call(this[i]);
				}
				
				return true;
			};
			
			return that;
		};
	}()),

	Sprite: function(url,subimg,xorig,yorig) {
		if (!(this instanceof PP.Sprite)) {
			return new PP.Sprite(url,subimg,xorig,yorig);
		}
		
		this.imgObj = new Image();
		this.url = url;
		this.subimg = subimg;
		this.xorig = xorig;
		this.yorig = yorig;
		
		PP.load.spritesList.push(this);
		
		return this;
	},
	
	view: {	
		x: 0,
		y: 0
	},
		
	walkDown: (function() {
		var isRegistered = function(obj) {
			if (obj != undefined && obj.hasOwnProperty('registered') && obj.registered === true) {
				return true;
			}
			
			return false;
		};
		
		return function(obj,last) {
			var arr = false,
				func = false;
			
			if (typeof last === 'function') {
				func = last;
			} else {
				if (last === true) {
					// A true value means that the function should return a new array
					arr = [];
				} else {
					// An array was (probably) passed as the last parameter. Continue adding the objects to the existing array
					arr = last;
				}
			}
						
			if (isRegistered(obj)) {
				if (arr === false) {
					func.call(obj,obj);
				} else {
					arr[arr.length] = obj;
				}
			}
			
			if (obj != undefined && obj.hasOwnProperty('children')) {
				var len = obj.children.length;
				for (var i = 0; i < len; i++) {
					PP.walkDown(obj.children[i],(arr || func));
				}
			}
			
			return (arr || true);
		};
	}())
};

PP.load.soundList = [];
PP.load.spritesList = [];
PP.Alarm.list = [];

PP.Alarm.prototype.stop = function() {
	this.time = null;
	return this;
};

// Generate the key cache
(function() {
	var prop;
	var key = PP.key;
	for (prop in key) {
		if (PP.key.hasOwnProperty(prop) && prop !== 'cache' && prop !== 'number') {
			PP.key.cache.push(key[prop]);
			PP.key.number[key[prop].code] = key[prop];
			
			// Set key to default properties
			key[prop].down = false;
			key[prop].up = false;
			key[prop].pressed = false;
		}
	}
})();

PP.Sprite.prototype.draw = function(x,y,subimg,angle,hScale,vScale) {
	if (hScale === undefined) {
		hScale = 1;
	}
	
	if (vScale === undefined) {
		vScale = 1;
	}
	
	if (subimg === undefined) {
		subimg = 0;
	}
	
	var imgObj = this.imgObj,
		height = this.height,
	
		subWidth = this.subWidth,
		xx = x-PP.view.x,
		yy = y-PP.view.y;
	
	PP.draw.displayCanvas.ctx.save();
	
	if (angle !== undefined && angle !== 0) {
		PP.draw.displayCanvas.ctx.translate(xx,yy);
		PP.draw.displayCanvas.ctx.rotate(angle);
		PP.draw.displayCanvas.ctx.translate(-xx,-yy);
	}
	
	var drawWidth = Math.abs(hScale)*subWidth,
		drawHeight = Math.abs(vScale)*height;
	
	xx -= this.xorig*Math.abs(hScale);
	yy -= this.yorig*Math.abs(vScale);
	
	if (hScale < 0 && vScale < 0) {
		xx = -xx-drawWidth;
		yy = -yy-drawHeight;
		PP.draw.displayCanvas.ctx.scale(-1,-1);
	} else if (hScale < 0) {
		xx = -xx-drawWidth;
		PP.draw.displayCanvas.ctx.scale(-1,1);
	} else if (vScale < 0) {
		yy = -yy-drawHeight;
		PP.draw.displayCanvas.ctx.scale(1,-1);
	}
	
	PP.draw.displayCanvas.ctx.drawImage(imgObj,subWidth*subimg,0,subWidth,height,xx,yy,drawWidth,drawHeight);
	
	PP.draw.displayCanvas.ctx.restore();

	return this;
};

PP.Sprite.prototype.nextFrame = function(subimg) {
	subimg += 1;
	
	if (subimg === this.subimg) {
		return 0;
	} else {
		return subimg;
	}
};

// PP.view.width
PP.view.watch('width',function(prop,oldvalue,value) {
	PP.draw.displayCanvas.width = value;
	return value;
});

// PP.view.height
PP.view.watch('height',function(prop,oldvalue,value) {
	PP.draw.displayCanvas.height = value;
	return value;
});

// PP.loop.active - determines if the loop is currently running
PP.loop.watch('active',function(prop,oldvalue,value) {
	if (value !== oldvalue) {
		clearInterval(PP.loop.timer);
		if (value === true) {
			PP.loop.timer = setInterval(PP.loop.tick,1000/PP.loop.rate);
		}
	}
	
	return value;
});

// PP.loop.rate - sets loop speed
PP.loop.watch('rate',function(prop,oldvalue,value) {
	if (oldvalue !== value) {
		clearInterval(PP.loop.timer);
		
		if (value >= 0 && PP.loop.active === true) {
			PP.loop.timer = setInterval(PP.loop.tick,1000/value);
		}
	}
	
	return value;
});

// room
PP.loop.watch('room',function(prop,oldvalue,value) {
	var i,obj;
	
	// Stop the loop timer from triggering
	PP.loop.active = false;
	
	// Clear the alarms
	PP.Alarm.list.length = 0;
	
	// Invoke the onRoomChange methods
	for (i = 0; i < PP.loop.regObjects.length; i++) {
		obj = PP.loop.regObjects[i];
		
		if (obj) {
			if (typeof obj.onRoomChange === 'function') {
				obj.onRoomChange(obj);
			}
		}
	}
	
	// Remove all objects except for persistant ones
	for (i = 0; i < PP.loop.regObjects.length; i++) {
		obj = PP.loop.regObjects[i];
		
		if (obj) {
			if (!obj.persistant) {
				PP.loop.remove(obj,true);
				i -= 1;
			}
		}
	}
	
	// Trigger the room
	value.call(value,value);
	
	// Begin the loop timer again
	PP.loop.active = true;
	
	return value;
});

PP.loop.active = false;
PP.loop.rate = 30;
