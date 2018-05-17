/**
 * @fileoverview Blender.js <br />
 * Loads an array of images and blends them in sequence. <br />
 * <br />
 * Requires Prototype  1.6 (http://www.prototypejs.org) or later <br />
 * and Scriptaculous 1.8 (http://script.aculo.us) or later. <br />
 * <br />
 * Widget.Blender is licensed under the Creative Commons Attribution 2.5 South Africa License<br />
 * (more information at: http://creativecommons.org/licenses/by/2.5/za/)<br />
 * Under this license you are free to<br />
 * - to copy, distribute and transmit the work<br />
 * - to adapt the work<br />
 * However you must<br />
 * - You must attribute the work in the manner specified by the author or licensor (but not in any way that suggests that they endorse you or your use of the work).<br />
 * - That is by providing a link back to http://www.eternal.co.za or to the specific script page. This link need not be on the page using the script, or even nescessarily even on the same domain, as long as it's accessible from the site.<br />
 * I'd also like an email telling me where you are using the script, although this is not required. More often than not I will link back to the site using the script.<br />
 * Other than that, you may use this class in any way you like, but don't blame me if things go <br />
 * pear shaped. If you use this library I'd like a mention on your website, but <br />
 * it's not required. If you like it, send me an email. If you find bugs, send <br />
 * me an email. If you don't like it, don't tell me: you'll hurt my feelings. <br />
 * Change History:<br />
 * Version 1.1.0: 7 Dec 2007<br />
 * - Updated script for Prototype 1.6 and Scriptaculous 1.8<br />
 * - Blender is now in the Widget namespace (Widget.Blender).<br />
 * - Blender no longer requires Scriptactulous Builder and uses Prototypes new Element(...) instead.<br />
 * - Minified script and minified single script files added to download.<br />
 * - New license: Creative Commons Attribution 2.5 South Africa License.<br />
 *  see more at: http://creativecommons.org/licenses/by/2.5/za/<br />
 * - new Blender(...) has been deprecated and will be removed in the next major version<br />
 * - Added dir option<br />
 * - Added beforeBlend callback option<br />
 * - Added startIndex option<br />
 * Version 1.0.2: 19 Aug 2007<br />
 * - Updated DOM creation to use Builder.node in all instances<br />
 * - Updated DOM traversal to use Element.up() for parent nodes<br />
 * Version 1.0.1: 15 Aug 2007<br />
 * - Added attributes option<br />
 * - Now requires builder.js from Scriptaculous<br />
 * - Now delays the start call by displayDuration<br />
 * - Fixed a bug that started the blend with the 3rd image in the list<br />
 * Version 1.0.0: 12 Aug 2007<br />
 * - First version<br />
 * @class Blender
 * @version 1.1.0
 * @author Marc Heiligers marc@eternal.co.za http://www.eternal.co.za
 */
if(typeof Widget == "undefined") Widget = {};
Widget.Blender = Class.create();
Widget.Blender.prototype = {
	/**
	 * The Blender class constructor. <br />
	 * @constructor Blender
	 * @param {string|img element} img The id of or actual image element to be faded
	 * @param {array(string)} list  An array of paths (relative or absolute) of the images
	 * @param {object} [options] An object of options.
	 */
	initialize: function(img, list, options) {
		this.img = $(img);
		this.list = list;

		/**
		 * The default options object.
		 * @class
		 * @param {string} [id] The id used as queue scope. (default: img.id)
		 * @param {float} [fadeDuration] The time in seconds of the fade in/out. (default: 2.5)
		 * @param {float} [displayDuration] The time in seconds that the image is not faded out after being faded in. (default: 2.5)
		 * @param {bool} [autoSize] Set true if the image should be sized to it's container. Maintains aspect ratio. (default: false)
		 * @param {bool} [autoStart] If false the Blender will not start until Blender#start is called. (default: true)
		 * @param {bool} [noWrap] If false the Blender will not wrap the image in a div and use the image's parent container. (default: false)
		 * @param {object} [attributes] An associative array of attributes given to the image. (default: {})
		 * @param {string} [dir] The directory that all images reside in. Used as a prefix for the image src. (default: null)
		 * @param {function} [beforeBlend] A function that is called before the images are blended. 2 parameters are passed: 1. the image being faded out; 2. the image being faded in (default: null)
		 * @param {int} [startIndex] The index of the first new image to be shown. (default: 0)
		 */
		this.options = Object.extend({
			id: this.img.id,
			fadeDuration: 2.5,
			displayDuration: 2.5,
			autoSize: false,
			autoStart: true,
			noWrap: false,
			attributes: {},
			dir: "",
			beforeBlend: null,
			startIndex: 0
		}, options || {});

		this.index = this.options.startIndex;
		if(this.options.noWrap) {
			this.container = this.img.up();
		} else {
			this.container = new Element("div").setStyle({ position: "relative", width: this.img.width + "px", height: this.img.height + "px" });
			this.img.up().replaceChild(this.container, this.img);
			this.container.appendChild(this.img);
		}
		this.loadedObserver = this.loaded.bind(this);
		this.nextObserver = this.next.bind(this);

		this.stopped = true;
		if(this.options.autoStart) {
			setTimeout(this.start.bind(this), this.options.displayDuration * 1000);
		}
	},
	/**
	 * Starts the fading if the autoStart option was set to false or after a call to stop.
	 */
	start: function() {
		if(!this.stopped) {
			return;
		}
		this.stopped = false;
		this.next();
	},
	/**
	 * Stops the fading and sets the opacity of the current image to 100%.
	 */
	stop: function() {
		this.stopped = true;
		try { clearTimeout(this.timeout); } catch(ex) { }
		try { Effect.Queues.get(this.options.id).each(function(effect) { effect.cancel() }) } catch(ex) { }
		if(this.oldImg) {
			this.container.removeChild(this.oldImg);
			this.oldImg = null;
		}
		Element.setOpacity(this.img, 1);
	},
	/**
	 * Loads the next image in list
	 * @private
	 */
	next: function() {
		if(this.oldImg) {
			this.container.removeChild(this.oldImg);
		}
		this.oldImg = this.img;
		if(this.stopped || this.list.length == 0) {
			return;
		}
		++this.index;
		if(this.index >= this.list.length) {
			this.index = 0;
		}
		this.img = new Element("img", this.options.attributes);
		this.img.observe("load", this.loadedObserver);
		this.img.src = this.options.dir + this.list[this.index];
	},
	/**
	 * Event listener for image loaded
	 * @private
	 */
	loaded: function() {
		this.img.stopObserving("load", this.loadedObserver);
		if(this.options.autoSize) {
			this.resize(this.img);
		}
		this.img.setOpacity(0);
		this.container.appendChild(this.img);
		this.img.setStyle({ position: "absolute", top: this.container.getStyle("padding-top"), left: this.container.getStyle("padding-left") });
		if(typeof this.options.beforeBlend == "function") {
			this.options.beforeBlend(this.oldImg, this.img);
		}
		new Effect.Opacity(this.oldImg, { duration: this.options.fadeDuration, from: 1.0, to: 0.0, queue: { scope: this.options.id } });
		new Effect.Opacity(this.img, { duration: this.options.fadeDuration, from: 0.0, to: 1.0, queue: { scope: this.options.id } });
		this.timeout = setTimeout(this.nextObserver, (this.options.fadeDuration + this.options.displayDuration) * 1000);
	},
	/**
	 * Resize the image to the container while maintaining aspect ratio
	 * @private
	 */
	resize: function(img) {
		var dim = this.container.getDimensions();
		dim.width -= parseInt(this.container.getStyle("padding-left")) +
			parseInt(this.container.getStyle("padding-right")) +
			parseInt(this.container.getStyle("border-left-width")) +
			parseInt(this.container.getStyle("border-right-width"));
		dim.height -= parseInt(this.container.getStyle("padding-top")) +
			parseInt(this.container.getStyle("padding-bottom")) +
			parseInt(this.container.getStyle("border-top-width")) +
			parseInt(this.container.getStyle("border-bottom-width"));

		var dw = dim.width / img.width;
		var dh = dim.height / img.height;
		var w1 = img.width * dh;
		var h1 = img.height * dw;

		if(dw > dh) {
			img.width = w1;
			img.height = dim.height;
		} else {
			img.width = dim.width;
			img.height = h1;
		}
	}
};
/**
 * @deprecated
 **/
var Blender = Widget.Blender;