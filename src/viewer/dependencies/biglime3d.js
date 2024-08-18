;(function(Namespace, undefined) {
    "use strict";

/**
 * @category Common
 * @classdesc
 * The Logger class provides methods for reporting incidents.
 * 
 * @constructor
 */
Namespace.Logger = function(){};


/** 
 * Severity levels for incidents.
 * @enum {Number} 
 * @readonly
 */
Namespace.Logger.Severity = {
    Debug   : 0,
    Info    : 1,
    Client  : 2,
    Warning : 3,
    Warn    : 3,
    Error   : 4
};
Object.freeze(Namespace.Logger.Severity);


/** 
 * Incidents with severity greather than or equal to this will be printed to the console.
 * @static
 */
Namespace.Logger.ConsoleThresh = Namespace.Logger.Severity.Info;


/** 
 * The maximum number of incidents to keep.
 * (We start discarding the oldest ones once this limit is reached.)
 * @static
 * @private
 */
Namespace.Logger._MaxIncidents = 1000;


/** 
 * A list of the most recent incidents.
 * @static
 * @private
 */
Namespace.Logger._IncidentList = [];


/** 
 * The number of errors reported.
 * @static
 * @private
 */
Namespace.Logger._NumErrors = 0;


/** 
 * The number of warnings reported.
 * @static
 * @private
 */
Namespace.Logger._NumWarnings = 0;

/** 
 * Registers an incident.
 * @static
 * @param {string} msg - A description of the incident.
 * @param {Logger.Severity} severity - The severity of the incident.
 * @param {Boolean} [popup=False] - Whether to display the message in an alert popup .
 * @param {Boolean} [throwError=False] - Whether to throw an error.
 */
Namespace.Logger.Report = function(msg, severity, popup, throwError) 
{
    var Sev = Namespace.Logger.Severity;

    // Validate the arguments
    msg = msg || "";
    if ( !((severity >= Sev.Debug) && (severity <= Sev.Error)) ) {
        severity = Sev.Error;
    }

    // Add the incident to our list
    while (Namespace.Logger._IncidentList.length >= Namespace.Logger._MaxIncidents) {
        Namespace.Logger._IncidentList.shift();
    }
    Namespace.Logger._IncidentList.push( {msg:msg, severity:severity} );
    if (severity === Sev.Error) { Namespace.Logger._NumErrors++; }
    if (severity === Sev.Warn) { Namespace.Logger._NumWarnings++; }

    // Maybe show it in the console
    if (severity >= Namespace.Logger.ConsoleThresh) {
        if (window.console) {
            var reportFunc = 
                (severity <= Sev.Debug) ? window.console.debug : 
                (severity == Sev.Info) || (severity == Sev.Client) ? window.console.info : 
                (severity == Sev.Warn) ? window.console.warn : 
                window.console.error;

            reportFunc = reportFunc || window.console.log;
            if (reportFunc) { reportFunc(msg); }
        }
    }

    // Maybe throw an error
    if (throwError) {
        throw new Error(msg);
    }

    // Maybe show a popup
    if (popup === true) { alert(msg); }
};


/** 
 * Clears the incident list.
 * @static
 *
 */
Namespace.Logger.Clear = function() 
{
    Namespace.Logger._IncidentList = [];
    Namespace.Logger._NumErrors = 0;
    Namespace.Logger._NumWarnings = 0;
};


/** 
 * Gets the number of incidents that have been reported.
 * @static
 *
 */
Namespace.Logger.NumIncidents = function() 
{
    return Namespace.Logger._IncidentList.length;
};


/** 
 * Gets the number of errors that have been reported.
 * @static
 *
 */
Namespace.Logger.NumErrors = function() 
{
    return Namespace.Logger._NumErrors;
};


/** 
 * Gets the number of warnings that have been reported.
 * @static
 *
 */
Namespace.Logger.NumWarnings = function() 
{
    return Namespace.Logger._NumWarnings;
};


/** 
 * Gets the most recent incident.
 * @static
 *
 */
Namespace.Logger.LastIncident = function() 
{
    var len = Namespace.Logger._IncidentList.length;
    return (len > 0) ? Namespace.Logger._IncidentList[len-1] : null;
};


/** 
 * Gets the most recent error message.
 * @static
 *
 */
Namespace.Logger.LastErrorMsg = function() 
{
    for (var i=Namespace.Logger._IncidentList.length-1; i>=0; i--) {
        var incident = Namespace.Logger._IncidentList[i];
        if (incident.severity === Namespace.Logger.Severity.Error) {
            return incident.msg;
        }
    }
    return "";
};


/** 
 * Gets the most recent warning message.
 * @static
 *
 */
Namespace.Logger.LastWarningMsg = function() 
{
    for (var i=Namespace.Logger._IncidentList.length-1; i>=0; i--) {
        var incident = Namespace.Logger._IncidentList[i];
        if (incident.severity === Namespace.Logger.Severity.Warn) {
            return incident.msg;
        }
    }
    return "";
};


/** 
 * Gets the most recent debug message.
 * @static
 *
 */
Namespace.Logger.LastDebugMsg = function() 
{
    for (var i=Namespace.Logger._IncidentList.length-1; i>=0; i--) {
        var incident = Namespace.Logger._IncidentList[i];
        if (incident.severity === Namespace.Logger.Severity.Debug) {
            return incident.msg;
        }
    }
    return "";
};


/** 
 * Gets the most recent info message.
 * @static
 *
 */
Namespace.Logger.LastInfoMsg = function() 
{
    for (var i=Namespace.Logger._IncidentList.length-1; i>=0; i--) {
        var incident = Namespace.Logger._IncidentList[i];
        if (incident.severity === Namespace.Logger.Severity.Info) {
            return incident.msg;
        }
    }
    return "";
};

})( window.BigLime = window.BigLime || {} );







;(function(Namespace, undefined) {
    "use strict";
    
    
/**
 * @category 3D
 * @classdesc
 * The Loader3D class is a base class for all 3D-volume loaders.
 * 
 * @constructor
 */
Namespace.Loader3D = function() {
    this.vol            = null; 
    this.cancelled      = false;
    this.done           = false;  
    this.rgbaBuf        = null;
    this.loadCompleteCb = null;
    this.loadProgressCb = null;
    this.errors         = "";
    this.warnings       = "";    
};


/**
 * Cancels any in-progress loading. 
 * Callbacks will not be invoked.
 * 
 */
Namespace.Loader3D.prototype.cancelLoading = function() 
{ 
    this.cancelled = true;
}


/**
 * Copies image data into a 2D or 3D texture.
 * @private
 * 
 * @param {Object} imgBatch - Image data and descriptors.
 */
Namespace.Loader3D.prototype._copyImagesToTexture = function(imgBatch) 
{
    var errMsg = "";
    if (this.vol instanceof Namespace.VolumeT3) {
        this._copyImagesToTexture3D(imgBatch);
    }
    else if (this.vol instanceof Namespace.VolumeT2){
        this._copyImagesToTexture2D(imgBatch);
    } 
    else {
        errMsg = 'Loader3D: Invalid volume type.';
    }
    return errMsg;
};


/**
 * Copies image data into a 3D texture.
 * @private
 * 
 * @param {Object} imgBatch - Image data and descriptors.
 */
Namespace.Loader3D.prototype._copyImagesToTexture3D = function(imgBatch) 
{
    var vol = this.vol;
    var gl = vol.context.gl;
    var imgWidth  = vol.dims[0];
    var imgHeight = vol.dims[1];
    var pixelFormat = (vol.bpp == 8) ? gl.RED : gl.RG;

    var puBuffer = gl.createBuffer();
    gl.bindBuffer(gl.PIXEL_UNPACK_BUFFER, puBuffer);

    for (var i=imgBatch.startIndex; i<imgBatch.endIndex; i++) 
    {
        var pixelBuffer = imgBatch.imgBuffers[i-imgBatch.startIndex];
        if (pixelBuffer.buffer) { pixelBuffer = pixelBuffer.buffer; }

        // Maybe swap the byte order
        if ( (vol.bpp == 16) && (vol.bigEndian) ) {
            Namespace.Loader3D._SwapByteOrder(pixelBuffer);
        }
    
        // Copy the buffer contents to the texture
        gl.bufferData(gl.PIXEL_UNPACK_BUFFER, pixelBuffer, gl.DYNAMIC_COPY);
        vol.texture.bind();
        gl.texSubImage3D(gl.TEXTURE_3D, 0, 0, 0, i, imgWidth, imgHeight, 1, pixelFormat, gl.UNSIGNED_BYTE, 0);

        // Update the pixel statistics
        vol.histogram.addImage(pixelBuffer, vol.bpp/8, false);
    }
    gl.bindBuffer(gl.PIXEL_UNPACK_BUFFER, null);
    gl.deleteBuffer(puBuffer);
};


/**
 * Copies image data into one of the 2D mosaic textures.
 * @private
 * 
 * @param {Object} imgBatch - Image data and descriptors.
 */
Namespace.Loader3D.prototype._copyImagesToTexture2D = function (imgBatch) {
    var vol = this.vol;
    var imgWidth = vol.dims[0];
    var imgHeight = vol.dims[1];
    var txInfo = vol.txInfo;

    // Copy the pixel data into an RGBA buffer
    if ( !this.rgbaBuf || (this.rgbaBuf.length != 4*imgWidth*imgHeight) ) {
        this.rgbaBuf = new Uint8Array(4*imgWidth*imgHeight);
    }
    if (vol.bpp == 16) {
        this._populateRgbaBuffer_From16bitImages(imgBatch);
    }
    else {
        this._populateRgbaBuffer_From8bitImages(imgBatch);
    }

    // Compute coordinates within the mosaic texture
    var tileIndex = imgBatch.startIndex / txInfo.imgsPerTile;
    var txIndex = Math.floor(tileIndex / (txInfo.NTx * txInfo.NTy));
    var tileIndexRel = tileIndex - txIndex * txInfo.tilesPerTexture;
    var yt = Math.floor(tileIndexRel / txInfo.NTx);
    var xt = tileIndexRel - yt * txInfo.NTx;

    var gl = vol.context.gl;
    vol.textures[txIndex].bind();
    gl.texSubImage2D(gl.TEXTURE_2D, 0, xt*imgWidth, yt*imgHeight, imgWidth, imgHeight, gl.RGBA, gl.UNSIGNED_BYTE, this.rgbaBuf);
};


/**
 * Copies image data into an rgba buffer (16-bit case).
 * @private
 * 
 * @param {Object} imgBatch - Image data and descriptors.
 */
Namespace.Loader3D.prototype._populateRgbaBuffer_From16bitImages = function (imgBatch) {
    var vol = this.vol;
    var imgWidth  = vol.dims[0];
    var imgHeight = vol.dims[1];
    var numPixels = imgWidth * imgHeight;
    var batchSize = imgBatch.endIndex - imgBatch.startIndex;
    
    // Convert TypedArrays to ArrayBuffers if necessary
    var i;
    var imgArrayBuffers = [];
    for (i=0; i<batchSize; i++) {
        imgArrayBuffers.push( imgBatch.imgBuffers[i].buffer || imgBatch.imgBuffers[i] );
    }

    // Zero the border pixels, to prevent artifacts from linear interpolation within the mosaic texture
    var b;
    var lastRowOffset = (imgHeight - 1) * imgWidth;
    for (i=0; i<batchSize; i++)
    {
        var buf = new Uint16Array( imgArrayBuffers[i] );
        for (var y = 0; y < imgHeight; y++) {
            var yw = y * imgWidth;
            buf[yw] = buf[yw + imgWidth - 1] = 0;
        }
        for (var x = 0; x < imgWidth; x++) {
            buf[x] = buf[lastRowOffset + x] = 0;
        }
    }

    // Copy the pixel values into the rgba buffer    
    var bufs = [];
    bufs.push( (batchSize > 0) ? new Uint8Array(imgArrayBuffers[0]) : null ); 
    bufs.push( (batchSize > 1) ? new Uint8Array(imgArrayBuffers[1]) : null );

    var j = 0;
    var n2 = 2*numPixels;
    for (i = 0; i < n2; i += 2)  {
        for (b=0; b<2; b++) {       
            if (bufs[b]) {
                this.rgbaBuf[j++] = vol.bigEndian ? bufs[b][i+1] : bufs[b][i];
                this.rgbaBuf[j++] = vol.bigEndian ? bufs[b][i] : bufs[b][i+1];
            }
            else {
                this.rgbaBuf[j++] = 0;
                this.rgbaBuf[j++] = 0;                
            }                
        }
    }

    // Update the pixel statistics
    for (i=0; i<2; i++) {
        if (i < batchSize) { vol.histogram.addImage(imgArrayBuffers[i], vol.bpp/8, vol.bigEndian); }
    }    
};


/**
 * Copies image data into an rgba buffer (8-bit case).
 * @private
 * 
 * @param {Object} imgBatch - Image data and descriptors.
 */
Namespace.Loader3D.prototype._populateRgbaBuffer_From8bitImages = function (imgBatch) {
    var vol = this.vol;
    var imgWidth  = vol.dims[0];
    var imgHeight = vol.dims[1];
    var numPixels = imgWidth * imgHeight;
    var batchSize = imgBatch.imgBuffers.length;

    // Convert TypedArrays to ArrayBuffers if necessary
    var i;
    var imgArrayBuffers = [];
    for (i=0; i<batchSize; i++) {
        imgArrayBuffers.push( imgBatch.imgBuffers[i].buffer || imgBatch.imgBuffers[i] );
    }
    
    // Zero the border pixels, to prevent artifacts from linear interpolation within the mosaic texture
    var lastRowOffset = (imgHeight - 1) * imgWidth;
    for (i=0; i<batchSize; i++)
    {    
        var buf = new Uint8Array( imgArrayBuffers[i] ); 
        for (var y = 0; y < imgHeight; y++) {
            var yw = y * imgWidth;
            buf[yw] = buf[yw + imgWidth - 1] = 0;
        }
        for (var x = 0; x < imgWidth; x++) {
            buf[x] = buf[lastRowOffset + x] = 0;
        }
    }

    // Copy the pixel values into the rgba buffer
    var bufs = [];
    bufs.push( (batchSize > 0) ? new Uint8Array(imgArrayBuffers[0]) : null ); 
    bufs.push( (batchSize > 1) ? new Uint8Array(imgArrayBuffers[1]) : null );
    bufs.push( (batchSize > 2) ? new Uint8Array(imgArrayBuffers[2]) : null );
    bufs.push( (batchSize > 3) ? new Uint8Array(imgArrayBuffers[3]) : null );

    var j = 0;
    for (i = 0; i < numPixels; i++) {
        for (var b=0; b<4; b++) {      
            this.rgbaBuf[j++] = bufs[b] ? bufs[b][i] : 0;
        }
    }

    // Update the pixel statistics
    for (i=0; i<4; i++) {
        if (i < batchSize) { vol.histogram.addImage(imgArrayBuffers[i], vol.bpp/8, vol.bigEndian); }
    }    
};



/**
 * Changes the endianness of a byte array (in place).
 * @private
 * 
 * @param {Object} buf - the input byte array.
 */
Namespace.Loader3D._SwapByteOrder = function(buf) 
{
    var bytes = new Uint8Array(buf.buffer || buf);
    var len = bytes.length;

    for (var i = 0; i<len; i+=2) {
        var temp = bytes[i];
        bytes[i] = bytes[i+1];
        bytes[i+1] = temp;
    }
};


})( window.BigLime = window.BigLime || {} );







;(function(Namespace, undefined) {
    "use strict";
    var vec2 = glMatrix.vec2;

/**
 * @category 3D
 * @classdesc
 * This is the base class for all Interactors.
 * 
 * @constructor
 * @param {HTMLElement|Array} eventSrc - The html element(s) from which to get pointer and keyboard events.
 * @param {String} [name=""] - A name for the Interactor. 
 * @param {Object|Array} eventTypes - The event types that the interactor should respond to.
 * 
 */
Namespace.Interactor = function(eventSrc, name, eventTypes) 
{ 
	// Cache the input arguments
	this.eventSources = Array.isArray(eventSrc) ? eventSrc : [eventSrc];
	this.name         = name || "";
	this.eventTypes   = eventTypes || {btns:0, shift:false, ctrl:false, alt:false, meta:false};

	// Initialize data members
	this.isTouchDevice = Namespace.Utils.isTouchDevice();

	this.enabled    = true;
	this.active     = false;
	this.pinching   = false;
	this.currNumTouches = 0;
	this.currentEventSource = null;

	this.prevPoint  = vec2.create();
	this.currPoint  = vec2.create();
	this.startPoint = vec2.create();
	this.deltaPrev  = vec2.create();
	this.deltaStart = vec2.create();

	this.prevPinch       = {sep:1, ctr:vec2.create(), ang:0};
	this.currPinch       = {sep:1, ctr:vec2.create(), ang:0};
	this.startPinch      = {sep:1, ctr:vec2.create(), ang:0};
	this.deltaPrevPinch  = {sep:0, ctr:vec2.create(), ang:0};
	this.deltaStartPinch = {sep:0, ctr:vec2.create(), ang:0};

	// Request event notifications from the mouse or touchscreen
	this.pointerDownListener  = this._onStartBase.bind(this);
	this.pointerMoveListener  = this._onMoveBase.bind(this);
	this.pointerUpListener    = this._onEndBase.bind(this);
	this.eventSources.forEach( s => s.addEventListener('pointerdown', this.pointerDownListener) );	
	document.addEventListener('pointermove', this.pointerMoveListener);	
	document.addEventListener('pointerup', this.pointerUpListener);		

};


/**
 * Removes all event listeners that this object has added.
 * 
 */
Namespace.Interactor.prototype.stopListening = function()
{
	this.eventSources.forEach( s => s.removeEventListener('pointerdown',  this.pointerDownListener) );
	document.removeEventListener('pointermove', this.pointerMoveListener);
	document.removeEventListener('pointerup',    this.pointerUpListener);
}


/**
 * Handler for start events.
 * @private
 * 
 * @param {Event} event - Event info.
 * 
 */
Namespace.Interactor.prototype._onStartBase = function(event)
{
	if (!this.enabled || this.active) { return; }
	if (!this.isTouchDevice && !Namespace.Interactor.MouseEventMatches(event, this.eventTypes)) { return; }

	// Cache the initial event location
	this.currentEventSource = event.currentTarget;
	this._updateStateFromEvent(event);
	if (this.currNumTouches >= 1)
	{
		this.active = true;
		vec2.copy(this.startPoint, this.currPoint);
		vec2.copy(this.prevPoint, this.currPoint);
		vec2.set(this.deltaPrev, 0, 0);
		vec2.set(this.deltaStart, 0, 0);
		
		if (this.currNumTouches >= 2) {
			this.pinching = true;
			Namespace.Interactor._copyPinchInfo(this.startPinch, this.currPinch);
			Namespace.Interactor._copyPinchInfo(this.prevPinch,  this.currPinch);
			Namespace.Interactor._zeroPinchInfo(this.deltaPrevPinch);
			Namespace.Interactor._zeroPinchInfo(this.deltaStartPinch);
		}	

		// Maybe invoke the derived class method
		this._onStart ? this._onStart(event) : this.trigger('start', {origEvent:event});
	}
	else {
		this.currentEventSource = null;
	}
	event.preventDefault();	
};
	

/**
 * Handler for move events.
 * @private
 * 
 * @param {Event} event - Event info.
 * 
 */
Namespace.Interactor.prototype._onMoveBase = function(event)
{
	if (!this.enabled || !this.active || !this.currentEventSource) { return; }

	this._updateStateFromEvent(event);

	// Maybe invoke the derived class method
	this._onMove ? this._onMove(event) : this.trigger('move', {origEvent:event});
	
	// Update the 'previous' values
	vec2.copy(this.prevPoint, this.currPoint);
	if (this.currNumTouches >= 2) {
		Namespace.Interactor._copyPinchInfo(this.prevPinch, this.currPinch);
	}

	event.preventDefault();	
};

	
/**
 * Handler for end events (moueup or touchend).
 * @private
 * 
 * @param {Event} event - Event info.
 * 
 */
Namespace.Interactor.prototype._onEndBase = function(event)
{
	if (!this.enabled || !this.active || !this.currentEventSource) { return; }
	
	this._updateStateFromEvent(event);

	// Maybe invoke the derived class method
	this._onEnd ? this._onEnd(event) : this.trigger('end', {origEvent:event});

	this.active = false;	
	this.pinching = false;	
	this.currentEventSource = null;
	event.preventDefault();
};


/**
 * Determines whether an event matches a given event type or set of event types.
 *
 * @static
 * @param {Event} event - The event to check.
 * @param {Object|Array} eventTypes - The event type(s) to check against. The expected format
 *   is `[{btns: [0, 2], shift: true, ctrl: undefined, alt: false, meta: false}`, ...].
 * 
 */
Namespace.Interactor.MouseEventMatches = function(event, eventTypes)
{
	if (!eventTypes) { return false; }
    if (!Array.isArray(eventTypes)) { eventTypes = [eventTypes]; }
        
	for (const eventType of eventTypes) {
		
		let btns = Array.isArray(eventType.btns) ? eventType.btns : [eventType.btns];
		if (!btns.some(btn => btn === event.button)) { continue; }

		if (((eventType.shift === undefined) || (eventType.shift === event.shiftKey)) && 
            ((eventType.ctrl  === undefined) || (eventType.ctrl  === event.ctrlKey))  &&
            ((eventType.alt   === undefined) || (eventType.alt   === event.altKey))   &&
		    ((eventType.meta  === undefined) || (eventType.meta  === event.metaKey))) { return true; }
	}
	return false;
};


/**
 * Updates the current point and the deltas, from the given event coordinates.
 * @private
 * 
 * @param {Event} event - Event info.
 * 
 */
Namespace.Interactor.prototype._updateStateFromEvent = function(event)
{
	// Read the event coordinates
	var coords = Namespace.Interactor._getEventCoordinates(event);
	if ( (coords[0] === null) || (coords[1] === null) ) {
		this.currNumTouches = 0;
		return;
	}

	// Convert to relative coordinates
	this.currNumTouches = 1;
	var rect = this.currentEventSource.getBoundingClientRect();
	vec2.set(this.currPoint, coords[0] - rect.left, coords[1] - rect.top);

	// Update the deltas
	vec2.subtract(this.deltaPrev, this.currPoint, this.prevPoint);
	vec2.subtract(this.deltaStart, this.currPoint, this.startPoint);

	// Update the pinch deltas as well
	if ( (coords[2] !== null) && (coords[3] !== null) )
	{
		this.currNumTouches = 2;
		var Ax = coords[0];
        var Ay = coords[1];		
        var Bx = coords[2];
        var By = coords[3];		

        vec2.set( this.currPinch.ctr, (Ax+Bx)/2, (Ay+By)/2 );
		this.currPinch.sep = Math.sqrt( (Bx-Ax)*(Bx-Ax) + (By-Ay)*(By-Ay) );
		this.currPinch.ang = Math.atan2(Ay-By, Bx-Ax);
		
		vec2.subtract(this.deltaPrevPinch.ctr, this.currPinch.ctr, this.prevPinch.ctr);
		vec2.subtract(this.deltaStartPinch.ctr, this.currPinch.ctr, this.startPinch.ctr);	
		this.deltaPrevPinch.sep  = this.currPinch.sep - this.prevPinch.sep;
		this.deltaStartPinch.sep = this.currPinch.sep - this.startPinch.sep;
		this.deltaPrevPinch.ang  = this.currPinch.ang - this.prevPinch.ang;
		this.deltaStartPinch.ang = this.currPinch.ang - this.startPinch.ang;
	}
};


/**
 * Gets the coordinates of a given event.
 * @private
 * 
 * @param {Event} event - Event info.
 * 
 */
Namespace.Interactor._getEventCoordinates = function(event)
{
	// Read the event coordinates
	var cx1 = event.clientX;
	var cy1 = event.clientY;
	var cx2 = null;
	var cy2 = null;  

	if ( (typeof(cx1) == 'undefined') || (typeof(cy1) == 'undefined') || (cx1 === null) || (cy1 === null)) {
		var targetTouches = event.targetTouches;
		if (!targetTouches && event.originalEvent) { targetTouches = event.originalEvent.targetTouches; }
		if ( targetTouches ) { 
			if (targetTouches.length > 0)  {
				cx1 = targetTouches[0].clientX;
				cy1 = targetTouches[0].clientY;
			}
			if (targetTouches.length > 1)  {
				cx2 = targetTouches[1].clientX;
				cy2 = targetTouches[1].clientY;
			}
		}
	}

	if ( (typeof(cx1) == 'undefined') || (typeof(cy1) == 'undefined') ) {
		cx1 = cy1 = cx2 = cy2 = null;
	}
	return [cx1, cy1, cx2, cy2];
};


/**
 * Utility method for copying Pinch information.
 * @private
 * 
 * @param {Object} target - The target of the copy operation.
 * @param {Object} source - The source of the copy operation.
 * 
 */
Namespace.Interactor._copyPinchInfo = function (target, source)
{
	target.sep = source.sep;
	target.ang = source.ang;
	vec2.copy(target.ctr, source.ctr);
};


/**
 * Utility method for zeroing Pinch information.
 * @private
 * 
 * @param {Object} target - The Pinch object to zero.
 * 
 */
Namespace.Interactor._zeroPinchInfo = function (target)
{
	target.sep = 0.0;
	target.ang = 0.0;
	vec2.set(target.ctr, 0, 0);
};


/**
 * Attaches an event handler.
 * 
 * @param {String} name - The name of the event.
 * @param {Function} fn - The function to call when the event occurs.
 * 
 */
Namespace.Interactor.prototype.addEventListener = function(eventName, fn)
{
	Namespace.Notifier.prototype.addEventListener.call(this, eventName, fn);
};


/**
 * Removes an event handler.
 * 
 * @param {String} name - The name of the event.
 * @param {Function} fn - The handler function to remove.
 * 
 */
Namespace.Interactor.prototype.removeEventListener = function(eventName, fn)
{
	Namespace.Notifier.prototype.removeEventListener.call(this, eventName, fn);
};


/**
 * Fires a specified event.
 * 
 * @param {String} name - The name of the event to fire.
 * 
 */
Namespace.Interactor.prototype.trigger = function(eventName, args)
{
	Namespace.Notifier.prototype.trigger.call(this, eventName, args);
};


})( window.BigLime = window.BigLime || {} );







;(function(Namespace, undefined) {
    "use strict";
    var vec3 = glMatrix.vec3;

/**
 * @category 3D
 * @classdesc
 * A mesh-based shape that can be embedded in a rendered volume.
 * 
 * @constructor
 * @param {Array} vertices - An array of 3d points that specify the Mesh's vertex locations.
 * @param {Array} [normals=auto normals] - An array of 3d vectors that specify the Mesh's vertex normals.
 * @param {Material} [material=default Material] - A Material object that determines the Mesh's appearance.
 * @param {String} [name=""] - A name for the Mesh.
 * @param {Number} [layer=0] - A layer index. Meshes in different layers can be transparent to one another.
 */
Namespace.Mesh = function(vertices, normals, material, name, layer) 
{ 
    this.vertices = vertices || [];
    this.material = material || new Namespace.Material();
    this.normals  = normals || Namespace.Mesh.calcNormals(vertices, this.material.flatShade);
    this.name     = name || "";
    this.layer    = layer || 0;
    this.visible  = true;

    this.updateVertexBuffers();
};


/**
 * Builds the vertex buffers needed by Webgl, based on our current vertices.
 * 
 */
Namespace.Mesh.prototype.updateVertexBuffers = function() 
{
    // this.vertices should be an array of 3-component vectors. We convert it to a flat Float32 array
    var i, i3;
    var numVertices = this.vertices.length; 
    this.vBuffer = new Float32Array(3*numVertices);
    for (i=0; i<numVertices; i++) {
        i3 = 3*i;
        var vec = this.vertices[i];
        this.vBuffer[i3]   = vec[0]; 
        this.vBuffer[i3+1] = vec[1]; 
        this.vBuffer[i3+2] = vec[2]; 
    }
    
    // Similarly, convert the normals to a flat Float32 array
    this.nBuffer = new Float32Array(3*numVertices);
    for (i=0; i<numVertices; i++) {
        i3 = 3*i;
        var nrm = this.normals[i];
        this.nBuffer[i3]   = nrm[0]; 
        this.nBuffer[i3+1] = nrm[1]; 
        this.nBuffer[i3+2] = nrm[2]; 
    }

    // Since the number of vertices may have changed, we need to update the attribute buffers as well
    this.updateAttributeBuffers();    
};



/**
 * Builds the attribute buffers needed by Webgl, based on our current material.
 * 
 */
Namespace.Mesh.prototype.updateAttributeBuffers = function() 
{
    var i, i4;
    var numVertices = this.vertices.length; 
    
    // Create our array of vertex colors
    this.cBuffer = new Float32Array(4*numVertices);
    var color = this.material.color.slice();
    for (var n=0; n<4; n++) { color[n] /= 255.0; }
    for (i=0; i<numVertices; i++) {
        i4 = 4*i;
        this.cBuffer[i4]   = color[0];   
        this.cBuffer[i4+1] = color[1];   
        this.cBuffer[i4+2] = color[2];   
        this.cBuffer[i4+3] = color[3];        
    }

    // Create our array of material properties
    this.mBuffer = new Float32Array(4*numVertices);
    var ambient      = Math.max(0.0, Math.min(1.0, this.material.ambient));
    var diffuse      = Math.max(0.0, Math.min(1.0, this.material.diffuse));
    var specStrength = Math.max(0.0, Math.min(1.0, this.material.specStrength));
    var specPower    = Math.max(0.0, Math.min(1.0, this.material.specPower/255));
    for (i=0; i<numVertices; i++) {
        i4 = 4*i;
        this.mBuffer[i4]   = ambient;   
        this.mBuffer[i4+1] = diffuse;   
        this.mBuffer[i4+2] = specStrength;   
        this.mBuffer[i4+3] = specPower;        
    }
};



/**
 * Computes the normal vector at each vertex, optionally by averaging the face normals.
 * 
 * @param {Array} vertices - An array of 3d vertices.
 * @param {Boolean} flatShade - If true, then the face normals not be averaged.
 * @param {Number} [gouraudThresh=0.5] - If the dot product of adjacent face normals is greater than
 *   this threshold, then those normals will not be averaged (thereby preserving sharp edges).
 */
Namespace.Mesh.calcNormals = function(vertices, flatShade, gouraudThresh) 
{ 
    var numVertices  = vertices ? vertices.length : 0;
    var numTriangles = numVertices/3;
    var normals = [];

    // For each triangle, compute its perpendicular 
    var vba = vec3.create();
    var vca = vec3.create();
    var i, i3, j, key;
    for (i=0; i<numTriangles; i++) 
    {
        i3 = 3*i;
        vec3.subtract(vba, vertices[i3+1], vertices[i3]);
        vec3.subtract(vca, vertices[i3+2], vertices[i3]);
        var nrm = vec3.create();
        vec3.cross(nrm, vba, vca);
        vec3.normalize(nrm, nrm);
        if (vec3.squaredLength(nrm) < 0.99) { 
            Namespace.Logger.Report("Invalid triangle supplied to Mesh.calcNormals.", Namespace.Logger.Severity.Warning); 
        }
        normals.push(nrm, nrm, nrm);  // Assign the perp vector to each vertex of the triangle
    }

    // For smooth shading, we need to average the normals at shared vertices
    if (!flatShade)
    {
        // Find shared vertices
        var vMap = {};
        for (i=0; i<numVertices; i++) 
        {
            var vertex = vertices[i];
            key = [vertex[0].toFixed(5), vertex[1].toFixed(5), vertex[2].toFixed(5)];
            if (vMap[key] === undefined) {
                vMap[key] = [i];
            } else {
                vMap[key].push(i);
            }
        }

        // Replace the normals in each shared vertex group with their average
        var gt = (gouraudThresh || (gouraudThresh === 0)) ? gouraudThresh : 0.5;
        for (key in vMap) 
        {
            var sharedVertexGroup = vMap[key].slice();
            while (sharedVertexGroup.length > 1) {
                var subGroup = [ sharedVertexGroup[0] ];
                sharedVertexGroup.splice(0,1);
                var refNormal = normals[ subGroup[0] ];
                for (i=0; i<sharedVertexGroup.length; i++) {
                    // Don't average if the normals are very different
                    if ( vec3.dot(refNormal, normals[sharedVertexGroup[i]]) >= gt ) {
                        subGroup.push( sharedVertexGroup[i] );
                        sharedVertexGroup.splice(i,1);
                        i--;
                    }
                }
                if (subGroup.length > 1) {
                    var faceNormals = [];
                    for (i=0; i<subGroup.length; i++) {
                        var faceNormal = normals[ subGroup[i] ];
                        // Don't let multiple parallel faces overweight the average normal 
                        var dup = false; 
                        for (j=0; j<faceNormals.length; j++) {                      
                            if (vec3.dot(faceNormal, faceNormals[j]) > 0.9999) {
                                dup = true;  
                                break;
                            } 
                        }
                        if (!dup) { faceNormals.push(faceNormal); }
                    }
                    var avgNormal = vec3.create();
                    for (i=0; i<faceNormals.length; i++) { 
                        vec3.add(avgNormal, avgNormal, faceNormals[i]); 
                    }
                    vec3.normalize(avgNormal, avgNormal);
                    if (vec3.squaredLength(avgNormal) > 0.5) { 
                        for (i=0; i<subGroup.length; i++) { normals[ subGroup[i] ] = avgNormal; }
                    }    
                }   
            }
        }     
    }
    return normals;
};



/**
 * Sets the material for the Mesh.
 * 
 * @param {Material} material - The material to set.
 */
Namespace.Mesh.prototype.setMaterial = function(material)
{
    // If the passed-in material is just a color, then supply default material properties
    if (!material) { material = [255,0,0]; }
    if (material instanceof Namespace.Color) { material = material.toArray(); }
    if ( $.isArray(material) ) { 
        material = new Namespace.Material(material, false, 0.4, 0.25, 0, 0); // default material properties
    }
    this.material = material.clone();

    // Update my attribute buffers
    this.updateAttributeBuffers();
};


/**
 * Gets the number of vertices in the Mesh.
 * 
 */
Namespace.Mesh.prototype.numVertices = function() 
{
    return this.vertices.length;
};


 
/**
 * Creates a box Mesh. 
 * 
 * @param {Vec3} center - The center of the box.
 * @param {Vec3} dims - The dimensions of the box.
 * @param {Array} [axes=((1,0,0),(0,1,0),(0,0,1))] - The box axes.
 * @param {Material} material - The box material.
 * @param {String} [name=""] - A name for the Mesh.
 * @param {Number} [layer=0] - The Mesh layer index.
 */
Namespace.Mesh.Box = function(center, dims, axes, material, name, layer) 
{ 
    // Create scaled axis vectors (supply default ones if necessary).
    if (!axes) { axes = [[1,0,0], [0,1,0], [0,0,1]]; }
    var scaledAxes = [vec3.create(), vec3.create(), vec3.create()];
    for (var i=0; i<3; i++) { 
        vec3.scale( scaledAxes[i], axes[i], 0.5*dims[i]/vec3.length(axes[i]) ); 
    }

    // Cmpute the vertex locations
    var v0 = vec3.create();   var v1 = vec3.create();
    var v2 = vec3.create();   var v3 = vec3.create();
    var v4 = vec3.create();   var v5 = vec3.create();
    var v6 = vec3.create();   var v7 = vec3.create();
    vec3.scaleAndAdd(v0, center, scaledAxes[0], -1);  vec3.scaleAndAdd(v0, v0, scaledAxes[1],  1);  vec3.scaleAndAdd(v0, v0, scaledAxes[2], -1);
    vec3.scaleAndAdd(v1, center, scaledAxes[0],  1);  vec3.scaleAndAdd(v1, v1, scaledAxes[1],  1);  vec3.scaleAndAdd(v1, v1, scaledAxes[2], -1);
    vec3.scaleAndAdd(v2, center, scaledAxes[0],  1);  vec3.scaleAndAdd(v2, v2, scaledAxes[1], -1);  vec3.scaleAndAdd(v2, v2, scaledAxes[2], -1);
    vec3.scaleAndAdd(v3, center, scaledAxes[0], -1);  vec3.scaleAndAdd(v3, v3, scaledAxes[1], -1);  vec3.scaleAndAdd(v3, v3, scaledAxes[2], -1);
    vec3.scaleAndAdd(v4, center, scaledAxes[0], -1);  vec3.scaleAndAdd(v4, v4, scaledAxes[1],  1);  vec3.scaleAndAdd(v4, v4, scaledAxes[2],  1);
    vec3.scaleAndAdd(v5, center, scaledAxes[0],  1);  vec3.scaleAndAdd(v5, v5, scaledAxes[1],  1);  vec3.scaleAndAdd(v5, v5, scaledAxes[2],  1);
    vec3.scaleAndAdd(v6, center, scaledAxes[0],  1);  vec3.scaleAndAdd(v6, v6, scaledAxes[1], -1);  vec3.scaleAndAdd(v6, v6, scaledAxes[2],  1);
    vec3.scaleAndAdd(v7, center, scaledAxes[0], -1);  vec3.scaleAndAdd(v7, v7, scaledAxes[1], -1);  vec3.scaleAndAdd(v7, v7, scaledAxes[2],  1);

    // Enumerate the triangle vertices
    var vertices = [ v0,v1,v2, v0,v2,v3, v5,v4,v7, v5,v7,v6, 
                     v4,v0,v7, v0,v3,v7, v1,v6,v2, v1,v5,v6, 
                     v6,v7,v3, v6,v3,v2, v4,v5,v0, v5,v1,v0 ];

    return new Namespace.Mesh(vertices, null, material, name, layer);
};


/**
 * Creates a cylinder Mesh. 
 * 
 * @param {Vec3} center - The center of the cylinder.
 * @param {Number} radius - The radius of the cylinder.
 * @param {Number} length - The length of the cylinder.
 * @param {Vec3} axis - The axis of the cylinder.
 * @param {Number} [phiCount=24] - The number of faces to use.
 * @param {Material} [material=default] - The cylinder material.
 * @param {String} [name=""] - A name for the Mesh.
 * @param {Number} [layer=0] - The Mesh layer index.
 */
Namespace.Mesh.Cylinder = function(center, radius, length, axis, phiCount, material, name, layer) 
{ 
    material = material || new Namespace.Material();
    axis = vec3.clone(axis);   
    vec3.normalize(axis, axis);

    var pa, pb; // Perpendicular axes
    if (Math.abs(axis[0]) > 0.5) {
        pa = vec3.fromValues(-axis[2], 0, axis[0]);
    } else if (Math.abs(axis[1]) > 0.5) {
        pa = vec3.fromValues(-axis[1], axis[0], 0);
    } else {
        pa = vec3.fromValues(0, -axis[2], axis[1]);
    }
    vec3.normalize(pa,pa);
    pb = vec3.create();
    vec3.cross(pb, axis, pa);

    // Compute vertices
    var sideVertices = [];
    var topVertices = [];       
    var btmVertices = [];       
    phiCount = Math.max(3, (phiCount || 24));
    var deltaPhi = 2.0*Math.PI/phiCount;
    var ip;
  
    var topCenter = vec3.create();
    var btmCenter = vec3.create();
    vec3.scaleAndAdd(topCenter, center, axis, length/2);
    vec3.scaleAndAdd(btmCenter, center, axis, -length/2);
    var topPts = [];
    var btmPts = [];    
    for (ip=0; ip<phiCount; ip++)
    {
        var phi = ip*deltaPhi;
        var cosPhi = Math.cos(phi);
        var sinPhi = Math.sin(phi);

        var tp = vec3.clone(topCenter);
        vec3.scaleAndAdd(tp, tp, pa, radius*cosPhi);
        vec3.scaleAndAdd(tp, tp, pb, radius*sinPhi);
        topPts.push(tp);
        
        var bp = vec3.clone(btmCenter);
        vec3.scaleAndAdd(bp, bp, pa, radius*cosPhi);
        vec3.scaleAndAdd(bp, bp, pb, radius*sinPhi);
        btmPts.push(bp);
    }

    for (ip=0; ip<phiCount; ip++) 
    {
        var ipn = (ip+1)%phiCount;
        sideVertices.push( topPts[ip], btmPts[ipn], topPts[ipn] );
        sideVertices.push( topPts[ip], btmPts[ip], btmPts[ipn] );
        btmVertices.push( topCenter, topPts[ip], topPts[ipn] );
        btmVertices.push( btmCenter, btmPts[ipn], btmPts[ip] );
    }
    

    // Compute the normals
    var sideNormals = Namespace.Mesh.calcNormals(sideVertices, material.flatShade);
    var topNormals  = Namespace.Mesh.calcNormals(topVertices, true);
    var btmNormals  = Namespace.Mesh.calcNormals(btmVertices, true);

    var vertices = sideVertices.concat(topVertices).concat(btmVertices);
    var normals = sideNormals.concat(topNormals).concat(btmNormals);
    return new Namespace.Mesh(vertices, normals, material, name, layer);
};


/**
 * Creates a cone Mesh. 
 * 
 * @param {Vec3} apex - The position of the apex of the cone.
 * @param {Number} radius - The radius of the base of the cone.
 * @param {Number} length - The length of the cone.
 * @param {Vec3} axis - The axis of the cone.
 * @param {Number} phiCount - The number of faces along the phi direction.
 * @param {Number} zCount - The number of faces along the z direction.
 * @param {Material} material - The cone material.
 * @param {String} [name=""] - A name for the Mesh.
 * @param {Number} [layer=0] - The Mesh layer index.
 */
Namespace.Mesh.Cone = function(apex, radius, length, axis, phiCount, zCount, material, name, layer) 
{ 
    apex = vec3.clone(apex);
    axis = vec3.clone(axis);   
    vec3.normalize(axis, axis);
    material = material || new Namespace.Material();

    var pa, pb; // Perpendicular axes
    if (Math.abs(axis[0]) > 0.5) {
        pa = vec3.fromValues(-axis[2], 0, axis[0]);
    } else if (Math.abs(axis[1]) > 0.5) {
        pa = vec3.fromValues(-axis[1], axis[0], 0);
    } else {
        pa = vec3.fromValues(0, -axis[2], axis[1]);
    }
    vec3.normalize(pa,pa);
    pb = vec3.create();
    vec3.cross(pb, axis, pa);

    // Compute vertices
    var sideVertices = [];
    var btmVertices = [];       
    phiCount = Math.max(3, phiCount);
    zCount = Math.max(1, zCount);
    var deltaPhi = 2.0*Math.PI/phiCount;
    var deltaZ = length/zCount;
    var ip;
    for (var iz=0; iz<zCount; iz++)
    {    
        var topCenter = vec3.create();
        var btmCenter = vec3.create();
        vec3.scaleAndAdd(topCenter, apex, axis, -iz*deltaZ);
        vec3.scaleAndAdd(btmCenter, apex, axis, -(iz+1)*deltaZ);
        var topRadius = (iz === 0) ? 0.01 : (iz*radius)/zCount;
        var btmRadius = ((iz+1)*radius)/zCount;

        var topPts = [];
        var btmPts = [];    
        for (ip=0; ip<phiCount; ip++)
        {
            var phi = ip*deltaPhi;
            var cosPhi = Math.cos(phi);
            var sinPhi = Math.sin(phi);

            var tp = vec3.clone(topCenter);
            vec3.scaleAndAdd(tp, tp, pa, topRadius*cosPhi);
            vec3.scaleAndAdd(tp, tp, pb, topRadius*sinPhi);
            topPts.push(tp);
            
            var bp = vec3.clone(btmCenter);
            vec3.scaleAndAdd(bp, bp, pa, btmRadius*cosPhi);
            vec3.scaleAndAdd(bp, bp, pb, btmRadius*sinPhi);
            btmPts.push(bp);
        }

        for (ip=0; ip<phiCount; ip++) 
        {
            var ipn = (ip+1)%phiCount;
            sideVertices.push( topPts[ip], btmPts[ipn], topPts[ipn] );
            sideVertices.push( topPts[ip], btmPts[ip], btmPts[ipn] );

            if (iz == zCount-1) {
                btmVertices.push( btmCenter, btmPts[ipn], btmPts[ip] );
            }
        }
    }

    // Compute the normals
    var sideNormals = Namespace.Mesh.calcNormals(sideVertices, material.flatShade);
    var btmNormals  = Namespace.Mesh.calcNormals(btmVertices, true);

    var vertices = sideVertices.concat(btmVertices);
    var normals = sideNormals.concat(btmNormals);
    return new Namespace.Mesh(vertices, normals, material, name, layer);
};


/**
 * Creates a sphere Mesh. 
 * 
 * @param {Vec3} center - The center of the sphere.
 * @param {Number} radius - The radius of the sphere.
 * @param {Number} phiCount - The number of faces along the phi direction.
 * @param {Number} thetaCount - The number of faces along the theta direction.
 * @param {Material} material - The sphere material.
 * @param {String} [name=""] - A name for the Mesh.
 * @param {Number} [layer=0] - The Mesh layer index.
 */
Namespace.Mesh.Sphere = function(center, radius, phiCount, thetaCount, material, name, layer) 
{
    // Compute points  
    var pts = [];
    var it, ip, ipn;
    phiCount = Math.max(3, phiCount);
    thetaCount = Math.max(3, thetaCount);    
    var deltaPhi = 2.0*Math.PI/phiCount;
    var deltaTheta = (Math.PI)/(thetaCount-1);
    for (it=0; it<thetaCount; it++)
    {   
        var theta = it*deltaTheta;
        var z = center[2] + radius*Math.cos(theta);
        var rho = radius*Math.sin(theta);
        for (ip=0; ip<phiCount; ip++)
        {
            var phi = ip*deltaPhi;
            var x = rho*Math.cos(phi) + center[0];
            var y = rho*Math.sin(phi) + center[1];
            pts.push( [x,y,z] );
        }
    }

    // Group the points into triangles
    var vertices = [];
    for (it=0; it<thetaCount-1; it++) 
    {
        var ot = it*phiCount;
        var ob = (it+1)*phiCount;
        if (it === 0) {
            for (ip=0; ip<phiCount; ip++) {
                ipn = (ip + 1) % phiCount;
                vertices.push(pts[ip+ot], pts[ip+ob], pts[ipn+ob]);
            }         
        }
        else if (it === thetaCount-2) {
            for (ip=0; ip<phiCount; ip++) {
                ipn = (ip + 1) % phiCount;
                vertices.push(pts[ip+ot], pts[ip+ob], pts[ipn+ot]);
            }                     
        }
        else {
            for (ip=0; ip<phiCount; ip++) {
                ipn = (ip + 1) % phiCount;
                vertices.push(pts[ip+ot], pts[ip+ob], pts[ipn+ot]);
                vertices.push(pts[ipn+ot], pts[ip+ob], pts[ipn+ob]);
            }             
        }
    }

    return new Namespace.Mesh(vertices, null, material, name, layer);
};


})( window.BigLime = window.BigLime || {} );







;(function(Namespace, undefined) {
    "use strict";
    var Sev = Namespace.Logger.Severity;

/**
 * @category 3D
 * @classdesc
 * An AttributeBuffer is used for storing vertex attributes.
 * 
 * @constructor
 * @param {GLContext} context - The rendering context.
 * @param {Array} data - The data to be stored in the buffer.
 * @param {Number} [attrDim=3] - The number of components per attribute. Must be 1, 2, 3, or 4.
 * @param {Object} [options] - Optional parameters. 
 * @param {GLenum} options.dataType=gl.FLOAT - The buffer's data type (gl.FLOAT, gl.BYTE, gl.SHORT, gl.UNSIGNED_BYTE, gl.UNSIGNED_SHORT, or gl.HALF_FLOAT)
 * @param {GLenum} options.drawMode=gl.STATIC_DRAW - A data-usage hint for WebGL (gl.STATIC_DRAW, gl.DYNAMIC_DRAW, or gl.STREAM_DRAW)
 * @param {Boolean} options.normalizeValues=false - Whether to normalize integer data values when casting to float. 
 */
Namespace.AttributeBuffer = function(context, data, attrDim, options) 
{ 
    options = options || {};
    attrDim = attrDim || 3;

    // Initialize members
    var gl = context.gl;
    this.context         = context;    
    this.attrDim         = attrDim;
    this.drawMode        = options.drawMode || gl.STATIC_DRAW;  
    this.dataType        = options.dataType || gl.FLOAT; 
    this.normalizeValues = !!options.normalizeValues;
    this.bytesPerVertex  = attrDim * this.context.sizeOf(this.dataType);
    this.numBytes        = 0;
    this.glBuffer        = null;

    // Check the input
    if ( (attrDim !== 1) && (attrDim !== 2) && (attrDim !== 3) && (attrDim !== 4) ) {
        Namespace.Logger.Report("AttributeBuffer.ctor: Invalid attribute dimension.", Sev.Error);
        return;
    }
    var aData = this._coerceData(data);
    if (!aData) {
        Namespace.Logger.Report("AttributeBuffer.ctor: Invalid data array.", Sev.Error);
        return;
    }
    this.numBytes = aData.buffer ? aData.buffer.byteLength : aData.byteLength;

    // Fill a WebGL buffer with the supplied data
    this.glBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.glBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, aData, this.drawMode);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
};


/**
 * Deletes the buffer.
 * 
 */
Namespace.AttributeBuffer.prototype.destroy = function() 
{ 
    // Check if we are already destroyed
    if (!this.context) { return; } 
    
    // Clean up
    if (this.glBuffer) {
        var gl = this.context.gl;
        gl.bindBuffer(gl.ARRAY_BUFFER, this.glBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, 1, gl.STATIC_DRAW); // Set buffer size to the smallest allowed value before deleting.
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        gl.deleteBuffer(this.glBuffer);
        this.glBuffer = null;
    }
    this.context = null;
};


/**
 * Tries to coerce a given data array to this buffer's data type.
 * 
 * @param {Array} data - The data to convert.
 */
Namespace.AttributeBuffer.prototype._coerceData = function(data) 
{ 
    var gl = this.context.gl;
    try 
    {
        if (this.dataType === gl.FLOAT) {
            return (data instanceof Float32Array) ? data : new Float32Array(data);
        }
        else if (this.dataType === gl.UNSIGNED_SHORT) {
            return (data instanceof Uint16Array) ? data : new Uint16Array(data);
        }
        else if (this.dataType === gl.UNSIGNED_BYTE) {
            return (data instanceof Uint8Array) ? data : new Uint8Array(data);
        }
        else if (this.dataType === gl.SHORT) {
            return (data instanceof Int16Array) ? data : new Int16Array(data);
        }
        else if (this.dataType === gl.BYTE) {
            return (data instanceof Int8Array) ? data : new Int8Array(data);
        }
        else if ((this.context.glVersion > 1) && (this.dataType === gl.HALF_FLOAT)) {
            // For HALF_FLOAT data, the client is responsible for packing the 16-bit floats, probably into a Uint16Array or Uint32Array.
            return data; 
        }
    }
    catch (err) { }

    return null;
};


/**
 * Sets the buffer's data (reallocates the buffer to fit the data size).
 * 
 * @param {ArrayBuffer} newData - The new data to set in the buffer.
 */
Namespace.AttributeBuffer.prototype.setData = function(newData) 
{ 
    var cData = this._coerceData(newData);   
    if (!cData) {
        Namespace.Logger.Report("AttributeBuffer.setData: Invalid data array.", Sev.Error);
        return;
    } 
    this.numBytes = cData.buffer ? cData.buffer.byteLength : cData.byteLength;

    var gl = this.context.gl;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.glBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, cData, this.drawMode);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
};


/**
 * Modifies the buffer's data.
 * 
 * @param {ArrayBuffer} newData - The new data to set in the buffer. (It must fit in the current buffer size.)
 * @param {Number} [offset=0] - The offset in bytes where the data replacement will start.
 */
Namespace.AttributeBuffer.prototype.subData = function(newData, offset) 
{ 
    var cData = this._coerceData(newData);   
    if (!cData) {
        Namespace.Logger.Report("AttributeBuffer.subData: Invalid data array.", Sev.Error);
        return;
    } 

    var gl = this.context.gl;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.glBuffer);
    gl.bufferSubData(gl.ARRAY_BUFFER, (offset || 0), cData); // WebGL will raise an error if newData is invalid or too large
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
};


})( window.BigLime = window.BigLime || {} );







;(function(Namespace, undefined) {
    "use strict";
    


/** 
 * The supported 3D-interpolation types.
 * @enum {Number} 
 * @readonly
 * @global
 */
Namespace.Interp3D = {

    /** Nearest neighbor */
    NN : 1,

    /** Linear in x,y, and nearest neighbor in z */
    BiLinear : 2,

    /** Linear in x,y,z */
    TriLinear : 3

};
Object.freeze(Namespace.Interp3D);



/** 
 * The supported rendering types.
 * @enum {Number} 
 * @readonly
 * @global
 */
Namespace.RenderType = {

    /** Maximum intensity projection */
    MIP : 1,

    /** Volume rendering */
    VR  : 2,
    
    /** X-ray projection */
    XRAY  : 3
    
};
Object.freeze(Namespace.RenderType);


})( window.BigLime = window.BigLime || {} );







;(function(Namespace, undefined) {
  "use strict";
  

/**
 * This namespace contains WebGL debugging utilities from Khronos.
 *
 */
Namespace.DebugUtils = function() {

// Export the copyright notice string so it will be included even in minimized builds.
var copyright = 
    '/*\n' +
    '** Copyright (c) 2012 The Khronos Group Inc.\n' +
    '**\n' +
    '** Permission is hereby granted, free of charge, to any person obtaining a\n' +
    '** copy of this software and/or associated documentation files (the\n' +
    '** "Materials"), to deal in the Materials without restriction, including\n' +
    '** without limitation the rights to use, copy, modify, merge, publish,\n' +
    '** distribute, sublicense, and/or sell copies of the Materials, and to\n' +
    '** permit persons to whom the Materials are furnished to do so, subject to\n' +
    '** the following conditions:\n' +
    '**\n' +
    '** The above copyright notice and this permission notice shall be included\n' +
    '** in all copies or substantial portions of the Materials.\n' +
    '**\n' +
    '** THE MATERIALS ARE PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,\n' +
    '** EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF\n' +
    '** MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.\n' +
    '** IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY\n' +
    '** CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,\n' +
    '** TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE\n' +
    '** MATERIALS OR THE USE OR OTHER DEALINGS IN THE MATERIALS.\n' +
    '*/'; 


/**
 * Wrapped logging function.
 * @param {string} msg Message to log.
 */
var log = function(msg) {
  if (window.console && window.console.log) {
    window.console.log(msg);
  }
};

/**
 * Wrapped error logging function.
 * @param {string} msg Message to log.
 */
var error = function(msg) {
  if (window.console && window.console.error) {
    window.console.error(msg);
  } else {
    log(msg);
  }
};


/**
 * Which arguments are enums based on the number of arguments to the function.
 * So
 *    'texImage2D': {
 *       9: { 0:true, 2:true, 6:true, 7:true },
 *       6: { 0:true, 2:true, 3:true, 4:true },
 *    },
 *
 * means if there are 9 arguments then 6 and 7 are enums, if there are 6
 * arguments 3 and 4 are enums
 *
 * @type {!Object.<number, !Object.<number, string>>}
 */
var glValidEnumContexts = {
  // Generic setters and getters

  'enable': {1: { 0:true }},
  'disable': {1: { 0:true }},
  'getParameter': {1: { 0:true }},

  // Rendering

  'drawArrays': {3:{ 0:true }},
  'drawElements': {4:{ 0:true, 2:true }},

  // Shaders

  'createShader': {1: { 0:true }},
  'getShaderParameter': {2: { 1:true }},
  'getProgramParameter': {2: { 1:true }},
  'getShaderPrecisionFormat': {2: { 0: true, 1:true }},

  // Vertex attributes

  'getVertexAttrib': {2: { 1:true }},
  'vertexAttribPointer': {6: { 2:true }},

  // Textures

  'bindTexture': {2: { 0:true }},
  'activeTexture': {1: { 0:true }},
  'getTexParameter': {2: { 0:true, 1:true }},
  'texParameterf': {3: { 0:true, 1:true }},
  'texParameteri': {3: { 0:true, 1:true, 2:true }},
  // texImage2D and texSubImage2D are defined below with WebGL 2 entrypoints
  'copyTexImage2D': {8: { 0:true, 2:true }},
  'copyTexSubImage2D': {8: { 0:true }},
  'generateMipmap': {1: { 0:true }},
  // compressedTexImage2D and compressedTexSubImage2D are defined below with WebGL 2 entrypoints

  // Buffer objects

  'bindBuffer': {2: { 0:true }},
  // bufferData and bufferSubData are defined below with WebGL 2 entrypoints
  'getBufferParameter': {2: { 0:true, 1:true }},

  // Renderbuffers and framebuffers

  'pixelStorei': {2: { 0:true, 1:true }},
  // readPixels is defined below with WebGL 2 entrypoints
  'bindRenderbuffer': {2: { 0:true }},
  'bindFramebuffer': {2: { 0:true }},
  'checkFramebufferStatus': {1: { 0:true }},
  'framebufferRenderbuffer': {4: { 0:true, 1:true, 2:true }},
  'framebufferTexture2D': {5: { 0:true, 1:true, 2:true }},
  'getFramebufferAttachmentParameter': {3: { 0:true, 1:true, 2:true }},
  'getRenderbufferParameter': {2: { 0:true, 1:true }},
  'renderbufferStorage': {4: { 0:true, 1:true }},

  // Frame buffer operations (clear, blend, depth test, stencil)

  'clear': {1: { 0: { 'enumBitwiseOr': ['COLOR_BUFFER_BIT', 'DEPTH_BUFFER_BIT', 'STENCIL_BUFFER_BIT'] }}},
  'depthFunc': {1: { 0:true }},
  'blendFunc': {2: { 0:true, 1:true }},
  'blendFuncSeparate': {4: { 0:true, 1:true, 2:true, 3:true }},
  'blendEquation': {1: { 0:true }},
  'blendEquationSeparate': {2: { 0:true, 1:true }},
  'stencilFunc': {3: { 0:true }},
  'stencilFuncSeparate': {4: { 0:true, 1:true }},
  'stencilMaskSeparate': {2: { 0:true }},
  'stencilOp': {3: { 0:true, 1:true, 2:true }},
  'stencilOpSeparate': {4: { 0:true, 1:true, 2:true, 3:true }},

  // Culling

  'cullFace': {1: { 0:true }},
  'frontFace': {1: { 0:true }},

  // ANGLE_instanced_arrays extension

  'drawArraysInstancedANGLE': {4: { 0:true }},
  'drawElementsInstancedANGLE': {5: { 0:true, 2:true }},

  // EXT_blend_minmax extension

  'blendEquationEXT': {1: { 0:true }},

  // WebGL 2 Buffer objects

  'bufferData': {
    3: { 0:true, 2:true }, // WebGL 1
    4: { 0:true, 2:true }, // WebGL 2
    5: { 0:true, 2:true }  // WebGL 2
  },
  'bufferSubData': {
    3: { 0:true }, // WebGL 1
    4: { 0:true }, // WebGL 2
    5: { 0:true }  // WebGL 2
  },
  'copyBufferSubData': {5: { 0:true, 1:true }},
  'getBufferSubData': {3: { 0:true }, 4: { 0:true }, 5: { 0:true }},

  // WebGL 2 Framebuffer objects

  'blitFramebuffer': {10: { 8: { 'enumBitwiseOr': ['COLOR_BUFFER_BIT', 'DEPTH_BUFFER_BIT', 'STENCIL_BUFFER_BIT'] }, 9:true }},
  'framebufferTextureLayer': {5: { 0:true, 1:true }},
  'invalidateFramebuffer': {2: { 0:true }},
  'invalidateSubFramebuffer': {6: { 0:true }},
  'readBuffer': {1: { 0:true }},

  // WebGL 2 Renderbuffer objects

  'getInternalformatParameter': {3: { 0:true, 1:true, 2:true }},
  'renderbufferStorageMultisample': {5: { 0:true, 2:true }},

  // WebGL 2 Texture objects

  'texStorage2D': {5: { 0:true, 2:true }},
  'texStorage3D': {6: { 0:true, 2:true }},
  'texImage2D': {
    9: { 0:true, 2:true, 6:true, 7:true }, // WebGL 1 & 2
    6: { 0:true, 2:true, 3:true, 4:true }, // WebGL 1
    10: { 0:true, 2:true, 6:true, 7:true } // WebGL 2
  },
  'texImage3D': {
    10: { 0:true, 2:true, 7:true, 8:true },
    11: { 0:true, 2:true, 7:true, 8:true }
  },
  'texSubImage2D': {
    9: { 0:true, 6:true, 7:true }, // WebGL 1 & 2
    7: { 0:true, 4:true, 5:true }, // WebGL 1
    10: { 0:true, 6:true, 7:true } // WebGL 2
  },
  'texSubImage3D': {
    11: { 0:true, 8:true, 9:true },
    12: { 0:true, 8:true, 9:true }
  },
  'copyTexSubImage3D': {9: { 0:true }},
  'compressedTexImage2D': {
    7: { 0: true, 2:true }, // WebGL 1 & 2
    8: { 0: true, 2:true }, // WebGL 2
    9: { 0: true, 2:true }  // WebGL 2
  },
  'compressedTexImage3D': {
    8: { 0: true, 2:true },
    9: { 0: true, 2:true },
    10: { 0: true, 2:true }
  },
  'compressedTexSubImage2D': {
    8: { 0: true, 6:true }, // WebGL 1 & 2
    9: { 0: true, 6:true }, // WebGL 2
    10: { 0: true, 6:true } // WebGL 2
  },
  'compressedTexSubImage3D': {
    10: { 0: true, 8:true },
    11: { 0: true, 8:true },
    12: { 0: true, 8:true }
  },

  // WebGL 2 Vertex attribs

  'vertexAttribIPointer': {5: { 2:true }},

  // WebGL 2 Writing to the drawing buffer

  'drawArraysInstanced': {4: { 0:true }},
  'drawElementsInstanced': {5: { 0:true, 2:true }},
  'drawRangeElements': {6: { 0:true, 4:true }},

  // WebGL 2 Reading back pixels

  'readPixels': {
    7: { 4:true, 5:true }, // WebGL 1 & 2
    8: { 4:true, 5:true }  // WebGL 2
  },

  // WebGL 2 Multiple Render Targets

  'clearBufferfv': {3: { 0:true }, 4: { 0:true }},
  'clearBufferiv': {3: { 0:true }, 4: { 0:true }},
  'clearBufferuiv': {3: { 0:true }, 4: { 0:true }},
  'clearBufferfi': {4: { 0:true }},

  // WebGL 2 Query objects

  'beginQuery': {2: { 0:true }},
  'endQuery': {1: { 0:true }},
  'getQuery': {2: { 0:true, 1:true }},
  'getQueryParameter': {2: { 1:true }},

  // WebGL 2 Sampler objects

  'samplerParameteri': {3: { 1:true, 2:true }},
  'samplerParameterf': {3: { 1:true }},
  'getSamplerParameter': {2: { 1:true }},

  // WebGL 2 Sync objects

  'fenceSync': {2: { 0:true, 1: { 'enumBitwiseOr': [] } }},
  'clientWaitSync': {3: { 1: { 'enumBitwiseOr': ['SYNC_FLUSH_COMMANDS_BIT'] } }},
  'waitSync': {3: { 1: { 'enumBitwiseOr': [] } }},
  'getSyncParameter': {2: { 1:true }},

  // WebGL 2 Transform Feedback

  'bindTransformFeedback': {2: { 0:true }},
  'beginTransformFeedback': {1: { 0:true }},
  'transformFeedbackVaryings': {3: { 2:true }},

  // WebGL2 Uniform Buffer Objects and Transform Feedback Buffers

  'bindBufferBase': {3: { 0:true }},
  'bindBufferRange': {5: { 0:true }},
  'getIndexedParameter': {2: { 0:true }},
  'getActiveUniforms': {3: { 2:true }},
  'getActiveUniformBlockParameter': {3: { 2:true }}
};

/**
 * Map of numbers to names.
 * @type {Object}
 */
var glEnums = null;

/**
 * Map of names to numbers.
 * @type {Object}
 */
var enumStringToValue = null;

/**
 * Initializes this module. Safe to call more than once.
 * @param {!WebGLRenderingContext} ctx A WebGL context. If
 *    you have more than one context it doesn't matter which one
 *    you pass in, it is only used to pull out constants.
 */
function init(ctx) {
  if (glEnums === null) {
    glEnums = { };
    enumStringToValue = { };
    for (var propertyName in ctx) {
      if (typeof ctx[propertyName] == 'number') {
        glEnums[ctx[propertyName]] = propertyName;
        enumStringToValue[propertyName] = ctx[propertyName];
      }
    }
  }
}

/**
 * Checks the utils have been initialized.
 */
function checkInit() {
  if (glEnums === null) {
    throw 'WebGLDebugUtils.init(ctx) not called';
  }
}

/**
 * Returns true or false if value matches any WebGL enum
 * @param {*} value Value to check if it might be an enum.
 * @return {boolean} True if value matches one of the WebGL defined enums
 */
function mightBeEnum(value) {
  checkInit();
  return (glEnums[value] !== undefined);
}

/**
 * Gets an string version of an WebGL enum.
 *
 * Example:
 *   var str = WebGLDebugUtil.glEnumToString(ctx.getError());
 *
 * @param {number} value Value to return an enum for
 * @return {string} The string version of the enum.
 */
function glEnumToString(value) {
  checkInit();
  var name = glEnums[value];
  return (name !== undefined) ? ("gl." + name) :
      ("/*UNKNOWN WebGL ENUM*/ 0x" + value.toString(16) + "");
}

/**
 * Returns the string version of a WebGL argument.
 * Attempts to convert enum arguments to strings.
 * @param {string} functionName the name of the WebGL function.
 * @param {number} numArgs the number of arguments passed to the function.
 * @param {number} argumentIndx the index of the argument.
 * @param {*} value The value of the argument.
 * @return {string} The value as a string.
 */
function glFunctionArgToString(functionName, numArgs, argumentIndex, value) {
  var funcInfo = glValidEnumContexts[functionName];
  if (funcInfo !== undefined) {
    funcInfo = funcInfo[numArgs];
    if (funcInfo !== undefined) {
      if (funcInfo[argumentIndex]) {
        if (typeof funcInfo[argumentIndex] === 'object' &&
            funcInfo[argumentIndex].enumBitwiseOr !== undefined) {
          var enums = funcInfo[argumentIndex].enumBitwiseOr;
          var orResult = 0;
          var orEnums = [];
          for (var i = 0; i < enums.length; ++i) {
            var enumValue = enumStringToValue[enums[i]];
            if ((value & enumValue) !== 0) {
              orResult |= enumValue;
              orEnums.push(glEnumToString(enumValue));
            }
          }
          if (orResult === value) {
            return orEnums.join(' | ');
          } else {
            return glEnumToString(value);
          }
        } else {
          return glEnumToString(value);
        }
      }
    }
  }
  if (value === null) {
    return "null";
  } else if (value === undefined) {
    return "undefined";
  } else {
    return value.toString();
  }
}

/**
 * Converts the arguments of a WebGL function to a string.
 * Attempts to convert enum arguments to strings.
 *
 * @param {string} functionName the name of the WebGL function.
 * @param {number} args The arguments.
 * @return {string} The arguments as a string.
 */
function glFunctionArgsToString(functionName, args) {
  // apparently we can't do args.join(",");
  var argStr = "";
  var numArgs = args.length;
  for (var ii = 0; ii < numArgs; ++ii) {
    argStr += ((ii === 0) ? '' : ', ') +
        glFunctionArgToString(functionName, numArgs, ii, args[ii]);
  }
  return argStr;
}


function makePropertyWrapper(wrapper, original, propertyName) {
  //log("wrap prop: " + propertyName);
  wrapper.__defineGetter__(propertyName, function() {
    return original[propertyName];
  });
  // TODO(gmane): this needs to handle properties that take more than
  // one value?
  wrapper.__defineSetter__(propertyName, function(value) {
    //log("set: " + propertyName);
    original[propertyName] = value;
  });
}

// Makes a function that calls a function on another object.
function makeFunctionWrapper(original, functionName) {
  //log("wrap fn: " + functionName);
  var f = original[functionName];
  return function() {
    //log("call: " + functionName);
    var result = f.apply(original, arguments);
    return result;
  };
}

/**
 * Given a WebGL context returns a wrapped context that calls
 * gl.getError after every command and calls a function if the
 * result is not gl.NO_ERROR.
 *
 * @param {!WebGLRenderingContext} ctx The webgl context to
 *        wrap.
 * @param {!function(err, funcName, args): void} opt_onErrorFunc
 *        The function to call when gl.getError returns an
 *        error. If not specified the default function calls
 *        console.log with a message.
 * @param {!function(funcName, args): void} opt_onFunc The
 *        function to call when each webgl function is called.
 *        You can use this to log all calls for example.
 * @param {!WebGLRenderingContext} opt_err_ctx The webgl context
 *        to call getError on if different than ctx.
 */
function makeDebugContext(ctx, opt_onErrorFunc, opt_onFunc, opt_err_ctx) {
  opt_err_ctx = opt_err_ctx || ctx;
  init(ctx);
  opt_onErrorFunc = opt_onErrorFunc || function(err, functionName, args) {
        // apparently we can't do args.join(",");
        var argStr = "";
        var numArgs = args.length;
        for (var ii = 0; ii < numArgs; ++ii) {
          argStr += ((ii === 0) ? '' : ', ') +
              glFunctionArgToString(functionName, numArgs, ii, args[ii]);
        }
        error("WebGL error "+ glEnumToString(err) + " in "+ functionName +
              "(" + argStr + ")");
      };

  // Holds booleans for each GL error so after we get the error ourselves
  // we can still return it to the client app.
  var glErrorShadow = { };

  // Makes a function that calls a WebGL function and then calls getError.
  function makeErrorWrapper(ctx, functionName) {
    return function() {
      if (opt_onFunc) {
        opt_onFunc(functionName, arguments);
      }
      var result = ctx[functionName].apply(ctx, arguments);
      var err = opt_err_ctx.getError();
      if (err !== 0) {
        glErrorShadow[err] = true;
        opt_onErrorFunc(err, functionName, arguments);
      }
      return result;
    };
  }

  // Make a an object that has a copy of every property of the WebGL context
  // but wraps all functions.
  var wrapper = {};
  for (var propertyName in ctx) {
    if (typeof ctx[propertyName] == 'function') {
      if (propertyName != 'getExtension') {
        wrapper[propertyName] = makeErrorWrapper(ctx, propertyName);
      } else {
        var wrapped = makeErrorWrapper(ctx, propertyName);
        wrapper[propertyName] = function () {
          var result = wrapped.apply(ctx, arguments);
          if (!result) {
            return null;
          }
          return makeDebugContext(result, opt_onErrorFunc, opt_onFunc, opt_err_ctx);
        };
      }
    } else {
      makePropertyWrapper(wrapper, ctx, propertyName);
    }
  }

  // Override the getError function with one that returns our saved results.
  wrapper.getError = function() {
    for (var err in glErrorShadow) {
      if (glErrorShadow.hasOwnProperty(err)) {
        if (glErrorShadow[err]) {
          glErrorShadow[err] = false;
          return err;
        }
      }
    }
    return ctx.NO_ERROR;
  };

  return wrapper;
}

function resetToInitialState(ctx) {
  var isWebGL2RenderingContext = !!ctx.createTransformFeedback;

  if (isWebGL2RenderingContext) {
    ctx.bindVertexArray(null);
  }

  var numAttribs = ctx.getParameter(ctx.MAX_VERTEX_ATTRIBS);
  var tmp = ctx.createBuffer();
  var ii;
  ctx.bindBuffer(ctx.ARRAY_BUFFER, tmp);
  for (ii = 0; ii < numAttribs; ++ii) {
    ctx.disableVertexAttribArray(ii);
    ctx.vertexAttribPointer(ii, 4, ctx.FLOAT, false, 0, 0);
    ctx.vertexAttrib1f(ii, 0);
    if (isWebGL2RenderingContext) {
      ctx.vertexAttribDivisor(ii, 0);
    }
  }
  ctx.deleteBuffer(tmp);

  var numTextureUnits = ctx.getParameter(ctx.MAX_TEXTURE_IMAGE_UNITS);
  for (ii = 0; ii < numTextureUnits; ++ii) {
    ctx.activeTexture(ctx.TEXTURE0 + ii);
    ctx.bindTexture(ctx.TEXTURE_CUBE_MAP, null);
    ctx.bindTexture(ctx.TEXTURE_2D, null);
    if (isWebGL2RenderingContext) {
      ctx.bindTexture(ctx.TEXTURE_2D_ARRAY, null);
      ctx.bindTexture(ctx.TEXTURE_3D, null);
      ctx.bindSampler(ii, null);
    }
  }

  ctx.activeTexture(ctx.TEXTURE0);
  ctx.useProgram(null);
  ctx.bindBuffer(ctx.ARRAY_BUFFER, null);
  ctx.bindBuffer(ctx.ELEMENT_ARRAY_BUFFER, null);
  ctx.bindFramebuffer(ctx.FRAMEBUFFER, null);
  ctx.bindRenderbuffer(ctx.RENDERBUFFER, null);
  ctx.disable(ctx.BLEND);
  ctx.disable(ctx.CULL_FACE);
  ctx.disable(ctx.DEPTH_TEST);
  ctx.disable(ctx.DITHER);
  ctx.disable(ctx.SCISSOR_TEST);
  ctx.blendColor(0, 0, 0, 0);
  ctx.blendEquation(ctx.FUNC_ADD);
  ctx.blendFunc(ctx.ONE, ctx.ZERO);
  ctx.clearColor(0, 0, 0, 0);
  ctx.clearDepth(1);
  ctx.clearStencil(-1);
  ctx.colorMask(true, true, true, true);
  ctx.cullFace(ctx.BACK);
  ctx.depthFunc(ctx.LESS);
  ctx.depthMask(true);
  ctx.depthRange(0, 1);
  ctx.frontFace(ctx.CCW);
  ctx.hint(ctx.GENERATE_MIPMAP_HINT, ctx.DONT_CARE);
  ctx.lineWidth(1);
  ctx.pixelStorei(ctx.PACK_ALIGNMENT, 4);
  ctx.pixelStorei(ctx.UNPACK_ALIGNMENT, 4);
  ctx.pixelStorei(ctx.UNPACK_FLIP_Y_WEBGL, false);
  ctx.pixelStorei(ctx.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
  // TODO: Delete this IF.
  if (ctx.UNPACK_COLORSPACE_CONVERSION_WEBGL) {
    ctx.pixelStorei(ctx.UNPACK_COLORSPACE_CONVERSION_WEBGL, ctx.BROWSER_DEFAULT_WEBGL);
  }
  ctx.polygonOffset(0, 0);
  ctx.sampleCoverage(1, false);
  ctx.scissor(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.stencilFunc(ctx.ALWAYS, 0, 0xFFFFFFFF);
  ctx.stencilMask(0xFFFFFFFF);
  ctx.stencilOp(ctx.KEEP, ctx.KEEP, ctx.KEEP);
  ctx.viewport(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.clear(ctx.COLOR_BUFFER_BIT | ctx.DEPTH_BUFFER_BIT | ctx.STENCIL_BUFFER_BIT);

  if (isWebGL2RenderingContext) {
    ctx.drawBuffers([ctx.BACK]);
    ctx.readBuffer(ctx.BACK);
    ctx.bindBuffer(ctx.COPY_READ_BUFFER, null);
    ctx.bindBuffer(ctx.COPY_WRITE_BUFFER, null);
    ctx.bindBuffer(ctx.PIXEL_PACK_BUFFER, null);
    ctx.bindBuffer(ctx.PIXEL_UNPACK_BUFFER, null);
    var numTransformFeedbacks = ctx.getParameter(ctx.MAX_TRANSFORM_FEEDBACK_SEPARATE_ATTRIBS);
    for (ii = 0; ii < numTransformFeedbacks; ++ii) {
      ctx.bindBufferBase(ctx.TRANSFORM_FEEDBACK_BUFFER, ii, null);
    }
    var numUBOs = ctx.getParameter(ctx.MAX_UNIFORM_BUFFER_BINDINGS);
    for (ii = 0; ii < numUBOs; ++ii) {
      ctx.bindBufferBase(ctx.UNIFORM_BUFFER, ii, null);
    }
    ctx.disable(ctx.RASTERIZER_DISCARD);
    ctx.pixelStorei(ctx.UNPACK_IMAGE_HEIGHT, 0);
    ctx.pixelStorei(ctx.UNPACK_SKIP_IMAGES, 0);
    ctx.pixelStorei(ctx.UNPACK_ROW_LENGTH, 0);
    ctx.pixelStorei(ctx.UNPACK_SKIP_ROWS, 0);
    ctx.pixelStorei(ctx.UNPACK_SKIP_PIXELS, 0);
    ctx.pixelStorei(ctx.PACK_ROW_LENGTH, 0);
    ctx.pixelStorei(ctx.PACK_SKIP_ROWS, 0);
    ctx.pixelStorei(ctx.PACK_SKIP_PIXELS, 0);
    ctx.hint(ctx.FRAGMENT_SHADER_DERIVATIVE_HINT, ctx.DONT_CARE);
  }

  // TODO: This should NOT be needed but Firefox fails with 'hint'
  while(ctx.getError()) {}
}

function makeLostContextSimulatingCanvas(canvas) {
  var unwrappedContext_;
  var onLost_ = [];
  var onRestored_ = [];
  var wrappedContext_ = {};
  var contextId_ = 1;
  var contextLost_ = false;
  var resourceId_ = 0;
  var resourceDb_ = [];
  var numCallsToLoseContext_ = 0;
  var numCalls_ = 0;
  var canRestore_ = false;
  var restoreTimeout_ = 0;
  var isWebGL2RenderingContext;

  // Holds booleans for each GL error so can simulate errors.
  var glErrorShadow_ = { };

  canvas.getContext = function(f) {
    return function() {
      var ctx = f.apply(canvas, arguments);
      // Did we get a context and is it a WebGL context?
      if ((ctx instanceof WebGLRenderingContext) || (window.WebGL2RenderingContext && (ctx instanceof WebGL2RenderingContext))) {
        if (ctx != unwrappedContext_) {
          if (unwrappedContext_) {
            throw "got different context";
          }
          isWebGL2RenderingContext = window.WebGL2RenderingContext && (ctx instanceof WebGL2RenderingContext);
          unwrappedContext_ = ctx;
          wrappedContext_ = makeLostContextSimulatingContext(unwrappedContext_);
        }
        return wrappedContext_;
      }
      return ctx;
    };
  }(canvas.getContext);

  function wrapEvent(listener) {
    if (typeof(listener) == "function") {
      return listener;
    } else {
      return function(info) {
        listener.handleEvent(info);
      };
    }
  }

  var addOnContextLostListener = function(listener) {
    onLost_.push(wrapEvent(listener));
  };

  var addOnContextRestoredListener = function(listener) {
    onRestored_.push(wrapEvent(listener));
  };


  function wrapAddEventListener(canvas) {
    var f = canvas.addEventListener;
    canvas.addEventListener = function(type, listener, bubble) {
      switch (type) {
        case 'webglcontextlost':
          addOnContextLostListener(listener);
          break;
        case 'webglcontextrestored':
          addOnContextRestoredListener(listener);
          break;
        default:
          f.apply(canvas, arguments);
      }
    };
  }

  wrapAddEventListener(canvas);

  canvas.loseContext = function() {
    if (!contextLost_) {
      contextLost_ = true;
      numCallsToLoseContext_ = 0;
      ++contextId_;
      while (unwrappedContext_.getError()){}
      clearErrors();
      glErrorShadow_[unwrappedContext_.CONTEXT_LOST_WEBGL] = true;
      var event = makeWebGLContextEvent("context lost");
      var callbacks = onLost_.slice();
      setTimeout(function() {
          //log("numCallbacks:" + callbacks.length);
          for (var ii = 0; ii < callbacks.length; ++ii) {
            //log("calling callback:" + ii);
            callbacks[ii](event);
          }
          if (restoreTimeout_ >= 0) {
            setTimeout(function() {
                canvas.restoreContext();
              }, restoreTimeout_);
          }
        }, 0);
    }
  };

  canvas.restoreContext = function() {
    if (contextLost_) {
      if (onRestored_.length) {
        setTimeout(function() {
            if (!canRestore_) {
              throw "can not restore. webglcontestlost listener did not call event.preventDefault";
            }
            freeResources();
            resetToInitialState(unwrappedContext_);
            contextLost_ = false;
            numCalls_ = 0;
            canRestore_ = false;
            var callbacks = onRestored_.slice();
            var event = makeWebGLContextEvent("context restored");
            for (var ii = 0; ii < callbacks.length; ++ii) {
              callbacks[ii](event);
            }
          }, 0);
      }
    }
  };

  canvas.loseContextInNCalls = function(numCalls) {
    if (contextLost_) {
      throw "You can not ask a lost contet to be lost";
    }
    numCallsToLoseContext_ = numCalls_ + numCalls;
  };

  canvas.getNumCalls = function() {
    return numCalls_;
  };

  canvas.setRestoreTimeout = function(timeout) {
    restoreTimeout_ = timeout;
  };

  function isWebGLObject(obj) {
    //return false;
    return (obj instanceof WebGLBuffer ||
            obj instanceof WebGLFramebuffer ||
            obj instanceof WebGLProgram ||
            obj instanceof WebGLRenderbuffer ||
            obj instanceof WebGLShader ||
            obj instanceof WebGLTexture);
  }

  function checkResources(args) {
    for (var ii = 0; ii < args.length; ++ii) {
      var arg = args[ii];
      if (isWebGLObject(arg)) {
        return arg.__webglDebugContextLostId__ == contextId_;
      }
    }
    return true;
  }

  function clearErrors() {
    var k = Object.keys(glErrorShadow_);
    for (var ii = 0; ii < k.length; ++ii) {
      delete glErrorShadow_[k[ii]];
    }
  }

  function loseContextIfTime() {
    ++numCalls_;
    if (!contextLost_) {
      if (numCallsToLoseContext_ == numCalls_) {
        canvas.loseContext();
      }
    }
  }

  // Makes a function that simulates WebGL when out of context.
  function makeLostContextFunctionWrapper(ctx, functionName) {
    var f = ctx[functionName];
    return function() {
      // log("calling:" + functionName);
      // Only call the functions if the context is not lost.
      loseContextIfTime();
      if (!contextLost_) {
        //if (!checkResources(arguments)) {
        //  glErrorShadow_[wrappedContext_.INVALID_OPERATION] = true;
        //  return;
        //}
        var result = f.apply(ctx, arguments);
        return result;
      }
    };
  }

  function freeResources() {
    for (var ii = 0; ii < resourceDb_.length; ++ii) {
      var resource = resourceDb_[ii];
      if (resource instanceof WebGLBuffer) {
        unwrappedContext_.deleteBuffer(resource);
      } else if (resource instanceof WebGLFramebuffer) {
        unwrappedContext_.deleteFramebuffer(resource);
      } else if (resource instanceof WebGLProgram) {
        unwrappedContext_.deleteProgram(resource);
      } else if (resource instanceof WebGLRenderbuffer) {
        unwrappedContext_.deleteRenderbuffer(resource);
      } else if (resource instanceof WebGLShader) {
        unwrappedContext_.deleteShader(resource);
      } else if (resource instanceof WebGLTexture) {
        unwrappedContext_.deleteTexture(resource);
      }
      else if (isWebGL2RenderingContext) {
        if (resource instanceof WebGLQuery) {
          unwrappedContext_.deleteQuery(resource);
        } else if (resource instanceof WebGLSampler) {
          unwrappedContext_.deleteSampler(resource);
        } else if (resource instanceof WebGLSync) {
          unwrappedContext_.deleteSync(resource);
        } else if (resource instanceof WebGLTransformFeedback) {
          unwrappedContext_.deleteTransformFeedback(resource);
        } else if (resource instanceof WebGLVertexArrayObject) {
          unwrappedContext_.deleteVertexArray(resource);
        }
      }
    }
  }

  function makeWebGLContextEvent(statusMessage) {
    return {
      statusMessage: statusMessage,
      preventDefault: function() {
          canRestore_ = true;
        }
    };
  }

  return canvas;

  function makeLostContextSimulatingContext(ctx) {
    // copy all functions and properties to wrapper
    for (var propertyName in ctx) {
      if (typeof ctx[propertyName] == 'function') {
         wrappedContext_[propertyName] = makeLostContextFunctionWrapper(
             ctx, propertyName);
       } else {
         makePropertyWrapper(wrappedContext_, ctx, propertyName);
       }
    }

    // Wrap a few functions specially.
    var err;
    wrappedContext_.getError = function() {
      loseContextIfTime();
      if (!contextLost_) {
        while (err = unwrappedContext_.getError()) {
          glErrorShadow_[err] = true;
        }
      }
      for (err in glErrorShadow_) {
        if (glErrorShadow_[err]) {
          delete glErrorShadow_[err];
          return err;
        }
      }
      return wrappedContext_.NO_ERROR;
    };

    var creationFunctions = [
      "createBuffer",
      "createFramebuffer",
      "createProgram",
      "createRenderbuffer",
      "createShader",
      "createTexture"
    ];
    if (isWebGL2RenderingContext) {
      creationFunctions.push(
        "createQuery",
        "createSampler",
        "fenceSync",
        "createTransformFeedback",
        "createVertexArray"
      );
    }

    var functionName;
    for (var ii = 0; ii < creationFunctions.length; ++ii) {
      functionName = creationFunctions[ii];
      wrappedContext_[functionName] = function(f) {
        return function() {
          loseContextIfTime();
          if (contextLost_) {
            return null;
          }
          var obj = f.apply(ctx, arguments);
          obj.__webglDebugContextLostId__ = contextId_;
          resourceDb_.push(obj);
          return obj;
        };
      }(ctx[functionName]);
    }

    var functionsThatShouldReturnNull = [
      "getActiveAttrib",
      "getActiveUniform",
      "getBufferParameter",
      "getContextAttributes",
      "getAttachedShaders",
      "getFramebufferAttachmentParameter",
      "getParameter",
      "getProgramParameter",
      "getProgramInfoLog",
      "getRenderbufferParameter",
      "getShaderParameter",
      "getShaderInfoLog",
      "getShaderSource",
      "getTexParameter",
      "getUniform",
      "getUniformLocation",
      "getVertexAttrib"
    ];
    if (isWebGL2RenderingContext) {
      functionsThatShouldReturnNull.push(
        "getInternalformatParameter",
        "getQuery",
        "getQueryParameter",
        "getSamplerParameter",
        "getSyncParameter",
        "getTransformFeedbackVarying",
        "getIndexedParameter",
        "getUniformIndices",
        "getActiveUniforms",
        "getActiveUniformBlockParameter",
        "getActiveUniformBlockName"
      );
    }
    for (ii = 0; ii < functionsThatShouldReturnNull.length; ++ii) {
      functionName = functionsThatShouldReturnNull[ii];
      wrappedContext_[functionName] = function(f) {
        return function() {
          loseContextIfTime();
          if (contextLost_) {
            return null;
          }
          return f.apply(ctx, arguments);
        };
      }(wrappedContext_[functionName]);
    }

    var isFunctions = [
      "isBuffer",
      "isEnabled",
      "isFramebuffer",
      "isProgram",
      "isRenderbuffer",
      "isShader",
      "isTexture"
    ];
    if (isWebGL2RenderingContext) {
      isFunctions.push(
        "isQuery",
        "isSampler",
        "isSync",
        "isTransformFeedback",
        "isVertexArray"
      );
    }
    for (ii = 0; ii < isFunctions.length; ++ii) {
      functionName = isFunctions[ii];
      wrappedContext_[functionName] = function(f) {
        return function() {
          loseContextIfTime();
          if (contextLost_) {
            return false;
          }
          return f.apply(ctx, arguments);
        };
      }(wrappedContext_[functionName]);
    }

    wrappedContext_.checkFramebufferStatus = function(f) {
      return function() {
        loseContextIfTime();
        if (contextLost_) {
          return wrappedContext_.FRAMEBUFFER_UNSUPPORTED;
        }
        return f.apply(ctx, arguments);
      };
    }(wrappedContext_.checkFramebufferStatus);

    wrappedContext_.getAttribLocation = function(f) {
      return function() {
        loseContextIfTime();
        if (contextLost_) {
          return -1;
        }
        return f.apply(ctx, arguments);
      };
    }(wrappedContext_.getAttribLocation);

    wrappedContext_.getVertexAttribOffset = function(f) {
      return function() {
        loseContextIfTime();
        if (contextLost_) {
          return 0;
        }
        return f.apply(ctx, arguments);
      };
    }(wrappedContext_.getVertexAttribOffset);

    wrappedContext_.isContextLost = function() {
      return contextLost_;
    };

    if (isWebGL2RenderingContext) {
      wrappedContext_.getFragDataLocation = function(f) {
        return function() {
          loseContextIfTime();
          if (contextLost_) {
            return -1;
          }
          return f.apply(ctx, arguments);
        };
      }(wrappedContext_.getFragDataLocation);

      wrappedContext_.clientWaitSync = function(f) {
        return function() {
          loseContextIfTime();
          if (contextLost_) {
            return wrappedContext_.WAIT_FAILED;
          }
          return f.apply(ctx, arguments);
        };
      }(wrappedContext_.clientWaitSync);

      wrappedContext_.getUniformBlockIndex = function(f) {
        return function() {
          loseContextIfTime();
          if (contextLost_) {
            return wrappedContext_.INVALID_INDEX;
          }
          return f.apply(ctx, arguments);
        };
      }(wrappedContext_.getUniformBlockIndex);
    }

    return wrappedContext_;
  }
}

return {
  /**
   * Returns the copyright notice.
   * @private
   */
  'copyright': copyright,

  /**
   * Initializes this module. Safe to call more than once.
   * @param {!WebGLRenderingContext} ctx A WebGL context. If
   *    you have more than one context it doesn't matter which one
   *    you pass in, it is only used to pull out constants.
   * @private 
   */
  'init': init,

  /**
   * Returns true or false if value matches any WebGL enum
   * @param {*} value Value to check if it might be an enum.
   * @return {boolean} True if value matches one of the WebGL defined enums
   * @private
   */
  'mightBeEnum': mightBeEnum,

  /**
   * Gets an string version of an WebGL enum.
   *
   * Example:
   *   WebGLDebugUtil.init(ctx);
   *   var str = WebGLDebugUtil.glEnumToString(ctx.getError());
   *
   * @param {number} value Value to return an enum for
   * @return {string} The string version of the enum.
   * @private
   */
  'glEnumToString': glEnumToString,

  /**
   * Converts the argument of a WebGL function to a string.
   * Attempts to convert enum arguments to strings.
   *
   * Example:
   *   WebGLDebugUtil.init(ctx);
   *   var str = WebGLDebugUtil.glFunctionArgToString('bindTexture', 2, 0, gl.TEXTURE_2D);
   *
   * would return 'TEXTURE_2D'
   *
   * @param {string} functionName the name of the WebGL function.
   * @param {number} numArgs The number of arguments
   * @param {number} argumentIndx the index of the argument.
   * @param {*} value The value of the argument.
   * @return {string} The value as a string.
   * @private
   */
  'glFunctionArgToString': glFunctionArgToString,

  /**
   * Converts the arguments of a WebGL function to a string.
   * Attempts to convert enum arguments to strings.
   *
   * @param {string} functionName the name of the WebGL function.
   * @param {number} args The arguments.
   * @return {string} The arguments as a string.
   * @private
   */
  'glFunctionArgsToString': glFunctionArgsToString,

  /**
   * Given a WebGL context returns a wrapped context that calls
   * gl.getError after every command and calls a function if the
   * result is not NO_ERROR.
   *
   * You can supply your own function if you want. For example, if you'd like
   * an exception thrown on any GL error you could do this
   *
   *    function throwOnGLError(err, funcName, args) {
   *      throw WebGLDebugUtils.glEnumToString(err) +
   *            " was caused by call to " + funcName;
   *    };
   *
   *    ctx = WebGLDebugUtils.makeDebugContext(
   *        canvas.getContext("webgl"), throwOnGLError);
   *
   * @param {!WebGLRenderingContext} ctx The webgl context to wrap.
   * @param {!function(err, funcName, args): void} opt_onErrorFunc The function
   *     to call when gl.getError returns an error. If not specified the default
   *     function calls console.log with a message.
   * @param {!function(funcName, args): void} opt_onFunc The
   *     function to call when each webgl function is called. You
   *     can use this to log all calls for example.
   * @private
   */
  'makeDebugContext': makeDebugContext,

  /**
   * Given a canvas element returns a wrapped canvas element that will
   * simulate lost context. The canvas returned adds the following functions.
   *
   * loseContext:
   *   simulates a lost context event.
   *
   * restoreContext:
   *   simulates the context being restored.
   *
   * lostContextInNCalls:
   *   loses the context after N gl calls.
   *
   * getNumCalls:
   *   tells you how many gl calls there have been so far.
   *
   * setRestoreTimeout:
   *   sets the number of milliseconds until the context is restored
   *   after it has been lost. Defaults to 0. Pass -1 to prevent
   *   automatic restoring.
   *
   * @param {!Canvas} canvas The canvas element to wrap.
   * @private
   */
  'makeLostContextSimulatingCanvas': makeLostContextSimulatingCanvas,

  /**
   * Resets a context to the initial state.
   * @param {!WebGLRenderingContext} ctx The webgl context to
   *     reset.
   * @private
   */
  'resetToInitialState': resetToInitialState
};

}();


})( window.BigLime = window.BigLime || {} );













;(function(Namespace, undefined) {
    "use strict";
    

/**
 * @category 3D
 * @classdesc
 * This class is responsible for loading dicom files into a volume.
 * It requires the daikon library.
 * 
 * @constructor
 */
Namespace.DicomLoader3D = function() 
{
    // Inherit from base class
    Namespace.Loader3D.call(this);

    this.daikonImgs = [];
    this.fileList   = [];
};
Namespace.DicomLoader3D.prototype = Object.create(Namespace.Loader3D.prototype);
Namespace.DicomLoader3D.prototype.constructor = Namespace.DicomLoader3D;  


/**
 * Starts loading image files into a volume object.
 * 
 * @param {FileList|File} imgFiles - The image File object(s) to load.
 * @param {VolumeT2|VolumeT3} volume - The volume object that will receive the data.
 * @param {function} [completionCb] - A callback to invoke when loading is complete.
 * @param {function} [progressCb] - A callback to invoke when each image is loaded.
 */
Namespace.DicomLoader3D.prototype.loadImagesIntoVolume = function(imgFiles, volume, completionCb, progressCb) 
{
    this.fileList = [];
    Array.prototype.push.apply(this.fileList, imgFiles); // Take a copy of the file list, since it may be transient

    // Prepare to load 
    this.vol = volume;
    this.errors = null;
    this.warnings = null;
    this.done = false;
    this.loadCompleteCb = completionCb;
    this.loadProgressCb = progressCb;

    // Handle a trivial case
    if (!this.fileList || !this.fileList.length) {
        this.done = true;
        this.warnings = "DicomLoader3D: No files were loaded, because the supplied file list was empty.";
        if (this.loadCompleteCb) { this.loadCompleteCb(this); }  
        return;
    }

    // Check that all items in the file list are valid
    if (this.fileList.some(f => {return !(f instanceof FileSystemFileHandle) && !(f instanceof File)} )) {
        this.done = true;
        this.errors = "DicomLoader3D: Invalid item in file list.";
        if (this.loadCompleteCb) { this.loadCompleteCb(this); }  
        return;
    }

    // Kick things off by reading the first file
    if (this.loadProgressCb) { this.loadProgressCb(0, this.fileList.length); }
    this._readImageFile(0);
};


/**
 * Reads an image file.
 * @private
 * 
 * @param {Number} imgIndex - The index of the image to be read.
 */
Namespace.DicomLoader3D.prototype._readImageFile = function(imgIndex) 
{ 
    var fileReader = new FileReader();
    fileReader.onload = function() { this._onImageFileRead(fileReader, null); }.bind(this);
    fileReader.onerror = function() { this._onReadError(fileReader, null); }.bind(this); 
    fileReader.imgIndex = imgIndex; 

    var fileItem = this.fileList[imgIndex];
    if (fileItem instanceof FileSystemFileHandle) 
    {
        fileItem.getFile().then(function(file) { 
            fileReader.readAsArrayBuffer(file); 
        })
        .catch (function(ex) {
            this._onReadError(fileReader)}.bind(this)
        );
    }
    else {
        fileReader.readAsArrayBuffer(fileItem);
    }
};


/**
 * Internal callback invoked when an error occurs during file reading.
 * @private
 * 
 * @param {FileReader} fileReader - The FileReader object that was reading the image.
 */
Namespace.DicomLoader3D.prototype._onReadError = function(fileReader) 
{
    if (this.cancelled) { return; } 

    if (!this.done) {
        this.done = true;
        this.errors = "DicomLoader3D: Error reading file " + this.fileList[fileReader.imgIndex].name;
        if (this.loadCompleteCb) { this.loadCompleteCb(this); }
    }
};


/**
 * Internal callback invoked when a file has been successfully read.
 * @private
 * 
 * @param {FileReader} fileReader - The FileReader object that was reading the image.
 */
Namespace.DicomLoader3D.prototype._onImageFileRead = function(fileReader) 
{    
    // Bounce out if this is a late callback 
    if (this.done) { return; }

    // Check if we've been cancelled
    if (this.cancelled) { return; } 

    // Get the file contents and try to interpret them as a dicom image
    var data = fileReader.result;
    var imgIndex = fileReader.imgIndex;

    try {
        var dv = new DataView(data);
        if (!daikon.Parser.isMagicCookieFound(dv)) {
            this.done = true;
            this.errors = "DicomLoader3D: Invalid dicom file.";
            if (this.loadCompleteCb) { this.loadCompleteCb(this); }
            return;
        }
        var daikonImg = daikon.Series.parseImage(dv);
        if (!daikonImg) {
            this.done = true;
            this.errors = daikon.Series.parserError;
            if (this.loadCompleteCb) { this.loadCompleteCb(this); }
            return;
        }
        this.daikonImgs.push(daikonImg);
    }
    catch (e) {
        this.done = true;
        this.errors = "DicomLoader3D: Error parsing dicom file " + this.fileList[imgIndex].name + "\n" + e.message;
        if (this.loadCompleteCb) { this.loadCompleteCb(this); }
        return;
    }

    // Report progress
    if (this.loadProgressCb) {
        this.loadProgressCb(imgIndex+1, this.fileList.length);
    }    

    // Read the next image, or finish up
    if (imgIndex+1 < this.fileList.length) {
        this._readImageFile(imgIndex+1); 
    } 
    else {
        this._onAllImagesRead();
    }
};


/**
 * Method invoked when all files have been successfully read.
 * @private
 * 
 */
Namespace.DicomLoader3D.prototype._onAllImagesRead = function () 
{
    // Check for multiple series
    var i;
    var img0 = this.daikonImgs[0];
    var seriesUid = img0.getSeriesInstanceUID();
    var tmp = [];
    for (i=0; i<this.daikonImgs.length; i++) {
        var img = this.daikonImgs[i];
        if ((img.getSeriesInstanceUID() == seriesUid) && Namespace.DicomLoader3D._sameGeometry(img,img0)) {
            tmp.push(img);
        }
    }
    if (tmp.length !== this.daikonImgs.length) {
        this.warnings += "Multiple series found. (Loaded the first one.)\n";
    }
    this.daikonImgs = tmp;
    var numImgs = this.daikonImgs.length;

    // Initialize the volume object
    var bpp = img0.getBitsAllocated();
    var imgWidth  = img0.getCols();
    var imgHeight = img0.getRows();
    var dims = [ imgWidth, imgHeight, numImgs ];         
    var errors = this.vol.loadBegin(dims, bpp, "little");  // We will coerce the pixel values to little endian
    if (errors) {
        this.done = true;
        this.errors = errors;
        if (this.loadCompleteCb) { this.loadCompleteCb(this); }
        return;        
    } 

    // Set some additional attributes in the volume
    this.vol.setAttr("modality", img0.getModality());
    this.vol.setAttr("rescaleSlope", img0.getDataScaleSlope() || 1);
    this.vol.setAttr("rescaleIntercept", img0.getDataScaleIntercept() || 0);
    this.vol.setAttr("dataOffset", 0);

    var orient = img0.getImageDirections();
    if ( orient && Array.isArray(orient) && (orient.length == 6) ) {
        this.vol.setAttr( "rowDir", [ orient[0], orient[1], orient[2] ] );
        this.vol.setAttr( "colDir", [ orient[3], orient[4], orient[5] ] );
    }
    this.vol.calcNearLphAxes();

    var gapInfo = this._sortImagesByZ(this.daikonImgs);
    this.vol.setAttr("sliceGap", gapInfo.gap);
    if (!gapInfo.uniform) { this.warnings += "Non-uniform slice spacing detected.\n"; }        
    if (gapInfo.warnings) { this.warnings += gapInfo.warnings; }        

    // Load the pixel data into the volume's textures.   
    var batchSize = (this.vol.bpp == 8) ? 4 : 2;
    var imgBufferArray = new Array(batchSize);
    var imgIndx = 0;
    while (imgIndx < numImgs) 
    {
        var batchEnd = Math.min(imgIndx + batchSize, numImgs);
        var batchInfo = { startIndex:imgIndx, endIndex:batchEnd, imgBuffers:imgBufferArray };
        for (i = 0; i < batchInfo.endIndex - batchInfo.startIndex; i++) 
        {
            var pixValInfo = Namespace.DicomLoader3D._getPixelValueArray(this.daikonImgs[imgIndx++]);
            if (!pixValInfo.array) {
                this.done = true;
                this.errors = "DicomLoader3D: Unsupported pixel type.";
                if (this.loadCompleteCb) { this.loadCompleteCb(this); }
                return; 
            }
            batchInfo.imgBuffers[i] = pixValInfo.array.buffer;
            if (imgIndx === 1) { this.vol.setAttr("dataOffset", pixValInfo.offset); }
        }    
        var erMsg = this._copyImagesToTexture(batchInfo);
        if (erMsg) {
            this.done = true;
            this.errors = erMsg;
            if (this.loadCompleteCb) { this.loadCompleteCb(this); }
            return;        
        } 
    }
    this.vol.loadEnd();
    
    // We are done, so call back
    this.done = true;        
    if (this.loadCompleteCb) { this.loadCompleteCb(this); } 
};


/**
 * Extracts the pixel values from a daikon image.
 * @private
 * 
 * @param {Object} daikonImg - The input daikon image.
 */
Namespace.DicomLoader3D._getPixelValueArray = function (daikonImg) 
{
    var datatype     = daikonImg.getDataType();
    var numBytes     = daikonImg.getBitsAllocated() / 8;
    var rawData      = daikonImg.getRawData();
    var dataView     = new DataView(rawData);
    var numElements  = rawData.byteLength / numBytes;
    var littleEndian = daikonImg.littleEndian;
    var mask         = daikon.Utils.createBitMask(daikonImg.getBitsAllocated() / 8, daikonImg.getBitsStored(),
                           daikonImg.getDataType() === daikon.Image.BYTE_TYPE_INTEGER_UNSIGNED);

    var array, rawValue, n;
    var offset = 0;

    if ( (datatype === daikon.Image.BYTE_TYPE_INTEGER_UNSIGNED) && (numBytes === 2) )
    {
        array = new Uint16Array(numElements);
        for (n = 0; n < numElements; n++) 
        {
            rawValue = dataView.getUint16(2*n, littleEndian);
            array[n] = (rawValue & mask);
        }
    }
    else if ( (datatype === daikon.Image.BYTE_TYPE_INTEGER_UNSIGNED) && (numBytes === 1) )
    {
        array = new Uint8Array(numElements);
        for (n = 0; n < numElements; n++) 
        {
            rawValue = dataView.getUint8(n);
            array[n] = (rawValue & mask);
        }
    }
    else if ( (datatype === daikon.Image.BYTE_TYPE_RGB) && (numBytes === 1) )
    {
        array = new Uint8Array(numElements/3); // 3*numPixels
        for (n = 0; n < numElements; n+=3) 
        {
            rawValue = ( dataView.getUint8(n) + dataView.getUint8(n+1) + dataView.getUint8(n+2) )/3 ;
            array[n/3] = (rawValue & mask);
        }
    }
    else if ( (datatype === daikon.Image.BYTE_TYPE_INTEGER) && (numBytes === 2) )
    {
        offset = 32768;
        array = new Uint16Array(numElements);
        for (n = 0; n < numElements; n++) 
        {
            rawValue = dataView.getInt16(2*n, littleEndian);
            array[n] = (rawValue & mask) + offset;
        }
    }
    else if ( (datatype === daikon.Image.BYTE_TYPE_INTEGER) && (numBytes === 1) )
    {
        offset = 128;
        array = new Uint8Array(numElements);
        for (n = 0; n < numElements; n++) 
        {
            rawValue = dataView.getInt8(n);
            array[n] = (rawValue & mask) + offset;
        }
    }
    else
    {
        array = null; 
    }
    return {array:array, offset:-offset};    
};


/**
 * Sorts a list of images, by their z-position.
 * @private
 * 
 * @param {Array} daikonImgs - The images to sort.
 */
Namespace.DicomLoader3D.prototype._sortImagesByZ = function (daikonImgs)
{
    // Compute the z-direction vector
    var vec3 = glMatrix.vec3;
     var i, warnings;
    var img0 = daikonImgs[0];
    var orient = img0.getImageDirections();
    if ( !orient || !Array.isArray(orient) || (orient.length !== 6) ) {
        return {gap:1, uniform:true};
    }

   var rowDir = [ orient[0], orient[1], orient[2] ];
    var colDir = [ orient[3], orient[4], orient[5] ];
    var perpDir = vec3.create();
    vec3.cross(perpDir, rowDir, colDir);

    // Compute the z-position of each image
    for (i=0; i<daikonImgs.length; i++) {
        var img = daikonImgs[i];
        var pos = img.getImagePosition();
        pos = [ pos[0], pos[1], pos[2] ];
        img.zPos = vec3.dot(pos, perpDir);
    }

    // Sort the images.
    // Note that we sort in *decreasing* order, effectively flipping the stack, 
    // to compensate for WebGL's left-handed clip-space coordinate system.
    daikonImgs.sort( function(a,b){ return (a.zPos > b.zPos) ? -1 : (a.zPos < b.zPos) ? 1 : 0; } );

    // Return slice gap info
    if (daikonImgs.length < 2) {
        return {gap:1, uniform:true};
    }

    // Get the first non-zero gap (zero indicates a duplicate image position, but we will tolerate it.)
    var pixelSpacing = img0.getPixelSpacing()[0];
    var gap = 0.0;
    for (i=1; i<daikonImgs.length; i++) {
        gap = Math.abs( daikonImgs[i].zPos - daikonImgs[i-1].zPos ) / pixelSpacing;
        if (gap > 0) { break; }
    }
    if (i !== 1) {
        warnings += "Duplicate image positions found.\n"; 
    }

    // Check whether all other gaps are the same
    var uniform = true;
    for (i=2; i<daikonImgs.length; i++) {
        var aGap = Math.abs( (daikonImgs[i].zPos - daikonImgs[i-1].zPos)/pixelSpacing );
        if ( Math.abs(aGap - gap) > 0.01 ) {
            uniform = false;
            break;
        }
    }
    
    return {gap:gap, uniform:uniform, warnings:warnings};    
};


/**
 * Determines whether two images have the same orientation and pixel spacing.
 * @private
 * 
 * @param {Object} imgA - The first image.
 * @param {Object} imgB - The second image.
 */
Namespace.DicomLoader3D._sameGeometry = function (imgA, imgB)
{
    var oriA = imgA.getImageDirections();    
    var oriB = imgB.getImageDirections();
    if ( !oriA || !oriB || !Array.isArray(oriA) || !Array.isArray(oriB) || (oriA.length !== 6) || (oriB.length !== 6) ) {
        return false;
    }
    for (var i=0; i<6; i++) {
        if (Math.abs(oriA[i]-oriB[i]) > 0.01) {
            return false;
        }
    }

    var psA =  imgA.getPixelSpacing()[0];   
    var psB =  imgB.getPixelSpacing()[0];   
    if ( Math.abs(psA-psB) > 0.01) {
        return false;
    }

    return true;
};


})( window.BigLime = window.BigLime || {} );








;(function(Namespace, undefined) {
    "use strict";
    var Sev = Namespace.Logger.Severity;

/**
 * @category 3D
 * @classdesc
 * The FrameBuffer class wraps a WebGL Framebuffer object.
 * 
 * @constructor
 * @param {GLContext} context - A rendering context.
 * @param {Number} txIndex - The WebGL texture index. Must be in the range [0, gl.MAX_TEXTURE_IMAGE_UNITS-1].
 * @param {Number} width - The desired width of the frame buffer.
 * @param {Number} height - The desired height of the frame buffer.
 * @param {GLenum} pixeltype - The pixel type (gl.RGB, gl.RGBA, gl.ALPHA, etc,
 *         but note that only gl.RGBA is guaranteed to be supported by all WebGL implementations).
 * @param {GLenum} interpType - The interpolation type (gl.LINEAR or gl.NEAREST)
 * @param {Boolean} createDepthBuffer - Whether to create and attach a depth buffer. 
 */
Namespace.FrameBuffer = function(context, txIndex, width, height, pixelType, interpType, createDepthBuffer) 
{ 
    this.context = context;    
    this.txIndex = txIndex;
    this.width   = Math.round(width);
    this.height  = Math.round(height);
    if ((this.width === 0) || (this.height === 0)) {
        Namespace.Logger.Report("FrameBuffer.ctor: FrameBuffer size cannot be zero; setting it to 1.", Sev.Warn); 
        this.width = this.height = 1;
    }
    this.texture       = null;
    this.glFrameBuffer = null;
    this.depthBuffer   = null;

    // Create a texture to hold the FrameBuffer's data
    var gl = this.context.gl;
    this.texture = new Namespace.Texture2D(context, txIndex, this.width, this.height, pixelType, interpType);

    // Create a GL framebuffer and link the texture to it
    this.glFrameBuffer = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.glFrameBuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.texture.glTexture, 0);
    
    // Maybe also create a depth buffer
    if (createDepthBuffer) {
        this.depthBuffer = gl.createRenderbuffer();
        gl.bindRenderbuffer(gl.RENDERBUFFER, this.depthBuffer);
        gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, this.width, this.height); 
        gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, this.depthBuffer);  
        gl.bindRenderbuffer(gl.RENDERBUFFER, null);      
    }  
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);	
};


/**
 * Deletes the FrameBuffer.
 * 
 */
Namespace.FrameBuffer.prototype.destroy = function() 
{ 
    if (!this.context) { return; } // We are already destroyed

    // Delete the Texture object
    this.texture.destroy();
    this.texture = null;
    
    // Delete the depth buffer, if we have one
    var gl = this.context.gl;
    if (this.depthBuffer) {
        gl.deleteRenderbuffer(this.depthBuffer);
        this.depthBuffer = null;
    }

    // Delete the GL Framebuffer object
    gl.deleteFramebuffer(this.glFrameBuffer);
    this.glFrameBuffer = null;

    this.context = null;
};


/**
 * Resizes the FrameBuffer.
 * 
 * @param {Number} newWidth - The desired width of the frame buffer.
 * @param {Number} newHeight - The desired height of the frame buffer.
 */
Namespace.FrameBuffer.prototype.resize = function(newWidth, newHeight)
{
    newWidth  = Math.round(newWidth);
    newHeight = Math.round(newHeight);
    if ((newWidth === 0) || (newHeight === 0)) {
        Namespace.Logger.Report("FrameBuffer.resize: FrameBuffer size cannot be zero; setting it to 1.", Sev.Warn); 
        newWidth = newHeight = 1;
    }    
    
    if ( (newWidth != this.width) || (newHeight != this.height) ) 
    {
        var gl = this.context.gl;
        this.width = newWidth;
        this.height = newHeight;

        // Resize our texture
        this.texture.resize(newWidth, newHeight);

        // Resize the depth buffer, if we have one
        if (this.depthBuffer) {
            gl.bindRenderbuffer(gl.RENDERBUFFER, this.depthBuffer);
            gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, newWidth, newHeight); // Only DEPTH_COMPONENT16 is guaranteed to be supported by all WebGL implementations
            gl.bindRenderbuffer(gl.RENDERBUFFER, null);           
        }
    }    
};


/**
 * Returns the FrameBuffer's size.
 * 
 */
Namespace.FrameBuffer.prototype.getSize = function()
{ 
    return [this.width, this.height];
};


})( window.BigLime = window.BigLime || {} );







;(function(Namespace, undefined) {
    "use strict";
    var Sev = Namespace.Logger.Severity;

/**
 * @category 3D
 * @classdesc
 * The GLContext class is a wrapper around a WebGLRenderingContext or WebGL2RenderingContext.
 * 
 * @constructor
 * @param {Canvas} canvas - The canvas from which to get the context.
 * @param {Object} [options] - Optional parameters.
 * @param {Number} options.glVersion - The desired WebGL version.
 * @param {Boolean} options.logErrors=false - Whether to check for errors after every WebGL call, and log them.
 * @param {Boolean} options.logCalls=false - Whether to log all WebGL function calls.
 */
Namespace.GLContext = function(canvas, options) 
{ 
    // Initialize members
    this.gl               = null;     
    this.glVersion        = -1; 
    this.canvas           = null;
    this.uniformSetters   = {};

    this.state = {
        currentProgram    : null,
        boundIndexBuffer  : null,
        boundTextures     : null,
        activeTexture     : -1
    };

    // Check whether the browser supports WebGL
    if ( !window.WebGLRenderingContext ) {
        Namespace.Logger.Report("GLContext.ctor: The browser doesn't support WebGL.", Sev.Error);
        return;
    }

    // Sanity check on the version number
    var forceVersion = (options && options.glVersion) ? Number(options.glVersion) : null;
    if ( (forceVersion === 0) || (forceVersion && (forceVersion !== 1) && (forceVersion !== 2)) ) {
        Namespace.Logger.Report("GLContext.ctor: Unsupported WebGL version: " + options.glVersion + ".", Sev.Error);
        return;
    }
    
    // Maybe try to get a WebGL2 context
    if ( !forceVersion || (forceVersion === 2) ) {
        try {
            this.gl = canvas.getContext("webgl2");
            if (this.gl) { this.glVersion = 2; }
        } 
        catch(e) {}
    }

    // Fall back to WebGL1 if necessary
    if (!this.gl) {
        if ( !forceVersion || (forceVersion == 1) ) {
            var names = ["webgl", "experimental-webgl", "webkit-3d", "moz-webgl"];
            for (var i=0; (i < names.length) && !this.gl; i++) {
                try {
                    this.gl = canvas.getContext(names[i]);
                    if (this.gl) { this.glVersion = 1; }
                } 
                catch(e) {}
            }
        }
    }

    // Clear any spurious error flags from the above calls to canvas.getContext
    if (this.gl) { 
        while ( this.gl.getError() != this.gl.NO_ERROR ) {} 
    }

    // Did we fail?
    if (!this.gl) {
        Namespace.Logger.Report("GLContext.ctor: Unable to get WebGL context from canvas.", Sev.Error);    
        return;
    }
    this.canvas = this.gl.canvas;

    // If logging was requested, then wrap the WebGLContext in a debug context
    var debug = options && (options.logErrors || options.logCalls);
    if (debug) {
        var logErrorFunc = options.logErrors ? Namespace.GLContext._logWebGLError : function(){}; 
        var logCallsFunc = options.logCalls  ? Namespace.GLContext._logWebGLCall : function(){};
        this.gl = Namespace.DebugUtils.makeDebugContext(this.gl, logErrorFunc, logCallsFunc);       
        Namespace.Logger.ConsoleThresh = Sev.Debug; 
    }

    // Create our list of WebGL constants
    this._initializeConstants();

    // Create a table of setter functions for uniform variables
    this.uniformSetters = this._tabulateUniformSetters();

    // We keep track of bound textures
    this.state.boundTextures = new Array(this.GlMaxTextures);

    // Set some defaults for the WebGLContext
    var gl = this.gl;
    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.BACK);    
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1); // Allow buffers to have sizes that are non-multiples-of-4 
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);

    this.contextLostListener = function(e) { 
        alert("WebGL context lost. \nPlease reload the page or restart the browser and try again with a smaller data set."); };
    this.canvas.addEventListener("webglcontextlost", this.contextLostListener);

    // Log a message
    var msg = "Created WebGL" + this.glVersion.toString() + (debug ? " debug" : "") + " context.";
    Namespace.Logger.Report(msg, Sev.Debug);    
};


/**
 * Destructor.
 * 
 */
Namespace.GLContext.prototype.destroy = function() 
{ 
    if (this.gl) { 
        this.canvas.removeEventListener("webglcontextlost", this.contextLostListener);
        this.gl = null;
        this.glVersion = -1; 
        this.uniformSetters = null;
    }
};


/** 
 * Static flag indicating whether WebGL2 is supported on the current device.
 * @private
 */
Namespace.GLContext._isWebGL2Supported = undefined;


/**
 * Determines whether the current device supports WebGL2.
 * @static
 * @return {Boolean} True if WebGL2 is supported, otherwise false.
 */
Namespace.GLContext.isWebGL2Supported = function() 
{
    if (Namespace.GLContext._isWebGL2Supported === undefined) {
        var gl = null;
        try {
            // Try to create a WebGL2RenderingContext
            gl = document.createElement("canvas").getContext("webgl2");
        } 
        catch(e) {}    
        Namespace.GLContext._isWebGL2Supported = !!gl;
    }
    return Namespace.GLContext._isWebGL2Supported;
};


/**
 * Convenience method for creating a ShaderProgram object, and setting it as the current program.
 * 
 * @param {String} vCode - The vertex shader code.
 * @param {String} fCode - The fragment shader code.
 * @param {Object} [options] - Optional parameters.
 * @param {String} [options.name] - A name for the program.
 * @param {Object} [options.vSubs] - A map of text substitutions to be made in vCode.
 * @param {Object} [options.fSubs] - A map of text substitutions to be made in fCode.
 * @param {Boolean} [options.compile=true] - Whether to compile the program immediately.
 * @return {ShaderProgram} The created program.
 */
Namespace.GLContext.prototype.createProgram = function(vCode, fCode, options) 
{ 
    var name    = options ? options.name    : "";
    var vSubs   = options ? options.vSubs   : null;
    var fSubs   = options ? options.fSubs   : null;
    var compile = (options && (typeof(options.compile) !== 'undefined')) ? !!options.compile : true;
     
    var prog = new Namespace.ShaderProgram(this, name, vCode, fCode, vSubs, fSubs, compile);
    return prog;
};


/**
 * Convenience method for creating an AttributeBuffer.
 * 
 * @param {Array} data - The data to be stored in the buffer.
 * @param {Number} [attrDim=3] - The number of components per attribute. Must be 1, 2, 3, or 4.
 * @param {Object} [options] - Optional parameters. 
 * @param {GLenum} options.dataType=gl.FLOAT - The buffer's data type (gl.FLOAT, gl.BYTE, gl.SHORT, gl.UNSIGNED_BYTE, gl.UNSIGNED_SHORT, or gl.HALF_FLOAT)
 * @param {Boolean} options.normalizeValues=false - Whether to normalize integer data values when casting to float. 
 * @param {GLenum} options.drawMode=gl.STATIC_DRAW - A data-usage hint for WebGL (gl.STATIC_DRAW, gl.DYNAMIC_DRAW, or gl.STREAM_DRAW)
 * @return {AttributeBuffer} The created buffer.
 */
Namespace.GLContext.prototype.createAttrBuffer = function(data, attrDim, options)  
{ 
    return new Namespace.AttributeBuffer(this, data, attrDim, options);
};


/**
 * Convenience method for creating an IndexBuffer.
 * 
 * @param {Array} data - The data to be stored in the buffer.
 * @param {Number} [elemSize=2] - The number of bytes allocated for each array element. Must be 1,2, or 4.
 * @param {GLenum} [drawMode=gl.STATIC_DRAW] - A data-usage hint for WebGL (gl.STATIC_DRAW, gl.DYNAMIC_DRAW, or gl.STREAM_DRAW)
 * @return {IndexBuffer} The created buffer.
 */
Namespace.GLContext.prototype.createIndexBuffer = function(data, elemSize, drawMode)  
{ 
    return new Namespace.IndexBuffer(this, data, elemSize, drawMode);
};


/**
 * Binds the given index buffer in WebGL, if it's not already bound.
 * 
 */
Namespace.GLContext.prototype.bindIndexBuffer = function(buf)
{
    if ( !buf && (this.state.boundIndexBuffer !== null) ) {
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, null);
        this.state.boundIndexBuffer = null;
    }
    else if ( buf && (this.state.boundIndexBuffer != buf.glBuffer) ) {
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, buf.glBuffer);
        this.state.boundIndexBuffer = buf.glBuffer;
    }
};


/**
 * Un-binds the given index buffer in WebGL, if it's bound.
 * 
 */
Namespace.GLContext.prototype.unbindIndexBuffer = function(buf)
{
    if (this.state.boundIndexBuffer == buf.glBuffer) {
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, null);
        this.state.boundIndexBuffer = null;
    }
};


/**
 * Binds a given texture in WebGL, if it's not already bound.
 * 
 */
Namespace.GLContext.prototype.bindTexture = function(tx)
{
    var gl = this.gl;

    if (this.state.activeTexture != tx.txIndex) {
        gl.activeTexture(gl.TEXTURE0 + tx.txIndex);
        this.state.activeTexture = tx.txIndex;
    }

    if ( this.state.boundTextures[tx.txIndex] != tx.glTexture ) {
        gl.bindTexture( (tx.is3D ? gl.TEXTURE_3D : gl.TEXTURE_2D), tx.glTexture );
        this.state.boundTextures[tx.txIndex] = tx.glTexture;
    }
};


/**
 * Un-binds a given texture in WebGL, if it's bound.
 * 
 */
Namespace.GLContext.prototype.unbindTexture = function(tx)
{
    var gl = this.gl;
    
    if ( this.state.boundTextures[tx.txIndex] == tx.glTexture ) {
        gl.activeTexture(gl.TEXTURE0 + tx.txIndex);
        gl.bindTexture( (tx.is3D ? gl.TEXTURE_3D : gl.TEXTURE_2D), null );
        this.state.boundTextures[tx.txIndex] = null;
        this.state.activeTexture = tx.txIndex;
    }
};


/**
 * Sets a given program to be the current program.
 * 
 * @param {ShaderProgram} prog - The program to make current.
 */
Namespace.GLContext.prototype.setCurrentProgram = function(prog) 
{
    if (!prog) {
        this.gl.useProgram(null);
        this.state.currentProgram = null;
        return;
    } 
    if (prog.context !== this) {
        Namespace.Logger.Report("GLContext.setCurrentProgram: Invalid program.", Sev.Error);  
        return;
    }
    if (this.state.currentProgram != prog) {
        this.gl.useProgram(prog.glProgram);
        this.state.currentProgram = prog;     
    }
};


/**
 * Indicates whether a given ShaderProgram is the current one.
 * 
 * @param {ShaderProgram} prog - The program to check.
 */
Namespace.GLContext.prototype.isCurrentProgram = function(prog) 
{
    return (this.state.currentProgram == prog);   
};


/**
 * Clears the canvas to a given background color.
 * 
 * @param {Color} [color=Black] - The desired background color.
 */
Namespace.GLContext.prototype.clearCanvas = function(color) 
{ 
    var c = Namespace.Color.ScaleTo1( color || Namespace.Color.Black() );
    this.gl.clearColor( c[0], c[1], c[2], c[3] );
    this.gl.clear(this.gl.COLOR_BUFFER_BIT); 
};


/**
 * Error-logging method, used in debug mode.
 * @static
 * @private
 * 
 */
Namespace.GLContext._logWebGLError = function(err, funcName, args)  {    
    var argStr = "";
    var numArgs = args.length;
    for (var i = 0; i < numArgs; ++i) {
        argStr += ((i === 0) ? '' : ', ') + Namespace.DebugUtils.glFunctionArgToString(funcName, numArgs, i, args[i]);
    }
    var msg = "WebGL error: " + Namespace.DebugUtils.glEnumToString(err) + " in " + funcName + "(" + argStr + ")";     
    Namespace.Logger.Report(msg, Sev.Error);
};


/**
 * Function-logging method, used in debug mode.
 * @static
 * @private
 * 
 */
Namespace.GLContext._logWebGLCall = function(funcName, args) {
    var argStr = "";
    var numArgs = args.length;
    for (var i = 0; i < numArgs; ++i) {
        argStr += ((i === 0) ? '' : ', ') + Namespace.DebugUtils.glFunctionArgToString(funcName, numArgs, i, args[i]);
    }
    var msg = "3DLib WebGL trace: "+ funcName + "(" + argStr + ")";
    Namespace.Logger.Report(msg, Sev.Debug);
};


/**
 * Creates a table of setter functions for uniform variables.
 * @private
 *
 */
Namespace.GLContext.prototype._tabulateUniformSetters = function()
{
    var gl = this.gl;
    var uTable = {};

    var IsArray = function(x) {
        return Array.isArray(x) || (ArrayBuffer.isView(x) && !(x instanceof DataView));
    };

    // Map each of the uniform types to a setter function
    uTable[gl.FLOAT_VEC2] = function(loc, val) { return gl.uniform2fv(loc, val); };
    uTable[gl.FLOAT_VEC3] = function(loc, val) { return gl.uniform3fv(loc, val); };
    uTable[gl.FLOAT_VEC4] = function(loc, val) { return gl.uniform4fv(loc, val); };
    uTable[gl.FLOAT_MAT2] = function(loc, val) { return gl.uniformMatrix2fv(loc, false, val); };
    uTable[gl.FLOAT_MAT3] = function(loc, val) { return gl.uniformMatrix3fv(loc, false, val); };
    uTable[gl.FLOAT_MAT4] = function(loc, val) { return gl.uniformMatrix4fv(loc, false, val); };
    uTable[gl.FLOAT]      = function(loc, val) { return IsArray(val) ? gl.uniform1fv(loc, val) : gl.uniform1f(loc, val); };

    uTable[gl.INT_VEC2]   = function(loc, val) { return gl.uniform2iv(loc, val); };
    uTable[gl.INT_VEC3]   = function(loc, val) { return gl.uniform3iv(loc, val); };
    uTable[gl.INT_VEC4]   = function(loc, val) { return gl.uniform4iv(loc, val); };
    uTable[gl.INT]        = function(loc, val) { return IsArray(val) ? gl.uniform1iv(loc, val) : gl.uniform1i(loc, val); };
    uTable[gl.SAMPLER_2D] = uTable[gl.INT];
    uTable[gl.SAMPLER_CUBE] = uTable[gl.INT];

    var bMap = function(v) { return v ? 1 : 0; };
    uTable[gl.BOOL_VEC2]  = function(loc, val) { return gl.uniform2iv(loc, val.map(bMap)); };
    uTable[gl.BOOL_VEC3]  = function(loc, val) { return gl.uniform3iv(loc, val.map(bMap)); };
    uTable[gl.BOOL_VEC4]  = function(loc, val) { return gl.uniform4iv(loc, val.map(bMap)); };
    uTable[gl.BOOL]       = function(loc, val) { return IsArray(val) ? gl.uniform1iv(loc, val.map(bMap)) : gl.uniform1i(loc, bMap(val)); };

    // Append additional setters if WebGL2 is supported
    if (this.glVersion > 1) 
    {
        uTable[gl.SAMPLER_3D]                    = uTable[gl.INT];
        uTable[gl.SAMPLER_2D_SHADOW]             = uTable[gl.INT];
        uTable[gl.SAMPLER_2D_ARRAY]              = uTable[gl.INT];
        uTable[gl.SAMPLER_2D_ARRAY_SHADOW]       = uTable[gl.INT];
        uTable[gl.SAMPLER_CUBE_SHADOW]           = uTable[gl.INT];
        uTable[gl.INT_SAMPLER_2D]                = uTable[gl.INT];
        uTable[gl.INT_SAMPLER_3D]                = uTable[gl.INT];
        uTable[gl.INT_SAMPLER_CUBE]              = uTable[gl.INT];
        uTable[gl.INT_SAMPLER_2D_ARRAY]          = uTable[gl.INT];
        uTable[gl.UNSIGNED_INT_SAMPLER_2D]       = uTable[gl.INT];
        uTable[gl.UNSIGNED_INT_SAMPLER_3D]       = uTable[gl.INT];
        uTable[gl.UNSIGNED_INT_SAMPLER_CUBE]     = uTable[gl.INT];
        uTable[gl.UNSIGNED_INT_SAMPLER_2D_ARRAY] = uTable[gl.INT];

        uTable[gl.UNSIGNED_INT_VEC2] = function(loc, val) { return gl.uniform2uiv(loc, val); };
        uTable[gl.UNSIGNED_INT_VEC3] = function(loc, val) { return gl.uniform3uiv(loc, val); };
        uTable[gl.UNSIGNED_INT_VEC4] = function(loc, val) { return gl.uniform4uiv(loc, val); };
        uTable[gl.UNSIGNED_INT]      = function(loc, val) { return IsArray(val) ? gl.uniform1uiv(loc, val) : gl.uniform1ui(loc, val); };
 
        uTable[gl.FLOAT_MAT2x3] = function(loc, val) { return gl.uniformMatrix2x3fv(loc, false, val); };
        uTable[gl.FLOAT_MAT2x4] = function(loc, val) { return gl.uniformMatrix2x4fv(loc, false, val); };
        uTable[gl.FLOAT_MAT3x2] = function(loc, val) { return gl.uniformMatrix3x2fv(loc, false, val); };        
        uTable[gl.FLOAT_MAT3x4] = function(loc, val) { return gl.uniformMatrix3x4fv(loc, false, val); };
        uTable[gl.FLOAT_MAT4x2] = function(loc, val) { return gl.uniformMatrix4x2fv(loc, false, val); };
        uTable[gl.FLOAT_MAT4x3] = function(loc, val) { return gl.uniformMatrix4x3fv(loc, false, val); };        
    }
                                    
    return uTable;
};


/**
 * Builds a list of WebGL constants.
 * @private
 *
 */
Namespace.GLContext.prototype._initializeConstants = function()
{
    var gl = this.gl;
    this.GlMaxTextures         = gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS); 
    this.GlMaxTextureSize      = gl.getParameter(gl.MAX_TEXTURE_SIZE); 
    this.GlMax3DTextureSize    = (this.glVersion > 1) ? gl.getParameter(gl.MAX_3D_TEXTURE_SIZE) : 0; 
    this.GlMaxFragUniformVecs  = gl.getParameter(gl.MAX_FRAGMENT_UNIFORM_VECTORS);
    this.GlMaxVertUniformVecs  = gl.getParameter(gl.MAX_VERTEX_UNIFORM_VECTORS);
    this.GlMaxRenderBufSize    = gl.getParameter(gl.MAX_RENDERBUFFER_SIZE);
    this.GlVersionInfo         = gl.getParameter(gl.VERSION);

    var dbgRenderInfo = gl.getExtension("WEBGL_debug_renderer_info");
    if (dbgRenderInfo !== null) {
        this.RendererInfo = gl.getParameter(dbgRenderInfo.UNMASKED_RENDERER_WEBGL);
        this.VendorInfo = gl.getParameter(dbgRenderInfo.UNMASKED_VENDOR_WEBGL);
    } else {
        this.RendererInfo = gl.getParameter(gl.RENDERER) || 'Unknown';
        this.VendorInfo = gl.getParameter(gl.VENDOR) || 'Unknown';   
    }    

    // TODO: Add more of these as needed
};


/**
 * Returns the size (in bytes) of a given data type.
 * 
 * @param {GLenum} type - The data type to evaluate.
 */
Namespace.GLContext.prototype.sizeOf = function(type) 
{ 
    var result = -1;
    var gl = this.gl;

    if ( (type === gl.FLOAT) || (type === gl.UNSIGNED_INT) || (type === gl.INT) ) {
        result = 4;
    }
    else if ( (type === gl.UNSIGNED_SHORT) || (type === gl.SHORT) ) {
        result = 2;
    }
    else if ( (type === gl.UNSIGNED_BYTE) || (type === gl.BYTE)) {
        result = 1;
    }
    else if ((this.glVersion > 1) && (type === gl.HALF_FLOAT)) {
        result = 2; 
    }

    return result;
};



})( window.BigLime = window.BigLime || {} );







;(function(Namespace, undefined) {
    "use strict";

/**
 * @category 3D
 * @classdesc
 * This class implements a histogram of pixel values from a volume dataset.
 * 
 * @constructor
 * @param {Number} numBins - The number of bins in the histogram.
 */
Namespace.Histogram3D = function(numBins) 
{
    this.data           = new Uint32Array(numBins);
    this.numBins        = numBins;
    this.binWidth       = 65536.0/numBins;
    this.minVal         = 65535;
    this.maxVal         = 0;
    this.threshedMinVal = 0;
    this.threshedMaxVal = 0;
    this.threshPercent  = null;
};


/**
 * Clears the histogram data
 * 
 */
Namespace.Histogram3D.prototype.clear = function()
{
    for (var i=0; i<this.numBins; i++) {
        this.data[i] = 0;
    }
    this.minVal = 65535;
    this.maxVal = 0;
    this.threshedMinVal = 0;
    this.threshedMaxVal = 0;
    this.threshPercent = null;
};


/**
 * Adds the pixel values from a given buffer to the histogram.
 * 
 * @param {Array} pixelBuffer - The buffer containing pixel data.
 * @param {Number} bytesPerPixel - The number of bytes per pixel value.
 * @param {Boolean} isBigEndian - Whether the pixel values are stored in big-endian format.
 * 
 */
Namespace.Histogram3D.prototype.addImage = function(pixelBuffer, bytesPerPixel, isBigEndian)
{
    if (!pixelBuffer) { return; }

    var u8Buffer = new Uint8Array(pixelBuffer);
    var numBytes = u8Buffer.length;
    var i, pixVal;
    
    if (bytesPerPixel == 1)
    {
        for (i=0; i<numBytes; i+=8) { // Sample just a fraction of the pixels, for performance
            pixVal = u8Buffer[i];
            this.data[(pixVal/this.binWidth)|0]++;
            if (pixVal < this.minVal) { this.minVal = pixVal; }
            if (pixVal > this.maxVal) { this.maxVal = pixVal; }        
        }
    }
    else if (bytesPerPixel == 2)
    {
        if (isBigEndian) {
            for (i=0; i<numBytes; i+=16) {
                pixVal = 256*u8Buffer[i] + u8Buffer[i+1];
                this.data[(pixVal/this.binWidth)|0]++;
                if (pixVal < this.minVal) { this.minVal = pixVal; }
                if (pixVal > this.maxVal) { this.maxVal = pixVal; }        
            }
        }
        else {
            for (i=0; i<numBytes; i+=16) {
                pixVal = u8Buffer[i] + 256*u8Buffer[i+1];
                this.data[(pixVal/this.binWidth)|0]++;
                if (pixVal < this.minVal) { this.minVal = pixVal; }
                if (pixVal > this.maxVal) { this.maxVal = pixVal; }        
            }
        }
    }
};


/**
 * Computes window/level values appropriate for the histogram's distribution.
 * 
 * @param {Number} threshPercent - Gets the minimum and maximum pixel values,
 * after discarding a specified percentage of pixels at the histogram edges.
 * 
 */
Namespace.Histogram3D.prototype.getThreshedMinMax = function(threshPercent)
{
    // Maybe we can avoid the computation
    if (this.threshPercent === threshPercent) {
        return [this.threshedMinVal, this.threshedMaxVal];
    }
    
    var numNonZeroPixels = 0;
    for (var i=1; i<this.numBins; i++) { numNonZeroPixels += this.data[i]; }

    // Find lower window limit
    var numTailPixels = Math.round(0.01*threshPercent * numNonZeroPixels);
    var numPixelsCounted = 0, binIndex = 1;
    while ((numPixelsCounted <= numTailPixels) && (binIndex < this.numBins))
    {
        numPixelsCounted += this.data[binIndex];
        binIndex++;
        while ((binIndex < this.numBins) && (this.data[binIndex] === 0)) { binIndex++; }
    }
    var loThresh = (binIndex+0.5) * this.binWidth;

    // Find upper window limit
    numPixelsCounted = 0;
    binIndex = this.numBins-1;
    while ((binIndex >= 0) && (numPixelsCounted <= numTailPixels))
    {
        numPixelsCounted += this.data[binIndex];
        binIndex--;
        while ((binIndex >= 0) && (this.data[binIndex] === 0)) { binIndex--; }
    }
    var hiThresh = 65535 - (this.numBins-1 - binIndex + 0.5) * this.binWidth;
    if (hiThresh < loThresh) { hiThresh = loThresh; }

    // cache the results
    this.threshPercent = threshPercent;
    this.threshedMinVal = loThresh;
    this.threshedMaxVal = hiThresh;
    return [this.threshedMinVal, this.threshedMaxVal];
};


})( window.BigLime = window.BigLime || {} );







;(function(Namespace, undefined) {
    "use strict";
    var Sev = Namespace.Logger.Severity;

/**
 * @category 3D
 * @classdesc
 * The IndexBuffer class is a wrapper around a WebGL buffer object, used for storing vertex indices.
 * 
 * @constructor
 * @param {GLContext} context - The rendering context.
 * @param {Array} data - The data to be stored in the buffer.
 * @param {Number} [elemSize=2] - The number of bytes allocated for each array element. Must be 1,2, or 4.
 * @param {GLenum} [drawMode=gl.STATIC_DRAW] - A data-usage hint for WebGL. Must be gl.STATIC_DRAW, gl.DYNAMIC_DRAW, or gl.STREAM_DRAW.
 */
Namespace.IndexBuffer = function(context, data, elemSize, drawMode) 
{ 
    // Initialize members
    var gl = context.gl;
    this.context    = context;    
    this.elemSize   = elemSize || 2;
    this.dataType   = (elemSize == 1) ? gl.UNSIGNED_BYTE : (elemSize == 2) ? gl.UNSIGNED_SHORT : gl.UNSIGNED_INT;
    this.drawMode   = drawMode || gl.STATIC_DRAW;  
    this.numIndices = 0;
    this.glBuffer   = null;

    // Check the inputs
    if ( (elemSize != 1) && (elemSize != 2) && (elemSize != 4) ) {
        Namespace.Logger.Report("IndexBuffer ctor: Invalid elemSize", Sev.Error);
        return; 
    }
    if ( (elemSize > 2) && (context.glVersion < 2) && !gl.getExtension('OES_element_index_uint')) {
        Namespace.Logger.Report("IndexBuffer ctor: Unsupported elemSize", Sev.Error);
        return; 
    }

    // Fill the WebGL buffer with the supplied data
    var aData = this._coerceData(data);
    if (!aData) {
        Namespace.Logger.Report("IndexBuffer.ctor: Invalid data array.", Sev.Error);
        return;
    }

    this.numIndices = aData.length;
    this.glBuffer = gl.createBuffer();
    this.bind();
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, aData, this.drawMode);
};


/**
 * Destructor.
 * 
 */
Namespace.IndexBuffer.prototype.destroy = function() 
{ 
    // Check if we are already destroyed
    if (!this.context) { 
        return; 
    } 

    // Clean up
    var gl = this.context.gl;
    this.bind();
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, 1, this.drawMode);

    this.unbind();
    if (this.glBuffer) {
        gl.deleteBuffer(this.glBuffer);
        this.glBuffer = null;
    }
    this.context = null;
};



/**
 * Binds the buffer to its attachment point in WebGL.
 * 
 */
Namespace.IndexBuffer.prototype.bind = function() 
{ 
    this.context.bindIndexBuffer(this);
};


/**
 * Un-binds the buffer from its attachment point in WebGL.
 * 
 */
Namespace.IndexBuffer.prototype.unbind = function() 
{ 
    this.context.unbindIndexBuffer(this);
};


/**
 * Tries to coerce a given data array to this buffer's data type.
 * 
 * @param {Array} data - The data to convert.
 */
Namespace.IndexBuffer.prototype._coerceData = function(data) 
{ 
    var gl = this.context.gl;
    try 
    {
        if (this.dataType === gl.UNSIGNED_INT) {
            return (data instanceof Uint32Array) ? data : new Uint32Array(data);
        }
        else if (this.dataType === gl.UNSIGNED_SHORT) {
            return (data instanceof Uint16Array) ? data : new Uint16Array(data);
        }
        else if (this.dataType === gl.UNSIGNED_BYTE) {
            return (data instanceof Uint8Array) ? data : new Uint8Array(data);
        }
    }
    catch (err) { }
    return null;
};


/**
 * Modifies the buffer's data.
 * 
 * @param {ArrayBuffer} newData - The new data to set in the buffer.
 * @param {Number} [offset=0] - The offset in bytes where the data replacement will start.
 */
Namespace.IndexBuffer.prototype.setData = function(newData, offset) 
{ 
    var cData = this._coerceData(newData);   
    if (!cData) {
        Namespace.Logger.Report("IndexBuffer.setData: Invalid data array.", Sev.Error);
        return;
    } 

    var gl = this.context.gl;
    this.bind();
    gl.bufferSubData(gl.ELEMENT_ARRAY_BUFFER, (offset || 0), cData);  // WebGL will raise an error if newData is invalid or too large
};


})( window.BigLime = window.BigLime || {} );







;(function(Namespace, undefined) {
	"use strict";
    var vec3 = glMatrix.vec3;


/**
 * @category 3D
 * @classdesc
 * This class represents a directional light source.
 * 
 * @constructor
 * 
 */
Namespace.Light = function(src) 
{  
    this.diffuse         = src ? src.diffuse : 0.1;
    this.specStrength    = src ? src.specStrength : 0;
    this.specExp         = src ? src.specExp : 32;
    this.shadowDarkness  = src ? src.shadowDarkness : 0.0;
    this.shadowSoftness  = src ? src.shadowSoftness : 0.75;
    this.dir             = src ? vec3.clone(src.dir) : vec3.fromValues(0,0,1);
};


/**
 * Copies settings from another light.
 * 
 */
Namespace.Light.prototype.updateFrom = function(src) 
{  
    this.diffuse         = src.diffuse;
    this.specStrength    = src.specStrength;
    this.specExp         = src.specExp;
    this.shadowDarkness  = src.shadowDarkness;
    this.shadowSoftness  = src.shadowSoftness;
    vec3.copy(this.dir, src.dir);
};


/**
 * Checks whether this light is equal to another one, by value.
 * 
 */
Namespace.Light.prototype.valueEquals = function(that) 
{  
    var tol = 1e-4;

    if (!Namespace.Utils.floatEquals(this.diffuse, that.diffuse, tol)) { return false; }
    if (!Namespace.Utils.floatEquals(this.specStrength, that.specStrength, tol)) { return false; }
    if (!Namespace.Utils.floatEquals(this.specExp, that.specExp, tol)) { return false; }
    if (!Namespace.Utils.floatEquals(this.shadowDarkness, that.shadowDarkness, tol)) { return false; }
    if (!Namespace.Utils.floatEquals(this.shadowSoftness, that.shadowSoftness, tol)) { return false; }
    if (!Namespace.Utils.floatEquals(this.dir[0], that.dir[0], tol)) { return false; }
    if (!Namespace.Utils.floatEquals(this.dir[1], that.dir[1], tol)) { return false; }
    if (!Namespace.Utils.floatEquals(this.dir[2], that.dir[2], tol)) { return false; }

    return true;
};


})( window.BigLime = window.BigLime || {} );







;(function(Namespace, undefined) {
	"use strict";
    var vec2 = glMatrix.vec2;
    var vec3 = glMatrix.vec3;

    
/**
 * @category 3D
 * @classdesc
 * This class implements a control for orienting a directional light.
 * 
 * @constructor
 * 
 */
Namespace.LightPositioner = function(parent) 
{    
    this.mainDiv   = parent;
    this.canvas    = null;
    this.ptRadius  = 10;
    this.lightPosW = vec2.create();
    this.active    = false;
    this.defaultLightDir = [0.32, -0.16, 0.93];

    this._buildUi();
    this.setLightDirection( this.defaultLightDir );
    this._redraw();
    
    this.interactor = new Namespace.Interactor(this.canvas, 'lightPos');
    this.interactor.addEventListener('start move end', this._onInteract.bind(this));
};


/**
 * Builds the user interface.
 * @private
 */
Namespace.LightPositioner.prototype._buildUi = function() 
{ 
    var Ui = Namespace.Ui;
    Ui.StyleElement(this.mainDiv, {margin:'auto'});
    this.canvSize = Math.min( parseInt(this.mainDiv.style.width), parseInt(this.mainDiv.style.height) );
    this.padRadius = (this.canvSize - 2*this.ptRadius)/2;
       
    // Create the canvas
    this.canvas = Ui.CreateElement('canvas', 'canvas', this.mainDiv, {width:this.canvSize, height:this.canvSize}, 
        {width:this.canvSize, height:this.canvSize}
    );
    this.canvas.addEventListener( (Namespace.Utils.isTouchDevice() ? 'doubleTap' : 'dblclick'), this._onDoubleClick.bind(this) );
};


/**
 * Redraws the UI.
 * @private
 * 
 */
Namespace.LightPositioner.prototype._redraw = function() 
{
    var ctx = this.canvas.getContext('2d');
    var w = this.canvas.width;
    var h = this.canvas.height;

    // Clear the canvas
    ctx.clearRect(0,0,w,h);
    ctx.beginPath();

    // Draw the background
    ctx.fillStyle = ctx.fillStyle = 'rgba(255, 255, 255, 0.0)';
    ctx.fillRect(0,0,w,h);

    // Draw the circle
    var ctrX = w/2;
    var ctrY = h/2;
    ctx.beginPath();
    ctx.arc(ctrX, ctrY, this.padRadius, 0, 2*Math.PI);
    ctx.fillStyle = '#D2B48C';
    ctx.fill();

    // Draw the current point location
    ctx.beginPath();
    ctx.arc(this.lightPosW[0], this.lightPosW[1], this.ptRadius, 0, 2*Math.PI);
    ctx.fillStyle = '#8B4513';
    ctx.fill();    
    
    // Draw the crosshair
    ctx.beginPath();
    ctx.moveTo(ctrX, ctrY-this.ptRadius-5);
    ctx.lineTo(ctrX, ctrY+this.ptRadius+5);   
    ctx.moveTo(ctrX-this.ptRadius-5, ctrY);
    ctx.lineTo(ctrX+this.ptRadius+5, ctrY);   
    ctx.strokeStyle = 'black';
    ctx.stroke();
};


/**
 * Gets the current light position.
 * 
 */
Namespace.LightPositioner.prototype.getLightDirection = function() 
{ 
    var dx = -(this.lightPosW[0] - this.canvas.width/2);    
    var dy =   this.lightPosW[1] - this.canvas.height/2;
    var dz = Math.sqrt(this.padRadius*this.padRadius - dx*dx - dy*dy);

    var result = vec3.fromValues(dx, dy, dz);
    vec3.normalize(result, result);

    return result;
};


/**
 * Sets the light direction.
 * @param {vec3} newDir 
 * 
 */
Namespace.LightPositioner.prototype.setLightDirection = function(newDir) 
{ 
    var newDirP = vec3.clone(newDir);
    vec3.normalize(newDirP, newDirP);
    vec3.scale(newDirP, newDirP, this.padRadius);

    this.lightPosW[0] = -newDirP[0] + this.canvas.width/2;
    this.lightPosW[1] =  newDirP[1] + this.canvas.height/2;   
    this._redraw();

    this.trigger("change");
};



/**
 * Handler for direct interaction with the canvas.
 * @private
 * 
 * @param {Event} event - event info.
 * 
 */
Namespace.LightPositioner.prototype._onInteract = function(event)
{
    if (event.type == 'start')
    {
        // Hit test
        if (vec2.distance(this.interactor.currPoint, this.lightPosW) > this.ptRadius) { return; }
        
        // Change state and notify
        this.active = true;
        this.trigger("changeStart");
    }

    else if (event.type == 'move')
    {
        if (!this.active) { return; }

        vec2.add(this.lightPosW, this.lightPosW, this.interactor.deltaPrev);
    
        // Make sure the point stays inside the circle
        var ctr  = vec2.fromValues(this.canvas.width/2, this.canvas.height/2);
        var posC = vec2.create(); vec2.subtract(posC, this.lightPosW, ctr);
        var lenC = vec2.length(posC);
        if (lenC > 0.98*this.padRadius) {
            vec2.scale(posC, posC, 0.98*this.padRadius/lenC);
            vec2.add(this.lightPosW, posC, ctr);
        }
        this._redraw();
    
        this.trigger("change"); 
    }

    else if (event.type == 'end')
    {
        if (this.active) {
            this.active = false;
            this.trigger("changeEnd");
        }
    }    
};


/**
 * Handler for double-click events.
 * @param {Event} event 
 * 
 * @private
 */
Namespace.LightPositioner.prototype._onDoubleClick = function() 
{ 
    // Reset to a default position
    this.setLightDirection( this.defaultLightDir );
};


/**
 * Attaches an event handler.
 * 
 * @param {String} name - The name of the event.
 * @param {Function} fn - The function to call when the event occurs.
 * 
 */
Namespace.LightPositioner.prototype.addEventListener = function(eventName, fn)
{
	Namespace.Notifier.prototype.addEventListener.call(this, eventName, fn);
};


/**
 * Removes an event handler.
 * 
 * @param {String} name - The name of the event.
 * @param {Function} fn - The handler function to remove.
 * 
 */
Namespace.LightPositioner.prototype.removeEventListener = function(eventName, fn)
{
	Namespace.Notifier.prototype.removeEventListener.call(this, eventName, fn);
};


/**
 * Fires a specified event.
 * 
 * @param {String} name - The name of the event to fire.
 * 
 */
Namespace.LightPositioner.prototype.trigger = function(eventName, args)
{
	Namespace.Notifier.prototype.trigger.call(this, eventName, args);
};



})( window.BigLime = window.BigLime || {} );







;(function(Namespace, undefined) {
	"use strict";


/**
 * @category 3D
 * @classdesc
 * This class wraps a pair of directional lights along with an ambient light.
 * 
 * @constructor
 * 
 */
Namespace.LightSet = function(src) 
{  
    if (src) {
        this.ambientLight = src.ambientLight;
        this.dirLights = [new Namespace.Light(src.dirLights[0]), new Namespace.Light(src.dirLights[1]) ];
    }
    else {
        this.ambientLight = 0.5;
        this.dirLights = [ new Namespace.Light(), new Namespace.Light() ];
    }
};


/**
 * Copies settings from another LightSet.
 * 
 */
Namespace.LightSet.prototype.updateFrom = function(src) 
{  
    this.ambientLight = src.ambientLight;
    this.dirLights[0].updateFrom(src.dirLights[0]);
    this.dirLights[1].updateFrom(src.dirLights[1]);
};


/**
 * Checks whether this LightSet is equal to another one, by value.
 * 
 */
Namespace.LightSet.prototype.valueEquals = function(that) 
{  
    var tol = 1e-4;

    if (!Namespace.Utils.floatEquals(this.ambientLight, that.ambientLight, tol)) { return false; }
    if (!this.dirLights[0].valueEquals(that.dirLights[0])) { return false; }
    if (!this.dirLights[1].valueEquals(that.dirLights[1])) { return false; }

    return true;
};



/**
 * Indicates whether the LightSet uses shadows. 
 * 
 */
Namespace.LightSet.prototype.shadowsEnabled = function()
{
    return this.dirLights.some(lt => lt.shadowDarkness > 0);
}    



})( window.BigLime = window.BigLime || {} );







;(function(Namespace, undefined) {
    "use strict";


/**
 * @category 3D
 * @classdesc
 * This class encapsulates the reflective properties of a Graphic object.
 * 
 * @constructor
 * @param {Color} [color=red] - The color of the material.
 * @param {Boolean} [flatShade=false] - Whether to render the material with flat shading (if not, then Gouraud shading is used).
 * @param {Number} [ambient=0.5] - The amount of ambient light emitted by the material.
 * @param {Number} [diffuse=0.5] - The amount of diffuse reflection from the material.
 * @param {Number} [specStrength=0.5] - The amount of specular reflection from the material.
 * @param {Number} [specPower=32] - The sharpness of the specular reflection.
 */
Namespace.Material = function(color, flatShade, ambient, diffuse, specStrength, specPower) 
{ 
    this.flatShade    = !!flatShade;
    this.ambient      = ambient || ((ambient === 0.0) ? 0.0 : 0.5);
    this.diffuse      = diffuse || ((diffuse === 0.0) ? 0.0 : 0.5);
    this.specStrength = specStrength || ((specStrength === 0.0) ? 0.0 : 0.5);
    this.specPower    = specPower || ((specPower === 0.0) ? 0.0 : 32.0);
    this.color        = (!color) ? [255, 0, 0, 255] : (color instanceof Namespace.Color) ? color.toArray() : color.slice();
    if (this.color.length === 3) { this.color.push(255); }
};



/**
 * Clones the material.
 * 
 */
Namespace.Material.prototype.clone = function() 
{ 
    return new Namespace.Material(this.color, this.flatShade, this.ambient, this.diffuse, this.specStrength, this.specPower);
};



})( window.BigLime = window.BigLime || {} );







;(function(Namespace, undefined) {
    "use strict";

/**
 * @category 3D
 * @classdesc
 * This class manages a set of Mesh objects.
 * 
 * @constructor
 * @param {VolumeT2|VolumeT3} volume - The volume that the meshes will be attached to.
 */
Namespace.MeshManager = function(volume) 
{ 
    this.volume         = volume;
    this.meshes         = [];
    this.vertexBuffer   = null;
    this.normalBuffer   = null;
    this.colorBuffer    = null;    
    this.materialBuffer = null;    
    this.bufferOffsets  = {vertices:0, normals:0, colors:0, materials:0};
    this.needToSync     = true;
};


/**
 * Destructor.
 * 
 */
Namespace.MeshManager.prototype.destroy = function() 
{ 
    if (!this.volume) { return; } // We are already destroyed

    // Delete our buffers
    if (this.vertexBuffer) {
		this.vertexBuffer.destroy();
    	this.vertexBuffer = null;
    }
    if (this.normalBuffer) {
		this.normalBuffer.destroy();
    	this.normalBuffer = null;
    }
    if (this.colorBuffer) {
		this.colorBuffer.destroy();
    	this.colorBuffer = null;
    }
    if (this.materialBuffer) {
		this.materialBuffer.destroy();
    	this.materialBuffer = null;
    }
    this.volume = null;
};


/**
 * Adds a mesh.
 * 
 * @param {Mesh} mesh - The mesh to add.
 */
Namespace.MeshManager.prototype.addMesh = function(mesh)
{
    // Warn if we already have a mesh with the same name
    for (var i=0; i<this.meshes.length; i++) { 
        if (this.meshes[i].name == mesh.name) {
            Namespace.Logger.Report('Warning: Duplicate mesh name (' + mesh.name + '), in MeshManager.addMesh.',
                Namespace.Logger.Severity.Warning);
            break;
        }
    }
    this.meshes.push(mesh);
    this.needToSync = true;
};


/**
 * Removes a mesh.
 * 
 * @param {String} name - The name of the mesh to remove.
 */
Namespace.MeshManager.prototype.removeMesh = function(name)
{
    var i;
    var removed = null;

    for (i=0; i<this.meshes.length; i++) { 
        if (this.meshes[i].name == name) {
            removed = this.meshes[i];
            this.meshes.splice(i, 1); 
            this.needToSync = true;
            break;
        }
    }
    return removed;
};


/**
 * Removes all meshes.
 * 
 * @param {String} name - The name of the mesh to remove.
 */
Namespace.MeshManager.prototype.removeAllMeshes = function()
{
    var temp = this.meshes;
    this.needToSync = (temp.length > 0);
    this.meshes = [];

    return temp;
};


/**
 * Indicates whether a given mesh is contained in the MeshManager.
 * 
 * @param {Mesh} mesh - The mesh to test for.
 */
Namespace.MeshManager.prototype.contains = function(mesh)
{
    return this.meshes.includes(mesh);
};


/**
 * Gets the number of meshes in a given layer.
 * 
 * @param {Number} [layer=all] - The layer to query.
 */
Namespace.MeshManager.prototype.numMeshes = function(layer)
{
    var count = 0;
    for (var i=0; i<this.meshes.length; i++) {
        var mesh = this.meshes[i];
        if ( (mesh.layer === layer) || (typeof(layer) == 'undefined') ) {  
            count++; 
        }
    }
    return count;
};


/**
 * Gets the number of visible meshes in a given layer.
 * 
 * @param {Number} [layer=all] - The layer to query.
 */
Namespace.MeshManager.prototype.numVisibleMeshes = function(layer)
{
    var count = 0;
    for (var i=0; i<this.meshes.length; i++) {
        var mesh = this.meshes[i];
        if ( mesh.visible && ((mesh.layer === layer) || (typeof(layer) == 'undefined')) ) {  
            count++; 
        }
    }
    return count;
};



/**
 * Gets the number of vertices in the visible meshes in a given layer.
 * 
 * @param {Number} [layer=all] - The layer to query.
 */
Namespace.MeshManager.prototype.numVisibleVertices = function(layer)
{
    var count = 0;
    for (var i=0; i<this.meshes.length; i++) {
        var mesh = this.meshes[i];
        if ( mesh.visible && ((mesh.layer === layer) || (typeof(layer) == 'undefined')) ) { 
            count += mesh.numVertices(); 
        }
    }
    return count;
};


/**
 * Activates the visible meshes in a given layer.
 * 
 * @param {Number} [layer=0] - The layer to activate.
 * @param {ShaderProgram} program - The program that will render the meshes.
 */
Namespace.MeshManager.prototype.activateMeshes = function(layer, program) 
{
    layer = layer || 0;
    
    // Create our buffers if we haven't already
    if (!this.vertexBuffer) 
    {
        var ctx = this.volume.context;
        this.vertexBuffer   = new Namespace.AttributeBuffer(ctx, null, 3);
        this.normalBuffer   = new Namespace.AttributeBuffer(ctx, null, 3);
        this.colorBuffer    = new Namespace.AttributeBuffer(ctx, null, 4);
        this.materialBuffer = new Namespace.AttributeBuffer(ctx, null, 4);
    }

    // If the meshes have been modified, then we need to send the new vertex attributes to WebGL
    if (this.needToSync) 
    {  
        var concatVertices = this._concatDataArrays('vBuffer');
        this.vertexBuffer.setData(concatVertices.data);
        this.bufferOffsets.vertices = concatVertices.offset;

        var concatNormals = this._concatDataArrays('nBuffer');
        this.normalBuffer.setData(concatNormals.data);
        this.bufferOffsets.normals = concatNormals.offset;        

        var concatColors = this._concatDataArrays('cBuffer');
        this.colorBuffer.setData(concatColors.data);
        this.bufferOffsets.colors = concatColors.offset;

        var concatMaterials = this._concatDataArrays('mBuffer');
        this.materialBuffer.setData(concatMaterials.data);
        this.bufferOffsets.materials = concatMaterials.offset;

        this.needToSync = false;
    }

    // Turn on the attributes, and tell WebGL how to get data out of the buffers
    var offset = (layer === 0) ? 0 : 4*this.bufferOffsets.vertices;
    program.setAttribute('aPosition', this.vertexBuffer, true, offset);

    offset = (layer === 0) ? 0 : 4*this.bufferOffsets.normals;
    program.setAttribute('aNormal', this.normalBuffer, true, offset);

    offset = (layer === 0) ? 0 : 4*this.bufferOffsets.colors;
    program.setAttribute('aColor', this.colorBuffer, true, offset);

    offset = (layer === 0) ? 0 : 4*this.bufferOffsets.materials;
    program.setAttribute('aMaterial', this.materialBuffer, true, offset);
};


/**
 * Concatenates the vertex attribute arrays of all visible meshes.
 * 
 * @private
 * @param {String} arrayName - The array to concatenate.
 */
Namespace.MeshManager.prototype._concatDataArrays = function(arrayName) 
{
    // Determine the required array size
    var mesh;
    var numFloatsLayer0 = 0;
    var numFloatsLayer1 = 0;
    for (var i=0; i<this.meshes.length; i++) {
        mesh = this.meshes[i];
        if (mesh.visible) {
            if (mesh.layer === 0) {
                numFloatsLayer0 += mesh[arrayName].length;
            } else {
                numFloatsLayer1 += mesh[arrayName].length;
            }
        }
    }    

    // Copy data into the output array, with layer-zero data first
    var N = numFloatsLayer0 + numFloatsLayer1;
    var combinedArray = new Float32Array(N);
    var offset = 0;
    for (var j=0; j<this.meshes.length; j++) {
        mesh = this.meshes[j];
        if ( mesh.visible && (mesh.layer === 0) ) {  
            combinedArray.set( mesh[arrayName], offset );
            offset += mesh[arrayName].length;
        }
    }   
    for (var k=0; k<this.meshes.length; k++) {
        mesh = this.meshes[k];
        if ( mesh.visible && (mesh.layer !== 0) ) {  
            combinedArray.set( mesh[arrayName], offset );
            offset += mesh[arrayName].length;
        }
    }   

    // Scale to fractional volume units, and flip the z-sign because of WebGL's crazy left-handed coordinate system
    if (arrayName == 'vBuffer') {
        var sx = 1.0/this.volume.dims[0];
        var sy = 1.0/this.volume.dims[1];
        var sz = 1.0/(this.volume.dims[2] * this.volume.sliceGap);
        for (var n=0; n<N; n+=3){
            combinedArray[n]    = combinedArray[n]*sx - 0.5;
            combinedArray[n+1]  = combinedArray[n+1]*sy - 0.5;
            combinedArray[n+2]  = 0.5 - combinedArray[n+2]*sz;
        }
    }

    // Flip the z-sign of the normals as well
    if ( arrayName == 'nBuffer' ) {
        for (var p=2; p<N; p+=3) {
            combinedArray[p] = -combinedArray[p];
        }
    }
    return {data:combinedArray, offset:numFloatsLayer0};
};



})( window.BigLime = window.BigLime || {} );







;(function(Namespace, undefined) {
    "use strict";
	var vec2 = glMatrix.vec2;
	var vec3 = glMatrix.vec3;
	var mat4 = glMatrix.mat4;


/**
 * @category 3D
 * @classdesc
 * This class implements a viewer for multi-planar-reformatted (MPR) images
 * 
 * @constructor
 * @param {HTMLElement} site - The html element that will host the viewer.
 * @param {String} [initialPlane='axi'] - The (initial) viewing plane. Can be a [rowDir, colDir] pair, or one of 'axi', 'cor', 'sag'.
 * @param {Object} [id] - A user-defined identifier for the viewer.
 * @param {Object} [owner] - A an optional parent object.
 * @param {RenderEngine} [renderEngine] - A rendering engine. If not supplied, one will be created.
 * @param {Object} [engineOptions] - Options for the created render engine. See RenderEngine docs.
 * @param {Boolean} [drawOrientLabels=true] - Whether to draw orientation labels.
 * @param {Boolean} [autoResize=true] - Whether to resize the raster when the window size changes.
 * @param {Boolean} [omitInteractor=false] - Whether to omit the pose/win-level interactor.
 * 
 */
Namespace.MprViewer = function(args = {}) 
{ 
    // Cache the inputs
    this.site = args.site; 
    this.id = args.id;
    this.owner = args.owner;
    this.drawOrientLabels = (args.drawOrientLabels === false) ? false : true;

    if (!args.initialPlane || (typeof args.initialPlane === 'string') || (args.initialPlane instanceof String)) {
        var plane = (args.initialPlane || 'axi').toLowerCase();
        this.rowDir = (plane == 'axi') ? vec3.fromValues(1,0,0) : (plane == 'cor') ? vec3.fromValues(1,0,0)  : vec3.fromValues(0,1,0);
        this.colDir = (plane == 'axi') ? vec3.fromValues(0,1,0) : (plane == 'cor') ? vec3.fromValues(0,0,-1) : vec3.fromValues(0,0,-1);
    }
    else {
        this.rowDir = vec3.clone(args.initialPlane[0]);
        this.colDir = vec3.clone(args.initialPlane[1]);
        vec3.normalize(this.rowDir, this.rowDir);
        vec3.normalize(this.colDir, this.colDir);
    }
    this.initialPlane = {rowDir: vec3.clone(this.rowDir), colDir: vec3.clone(this.colDir)}; 

    // Create our (2D) canvas
    this.canvas = Namespace.Ui.CreateElement('canvas', 'mprviewer_canvas', this.site, {width:'100%', height:'100%', backgroundColor:'#000000'} );
    this.canvas.addEventListener('contextmenu', function(e) {e.preventDefault();} ); // Disable right-click context menu

    // Cache or create the render engine
    this.renderEngine = args.renderEngine ? args.renderEngine : new Namespace.RenderEngine({options:args.engineOptions});
    this.ownsEngine = !args.renderEngine;

    // Instance properties
    var rp = this.renderParams = new Namespace.RenderParams(); 
    rp.renderType = Namespace.RenderType.MIP;
    rp.slab = new Namespace.Slab(this.renderEngine.volume);
    rp.clipToSlab = true;
    rp.showSlab = false;
    rp.rayOversamp = 2;
    rp.showGraphics = false;
    rp.showMarker = false;
    rp.rotMatrix = Namespace.Utils.GetRotMatrix(this.rowDir, this.colDir);

    this.mprThickness = 1;
    this.mprPoint = vec3.fromValues(0.5, 0.5, 0.5);
    this.fastDrawDownsamp = 1;
    this.resizeTimerId = null;
    this.renderCallbacks = [];

    // Maybe create an interactor
    if (!args.omitInteractor) { 
        this.interactor = new Namespace.MultiInteractor(this.canvas);   
        this.interactor.addEventListener('start move end', this._onInteractorEvent.bind(this));
    }

    // Maybe listen for resize events
    if (args.autoResize !== false) {
        this.resizeListener = this.onResize.bind(this);
        window.addEventListener('resize', this.resizeListener);
    } 
    this.onResize();
};


/**
 * Deletes the viewer, and any resources that it owns.
 * 
 */
Namespace.MprViewer.prototype.destroy = function() 
{ 
    // Check if we are already destroyed
    if (!this.renderEngine) { return; }

    clearTimeout(this.resizeTimerId);
    if (this.resizeListener) { window.removeEventListener('resize', this.resizeListener); }
    Namespace.Utils.cancelAnimFrame(this.rafId);

    if (this.interactor) { this.interactor.stopListening(); }

    // Destroy sub-objects
    if (this.ownsEngine) { this.renderEngine.destroy(); }
    this.renderEngine = null;

    this.canvas.remove();
};


/**
 * Handler for resize events.
 * 
 */
Namespace.MprViewer.prototype.onResize = function(omitEcho=false)
{    
    var canvasClientRect = this.canvas.getBoundingClientRect(); 
    this.canvas.width = Math.round(canvasClientRect.width);
    this.canvas.height = Math.round(canvasClientRect.height);
    this.rafId = Namespace.Utils.requestAnimFrame( this.render.bind(this) );

    // Workaround for the fact that getBoundingClientRect() may not have the latest values.
    if (!omitEcho) {
        if (this.resizeTimerId) { clearTimeout(this.resizeTimerId); }
        this.resizeTimerId = setTimeout( function(){this.onResize(true);}.bind(this), 300);
    } else {
        this.resizeTimerId = null;
    }
};


/**
 * Clears the viewport.
 * 
 */
Namespace.MprViewer.prototype.clear = function()
{
    this.canvas.getContext('2d').clearRect(0, 0, this.canvas.width, this.canvas.height);   
};


/**
 * Loads image data into the viewer.
 * 
 * @param {FileList|File} imgFiles - The image File object(s) to load.
 * @param {Loader3D} loader - A 3D volume loader.
 * @param {Function} [completionCb] - Callback to be invoked when loading is complete.
 * @param {Function} [progressCb] - Progress callback.
 */
Namespace.MprViewer.prototype.loadVolume = function(imgFiles, loader, completionCb, progressCb)
{
    var loadCb = function(errMsg, warnings) {
        if (!errMsg) { this.onNewVolumeLoaded(); }
        if (completionCb) { completionCb(errMsg, warnings, this); }
    }.bind(this);

    this.renderEngine.loadVolume(
        {imgFiles:imgFiles, loader:loader, completionCb:loadCb, progressCb:progressCb, omitRender:true, omitResetView:true});
};


/**
 * Cancels any in-progress loading.
 * Client callbacks will not be invoked.
 * 
 */
Namespace.MprViewer.prototype.cancelLoading = function()
{
    this.renderEngine.cancelLoading();
};


/**
 * Updates internals when a new volume is loaded.
 * 
 */
Namespace.MprViewer.prototype.onNewVolumeLoaded = function()
{
    // Nothing to do
};


/**
 * Renders the MPR.
 * 
 */
Namespace.MprViewer.prototype.render = function()
{
    const engine = this.renderEngine;
    if ( !engine.hasImageData() ) { return; }

    // Match the engine's raster size to the client size of our display canvas
    engine.setRenderParams(this.renderParams);
    var downsamp = (engine.isAnimating() ? this.fastDrawDownsamp : 1);
    engine.sizeRasterToMatch(this.canvas, downsamp);
    
    // Update the slab parameters
    this._updateSlab();

    engine.render();

    // Copy the rendered image from the engine canvas to our canvas
    var ctx = this.canvas.getContext('2d');
    ctx.clearRect(0,0, this.canvas.width, this.canvas.height);
    ctx.drawImage(engine.canvas, 0, 0, this.canvas.width, this.canvas.height);

    if (this.drawOrientLabels) { this._drawOrientLabels(); }

    this.renderCallbacks.forEach( cb => { cb(this); } );
};


/**
 * Draws the orientation labels.
 * @private
 */
Namespace.MprViewer.prototype._drawOrientLabels = function(siblings)
{
    var ctx = this.canvas.getContext('2d');
    var w = this.canvas.width;
    var h = this.canvas.height;
    
    // Draw the orientation labels
    var orientLabels = ["", ""];
    var vol = this.renderEngine.volume;
    var volRowDir = vol.getAttr("rowDir");
    var volColDir = vol.getAttr("colDir");
    if (volRowDir && volColDir) {
        var volPerpDir = vec3.cross(vec3.create(), volRowDir, volColDir);
        
        var hDir = vec3.create();
        vec3.scaleAndAdd(hDir, hDir, volRowDir, this.rowDir[0]);
        vec3.scaleAndAdd(hDir, hDir, volColDir, this.rowDir[1]);
        vec3.scaleAndAdd(hDir, hDir, volPerpDir, this.rowDir[2]);
        orientLabels[0] = Namespace.ImageLook.getOrientationLabel(hDir);

        var vDir = vec3.create();
        vec3.scaleAndAdd(vDir, vDir, volRowDir, this.colDir[0]);
        vec3.scaleAndAdd(vDir, vDir, volColDir, this.colDir[1]);
        vec3.scaleAndAdd(vDir, vDir, volPerpDir, this.colDir[2]);
        vec3.negate(vDir, vDir);
        orientLabels[1] = Namespace.ImageLook.getOrientationLabel(vDir);
    }
    
    Object.assign(ctx, {font:"18px Arial Narrow", textAlign:"center", textBaseline:"middle", 
        fillStyle:"#cfcfcf", shadowColor:"black", shadowOffsetX:2, shadowOffsetY:2});
    ctx.fillText(orientLabels[0], w-24, h/2); 
    ctx.fillText(orientLabels[1], w/2, 15); 
    [ctx.shadowOffsetX, ctx.shadowOffsetY] = [0, 0]; 
};


/**
 * Updates the slab parameters based on the MPR point and slice thickness.
 * @private
 */
Namespace.MprViewer.prototype._updateSlab = function() 
{
    var rp = this.renderParams;
    var vol = this.renderEngine.volume;
    var slab = rp.slab;
    var maxVolSide = Math.max(...vol.shape);

    vec3.copy(slab.shape, [4*maxVolSide, 4*maxVolSide, this.mprThickness]); 
    mat4.copy(slab.orient, rp.rotMatrix);
    vec3.multiply(slab.center, this.mprPoint, vol.shape); 
};


/**
 * Handler for events from the interactor.
 * @private
 * 
 */
Namespace.MprViewer.prototype._onInteractorEvent = function(event)
{
    var engine = this.renderEngine;
    var rp = this.renderParams;
    var intr = this.interactor;

    if (event.type == 'start')
    {
        intr.setInitialValues({zoom: rp.zoom, pan: rp.pan, 
            wwl: {width:rp.winWidth, level:rp.winLevel, levelRange:engine.volume.getAutoWinLevel()[0]}});

        // Start an animation
        engine.animate(15, this.render.bind(this));
    }

    else if (event.type == 'move')
    {
        switch (intr.interactMode)
        {
            case 'zoom':
            case 'wheelzoom':
                rp.zoom = intr.currentZoom;
                break;
                
            case 'pan':
                vec2.copy(rp.pan, intr.currentPan);
                break;

            case 'panzoom':
                rp.zoom = intr.currentZoom;
                vec2.copy(rp.pan, intr.currentPan);
                break;

            case 'light':
                rp.winWidth = intr.winWidth;
                rp.winLevel = intr.winLevel;
                break;

            default:
                break;
        }
    }
    else if (event.type == 'end')
    {
        // Stop animating
        engine.stopAnimation();
        this.render(); // Render a full resolution image
    }
};


/**
 * Sets the MPR point (in texture coodinates).
 * 
 */
Namespace.MprViewer.prototype.setMprPoint = function(newMprPoint)
{
    vec3.copy(this.mprPoint, newMprPoint);   
};


/**
 * Resets the MPR point to the middle of the volume.
 * 
 */
Namespace.MprViewer.prototype.resetMprPoint = function()
{
    this.setMprPoint([0.5, 0.5, 0.5]);   
};


/**
 * Sets the MPR Thickness (in voxel units).
 * 
 */
Namespace.MprViewer.prototype.setMprThickness = function(thickness)
{
    this.mprThickness = Math.max(1, thickness);   
};


/**
 * Sets the MPR orientation.
 * 
 */
Namespace.MprViewer.prototype.setOrientation = function(rowDir, colDir)
{
    vec3.normalize(this.rowDir, rowDir);
    vec3.normalize(this.colDir, colDir);
    if (Math.abs(vec3.dot(this.rowDir, this.colDir) > 0.0001)) {
        Namespace.Logger.Report("MprViewer.setOrient: Received non-orthogonal orientation vectors.", Namespace.Logger.Severity.Warn, false, false);
    }    
    Namespace.Utils.GetRotMatrix(this.rowDir, this.colDir, this.renderParams.rotMatrix);
};


/**
 * Resets the MPR orientation.
 * 
 */
Namespace.MprViewer.prototype.resetOrientation = function()
{
    var ip = this.initialPlane;
    var nearLph = this.renderEngine.volume.nearLphAxes;

    var rowDir = vec3.scale(vec3.create(), nearLph.L, ip.rowDir[0]);
    vec3.scaleAndAdd(rowDir, vec3.scaleAndAdd(rowDir, rowDir, nearLph.P, ip.rowDir[1]), nearLph.H, ip.rowDir[2]);

    var colDir = vec3.scale(vec3.create(), nearLph.L, ip.colDir[0]);
    vec3.scaleAndAdd(colDir, vec3.scaleAndAdd(colDir, colDir, nearLph.P, ip.colDir[1]), nearLph.H, ip.colDir[2]);

    this.setOrientation(rowDir, colDir); 
};


/**
 * Resets the zoom to its default value.
 * 
 */
Namespace.MprViewer.prototype.resetZoom = function()
{
    this.renderParams.zoom = this.calcDefaultZoom();  
};


/**
 * Resets the pan to its default value.
 * 
 */
Namespace.MprViewer.prototype.resetPan = function()
{
    vec2.copy(this.renderParams.pan, [0,0]);     
};


/**
 * Resets the window width and level.
 * 
 */
Namespace.MprViewer.prototype.resetWindowWidthAndLevel = function()
{
    [this.renderParams.winWidth, this.renderParams.winLevel] = this.renderEngine.volume.getAutoWinLevel();
}


/**
 * Calculate the zoom factor that will just fit an image into the viewport.
 * 
 */
Namespace.MprViewer.prototype.calcDefaultZoom = function()
{
    var defaultZoom = 1;
    
    if (this.renderEngine.hasImageData()) {
        var vol = this.renderEngine.volume;
        var wIndex = this.rowDir.reduce((iMax, u, i, vec) => Math.abs(u) > Math.abs(vec[iMax]) ? i : iMax, 0);
        var hIndex = this.colDir.reduce((iMax, u, i, vec) => Math.abs(u) > Math.abs(vec[iMax]) ? i : iMax, 0);
        var imgAspect = vol.shape[wIndex] / vol.shape[hIndex];
        var canvAspect = this.canvas.width / this.canvas.height;

        if (imgAspect > canvAspect) {
            defaultZoom = (vol.diagSize/vol.shape[wIndex]) * Math.max(1, canvAspect);
        } else {
            defaultZoom = (vol.diagSize/vol.shape[hIndex]) * Math.max(1, 1/canvAspect);
        }
    }

    return defaultZoom;
}


/**
 * Maps a 3D texture coordinate to a 2D viewport coordinate.
 * 
 */
Namespace.MprViewer.prototype.txToViewport = function(txCoord, xfrms=null) 
{
    xfrms = xfrms || this.renderEngine.calcTransforms(this.renderParams, this.canvas, {omitLights:true})
    var txPos = vec3.subtract(vec3.create(), txCoord, [0.5, 0.5, 0.5]);
    var vpPoint = vec3.transformMat4(vec3.create(), txPos, xfrms.mvp);
    var vpPoint2d = [(1 + vpPoint[0])*this.canvas.width/2, (1 - vpPoint[1])*this.canvas.height/2];

    return vpPoint2d;
};


/**
 * Maps a 2D viewport coordinate to a 3D texture coordinate.
 * 
 */
Namespace.MprViewer.prototype.viewportToTx = function(vpCoord, xfrms=null) 
{
    // Map to texture coodinates. Any z will do, so choose zero.
    var xfrms = xfrms || this.renderEngine.calcTransforms(this.renderParams, this.canvas, {omitLights:true})
    var vpPos = [2*vpCoord[0]/this.canvas.width - 1, 1 - 2*vpCoord[1]/this.canvas.height, 0];
    var txPos = vec3.transformMat4(vec3.create(), vpPos, xfrms.mvpInv);
    vec3.add(txPos, txPos, [0.5, 0.5, 0.5]);

    // Subtract the component that's perpendicular to the mpr plane
    var perpVec = vec3.cross(vec3.create(), this.rowDir, this.colDir);
    var perpComp = vec3.dot(perpVec, vec3.subtract(vec3.create(), txPos, this.mprPoint));
    vec3.subtract(txPos, txPos, vec3.scale(perpVec, perpVec, perpComp));

    return txPos;
};


})( window.BigLime = window.BigLime || {} );







;(function(Namespace, undefined) {
	"use strict";
	var vec2 = glMatrix.vec2;
	var vec3 = glMatrix.vec3;
	var mat4 = glMatrix.mat4;


/**
 * @category 3D
 * @classdesc
 * This class implements an interactor for adjusting pan and/or zoom and/or rotation and/or
 * window-width-and-level and/or brightness/contrast.
 * 
 * @constructor
 * @param {HTMLElement} eventSrc - The html element from which to get mouse events.
 * @param {Object|Array} eventTypes - The event types that the interactor should respond to.
 * 
 */
Namespace.MultiInteractor = function(eventSrc, eventTypes) 
{ 
	// Inherit from Interactor
	eventTypes = eventTypes || {};
	var panEventTypes  = eventTypes.pan  || {btns:2, shift:false, ctrl:false, alt:false, meta:false};
	var zoomEventTypes = eventTypes.zoom || {btns:0, shift:true,  ctrl:false, alt:false, meta:false};
	var rotEventTypes  = eventTypes.rot  || {btns:0, shift:false, ctrl:false, alt:false, meta:false};
	var wlEventTypes   = eventTypes.wl   || {btns:0, shift:false, ctrl:false, alt:true,  meta:false};

	this.panEventTypes  = Array.isArray(panEventTypes) ? panEventTypes : [panEventTypes];
	this.zoomEventTypes = Array.isArray(zoomEventTypes) ? zoomEventTypes : [zoomEventTypes];
	this.rotEventTypes  = Array.isArray(rotEventTypes) ? rotEventTypes : [rotEventTypes];	
	this.wlEventTypes   = Array.isArray(wlEventTypes) ? wlEventTypes : [wlEventTypes];
	
	Namespace.Interactor.call(this, eventSrc, 'multi', 
		[].concat(...[this.panEventTypes, this.zoomEventTypes, this.rotEventTypes, this.wlEventTypes]));

	// Initialize data members
	this.panEnabled = true;
	this.zoomEnabled = true;
	this.rotEnabled = true;
	this.wlEnabled = true;

	this.winWidth = 1.0; 
	this.winLevel = 1.0; 
	this.ambient = 0.0;
	this.shadow = 0.0;
    this.wlRateOfChange = 1.0;
	this.asRateOfChange = 1/1024.0;

	this.initialZoom = 1.0;
	this.initialPan = [0,0];
	this.initialRot = mat4.create();
	
	this.currentZoom = 1.0;
	this.currentPan = [0,0];
	this.currentRot = mat4.create();
	this.deltaRot   = mat4.create();

	// Request mousewheel events
	this.mouseWheelZoomEnabled = true; 
	this.mouseWheelListener = this._onMouseWheelChange.bind(this);
	this.eventSources.forEach( s => s.addEventListener('wheel', this.mouseWheelListener) );	
	this.mouseWheelTimerId = null;	
};
Namespace.MultiInteractor.prototype = Object.create(Namespace.Interactor.prototype);
Namespace.MultiInteractor.prototype.constructor = Namespace.MultiInteractor;  


/**
 * Removes all event listeners that this object has added.
 * 
 */
Namespace.MultiInteractor.prototype.stopListening = function()
{
	Namespace.Interactor.prototype.stopListening.call(this);
	this.eventSources.forEach( s => s.removeEventListener('wheel', this.mouseWheelListener) );
	clearTimeout(this.mouseWheelTimerId);
}


/**
 * Sets the initial values at the start of interaction.
 * Clients should call this in their 'start' event handler.
 * 
 * @param {Object} vals - The values to set.
 * 
 */
Namespace.MultiInteractor.prototype.setInitialValues = function(vals={})
{
    if (vals.zoom) { 
		this.initialZoom = this.currentZoom = vals.zoom; 
	}
	if (vals.pan) { 
		vec2.copy(this.initialPan, vals.pan); 
		vec2.copy(this.currentPan, vals.pan);
	} 
	if (vals.rot) { 
		mat4.copy(this.initialRot, vals.rot); 
		mat4.copy(this.currentRot, vals.rot);
	} 
	if (vals.wwl) {
		this.winWidth = vals.wwl.width;
		this.winLevel = vals.wwl.level;
		this.wlRateOfChange = Math.max(1, vals.wwl.levelRange)/1024;
	}
	if (vals.lighting) {
		this.ambient = vals.lighting.ambient;
		this.shadow = vals.lighting.shadow;
		this.asRateOfChange = 1/1024;
	}
};


/**
 * Handler for start events.
 * @private
 * 
 * @param {Event} event - Event info.
 * 
 */
Namespace.MultiInteractor.prototype._onStart = function(event)
{
	if (this.mouseWheelTimerId ) {
		clearTimeout(this.mouseWheelTimerId);
		this.mouseWheelTimerId = null;
	}
	
	if (this.pinching) {
		this.interactMode = (this.panEnabled || this.zoomEnabled) ? 'panzoom' : 'none';
	}
	else if (event.type == 'touchstart'){
		this.interactMode = this.rotEnabled ? 'rotate' : 'none';
	}
	else {
		var Matches = Namespace.Interactor.MouseEventMatches;
		this.interactMode = 
			Matches(event, this.panEventTypes)  && this.panEnabled  ? 'pan'    : 
			Matches(event, this.zoomEventTypes) && this.zoomEnabled ? 'zoom'   : 
			Matches(event, this.rotEventTypes)  && this.rotEnabled  ? 'rotate' : 
			Matches(event, this.wlEventTypes)   && this.wlEnabled   ? 'light'  : 'none';
	}

	if (this.interactMode != 'none') {
		this.onStart ? this.onStart(event) : this.trigger('start', {origEvent:event});
	}
};


/**
 * Handler for move events.
 * @private
 * 
 * @param {Event} event - Event info.
 * 
 */
Namespace.MultiInteractor.prototype._onMove = function(event)
{
	if ((this.interactMode == 'none') || (this.interactMode =='wheelzoom')) { return; }

	var srcRect = this.currentEventSource.getBoundingClientRect();

	// Handle multi-touch events
	if (this.pinching) 
	{
		if (this.currNumTouches >= 2) {
			let panScale = 2.0/Math.min(srcRect.width, srcRect.height);
			this.currentPan[0] -= panScale * this.deltaPrevPinch.ctr[0]/this.currentZoom;
			this.currentPan[1] += panScale * this.deltaPrevPinch.ctr[1]/this.currentZoom;	
			this.currentZoom = this.initialZoom * ( this.currPinch.sep/(this.startPinch.sep+0.0001) );
		}		
	}
	else
	{
		var panScale;

		switch (this.interactMode) 
		{
			case 'pan': 
				panScale = 2.0/Math.min(srcRect.width, srcRect.height);
				this.currentPan[0] -= panScale * this.deltaPrev[0]/this.currentZoom;
				this.currentPan[1] += panScale * this.deltaPrev[1]/this.currentZoom;	
				break;

			case 'zoom': 
				this.currentZoom *= Math.pow(1.01, -this.deltaPrev[1]);
				break;

			case 'panzoom':
				panScale = 2.0/Math.min(srcRect.width, srcRect.height);
				this.currentPan[0] -= panScale * this.deltaPrev[0]/this.currentZoom;
				this.currentPan[1] += panScale * this.deltaPrev[1]/this.currentZoom;
				this.currentZoom *= Math.pow(1.01, -this.deltaPrev[1]);	
				break;

			case 'rotate':
				let trackballSize = vec2.fromValues(srcRect.width, srcRect.height);
				Namespace.MultiInteractor._CalcRotationMatrix(this.deltaRot, this.prevPoint, this.currPoint, trackballSize);
				mat4.multiply(this.currentRot, this.deltaRot, this.currentRot);
				break;

			case 'light':
				this.winLevel += this.wlRateOfChange * this.deltaPrev[1];
				this.winWidth -= this.wlRateOfChange * this.deltaPrev[0];
				this.winWidth = Math.max(this.winWidth, 0.0001);

				this.ambient -= this.asRateOfChange * this.deltaPrev[1];
				this.ambient = Math.min(2, Math.max(0, this.ambient));
				this.shadow += this.asRateOfChange * this.deltaPrev[0];
				this.shadow = Math.min(1.5, Math.max(0, this.shadow));
				break;

			default:
				break;
		}
	}

	this.onMove ? this.onMove(event) : this.trigger('move', {origEvent:event});
};


/**
 * Handler for end events.
 * @private
 * 
 * @param {Event} event - Event info.
 * 
 */
Namespace.MultiInteractor.prototype._onEnd = function(event)
{
	if (this.interactMode == 'none') return;

	this.onEnd ? this.onEnd(event) : this.trigger('end', {origEvent:event});

	this.interactMode = 'none';
};


/**
 * Handler for mousewheel events.
 * @private
 * 
 * @param {Event} event - Event info.
 * 
 */
Namespace.MultiInteractor.prototype._onMouseWheelChange = function(event)
{
	if (!this.mouseWheelZoomEnabled) { return; }

	// Get some event parameters
	var deltaMode, deltaY;
	var oEvent = event.originalEvent;
	if ( (event.deltaMode || (event.deltaMode === 0)) && (event.deltaY || (event.deltaY === 0)) ) {
		deltaMode = event.deltaMode;
		deltaY = event.deltaY;
	}
	else if (oEvent && ((oEvent.deltaMode || (oEvent.deltaMode === 0)) && (oEvent.deltaY || (oEvent.deltaY === 0))) ) {
		deltaMode = event.originalEvent.deltaMode;
		deltaY = event.originalEvent.deltaY;		
	}
	else { return; }

	var scale = (deltaMode === 0) ? 50 : 1.5;
	var deltaZoom = Math.pow(1.01, -deltaY/scale);

	if (!this.mouseWheelTimerId) {
		this.active = true;
		this.interactMode = 'wheelzoom';
		this.onStart ? this.onStart(event) : this.trigger('start', {origEvent:event});
		this.currentZoom = this.initialZoom * deltaZoom;		
		this.onMove ? this.onMove(event) : this.trigger('move', {origEvent:event});
	}
	else {
		this.currentZoom *= deltaZoom;
		this.onMove ? this.onMove(event) : this.trigger('move', {origEvent:event});
		clearTimeout(this.mouseWheelTimerId);
	}
	// Keep animation going for a while, in case we get more mousewheel events
	this.mouseWheelTimerId = setTimeout( function() { 
		this.onEnd ? this.onEnd(event) : this.trigger('end', {origEvent:event});
		this.active = false;
		this.interactMode = 'none';
		this.mouseWheelTimerId = null;
	}.bind(this), 500);

	event.preventDefault();							
};


/**
 * Calculates the rotation matrix given two cursor positions.
 * @static
 * @private
 * 
 * @param {vec2} prevPoint - The previous mouse position.
 * @param {vec2} currPoint - The current mouse position.
 * @param {vec2} trackballSize - The dimensions of the virtual trackball.
 * 
 */
Namespace.MultiInteractor._CalcRotationMatrix = function(result, prevPoint, currPoint, trackballSize) 
{	
	// First convert to centered x,y coords.
	var tbHalfSize = vec2.clone(trackballSize);   vec2.scale(tbHalfSize, tbHalfSize, 0.5);
	var tbRadius = Math.min(tbHalfSize[0], tbHalfSize[1]);
	var tbRadiusSq = tbRadius * tbRadius;

	var curr = vec2.clone(currPoint);  vec2.subtract(curr, curr, tbHalfSize);
	var prev = vec2.clone(prevPoint);  vec2.subtract(prev, prev, tbHalfSize);
	curr[0] = -curr[0];   prev[0] = -prev[0];

	// Snap the coords to the required range
	var currLength = vec2.length(curr);
	if ( currLength > tbRadius ) 
	{
		vec2.scale(curr, curr, tbRadius/currLength);
		currLength = tbRadius;
	}
	curr = vec3.fromValues(curr[0], curr[1], Math.sqrt(Math.max(0, tbRadiusSq - currLength*currLength)));

	var prevLength = vec2.length(prev);
	if ( prevLength > tbRadius ) 
	{
		vec2.scale(prev, prev, tbRadius/prevLength);
		prevLength = tbRadius;
	}
	prev = vec3.fromValues(prev[0], prev[1], Math.sqrt(Math.max(0, tbRadiusSq - prevLength*prevLength)));

	// Maybe short circuit
	if ( (Math.abs(curr[0]-prev[0]) < 0.0001) && (Math.abs(curr[1]-prev[1]) < 0.0001) ) {
		mat4.identity(result);
		return;
	}

	// Now calculate the rotation axis
	var n = vec3.create();
	vec3.cross(n, curr, prev);
	var nNorm = vec3.length(n);
	if ( Math.abs(nNorm) < 0.0001 ) {
		mat4.identity(result);
		return;
	}

	// Calculate matrix elements
	var sinth  = nNorm / tbRadiusSq;
	var costh  = Math.sqrt( Math.max(0, (1.0 - sinth*sinth)) );
	var sinth2 = Math.sqrt( Math.max(0, (1.0 - costh)/2) );
	var costh2 = Math.sqrt( Math.max(0, (1.0 + costh)/2) );

	vec3.scale(n, n, -1.0/nNorm);

	var e0 = costh2;
	var e1 = n[0] * sinth2;
	var e2 = n[1] * sinth2;
	var e3 = n[2] * sinth2;

	result[0] = e0*e0 + e1*e1 - e2*e2 - e3*e3 ;
	result[1] = 2.0 * ( e1*e2 + e0*e3 );
	result[2] = 2.0 * ( e1*e3 - e0*e2 );
	result[3] = 0.0;

	result[4] = 2.0 * ( e1*e2 - e0*e3 );
	result[5] = e0*e0 - e1*e1 + e2*e2 - e3*e3 ;
	result[6] = 2.0 * ( e2*e3 + e0*e1 );
	result[7] = 0.0;

	result[8] = 2.0 * ( e1*e3 + e0*e2 );
	result[9] = 2.0 * ( e2*e3 - e0*e1 );
	result[10] = ( e0*e0 - e1*e1 - e2*e2 + e3*e3 );
	result[11] = 0.0;
};


})( window.BigLime = window.BigLime || {} );







(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
;(function(Namespace, undefined) {
    "use strict";
    var vec3 = glMatrix.vec3;   
	var fflate = require('fflate');

/**
 * @category 3D
 * @classdesc
 * This class is responsible for loading nrrd files into a volume.
 * It requires the pako zip library to load compressed nrrd files.
 * 
 * @constructor
 */
Namespace.NrrdLoader3D = function() 
{
    // Inherit from Loader3D
    Namespace.Loader3D.call(this);

    this.imgBufferArray = null;
};
Namespace.NrrdLoader3D.prototype = Object.create(Namespace.Loader3D.prototype);
Namespace.NrrdLoader3D.prototype.constructor = Namespace.NrrdLoader3D;  
	

/**
 * Reads the dimensions of the given file from its header.
 * 
 * @param {File|FileHandle} imgFile - The image file to read.
 * 
 * @returns {Array} - the [width, height, depth] of the volume.
 *
 */
Namespace.NrrdLoader3D.prototype.getImageDims = async function (imgFile) 
{
    return new Promise((resolve, reject) => {
        try {
            var fileReader = new FileReader();  
            fileReader.onerror = (err) => { reject(err); };
            fileReader.onload = () => {
                try {
                    // Find the header
                    var header = null, i=0, m=null;
                    var maxHeaderBytes = 2**24;
                    var data = new Uint8Array(fileReader.result.slice(0, maxHeaderBytes));  
                    for (i=1; i<data.length; i++) {
                        if ( (data[i-1] == 10) && (data[i] == 10) ) {
                            header = new TextDecoder().decode(data.subarray(0, i-2));
                            break;
                        }
                    }
                    if (!header) {
                        reject("Could not find header.");
                    }
            
                    // Parse the header
                    var lines = header.split( /\r?\n/ );
                    for (i=0; i<lines.length; i++) {
                        var line = lines[i];
                        if ( !line.match(/^#/) && (m = line.match( /(.*):(.*)/ )) ) {
                            if (m[1].trim() == 'sizes') {
                                var values = m[2].trim().split( /\s+/ );
                                var dims = values.map( function (v) { return parseInt(v, 10); } );
                                resolve(dims);
                                return;
                            }
                        }
                    }
                    reject("Could not find image dimensions in header.");
                }
                catch (ex) {
                    reject(ex);
                }
            };
           
            if (imgFile instanceof FileSystemFileHandle) {
                imgFile.getFile().then(function(f) { 
                    fileReader.readAsArrayBuffer(f);
                })
                .catch (function(ex) {
                    reject(ex);
                });
            }
            else {
                fileReader.readAsArrayBuffer(imgFile);
            }
        }
        catch (ex) {
            reject(ex);
        }
    });
};


/**
 * Starts loading files into a volume object.
 * 
 * @param {FileList|File} imgFile - The image File object to load.
 * @param {VolumeT2|VolumeT3} volume - The volume object that will receive the data.
 * @param {function} [completionCb] - A callback to invoke when loading is complete.
 * @param {function} [progressCb] - A callback to invoke when each image is loaded.
 */
Namespace.NrrdLoader3D.prototype.loadImagesIntoVolume = function (imgFile, volume, completionCb, progressCb) 
{
    var fileList = [];
    Array.prototype.push.apply(fileList, imgFile); // Take a copy of the file list, since it may be transient

    this.vol = volume;
    this.errors = null;
    this.warnings = null;
    this.done = false;
    this.loadCompleteCb = completionCb;
    this.loadProgressCb = progressCb;

    // Handle a trivial case
    if (!fileList || !fileList.length) {
        this.done = true;
        this.warnings = "NrrdLoader3D: No files were loaded, because the supplied file list was empty.";
        if (this.loadCompleteCb) { this.loadCompleteCb(this); }  
        return;
    }

    // Check that all items in the file list are valid
    if (fileList.some(f => {return !(f instanceof FileSystemFileHandle) && !(f instanceof File)})) {
        this.done = true;
        this.errors = "NrrdLoader3D: Invalid item in file list.";
        if (this.loadCompleteCb) { this.loadCompleteCb(this); }  
        return;
    }

    // Load the image data
    var fileReader = new FileReader();  
    fileReader.onload = function() { this._onImageDataLoaded(fileReader); }.bind(this);
    fileReader.onerror = function() { this._onImageLoadingError(fileReader); }.bind(this);  

	if (this.loadProgressCb) { this.loadProgressCb(0, 1); }
    var fileItem = fileList[0];
	if (fileItem instanceof FileSystemFileHandle) {
		fileItem.getFile().then(function(file) { 
			fileReader.readAsArrayBuffer(file); 
		})
		.catch (function(ex) {
			this._onImageLoadingError(fileReader)}.bind(this)
		);
	}
	else {
		fileReader.readAsArrayBuffer(fileItem);
	}
};


/**
 * Callback invoked when an error occurs during image loading.
 * @private
 * 
 */
Namespace.NrrdLoader3D.prototype._onImageLoadingError = function (fileReader) 
{
    if (this.cancelled) { return; } 

    if (!this.done) {
        this.done = true;
        this.errors = "Error loading image file " + (fileReader.fileName || "");
        if (this.loadCompleteCb) { this.loadCompleteCb(this); }
    }
};



/**
 * Callback invoked when the image data file has been loaded.
 * @private
 * 
 */
Namespace.NrrdLoader3D.prototype._onImageDataLoaded = async function(fileReader) 
{    
    if (this.cancelled) { return; } 

    try
    {
		var i, m;
		var data = new Uint8Array(fileReader.result);

        // Find the header
		var header = null;
		for (i=1; i<data.length; i++) {
			if ( (data[i-1] == 10) && (data[i] == 10) ) {
				header = new TextDecoder().decode(data.subarray(0, i-2));
				break;
			}
		}
        if (!header) {
            this.done = true;
            this.errors = "Nrrd header not found.";
            if (this.loadCompleteCb) { this.loadCompleteCb(this); }
            return;
        }
		var dataStart = i + 1;

        // Parse the header
		var bpp = -1, signed = false, offset = 0, dimension = -1, encoding = "raw";
		var endian = "little";
		var space = "left-posterior-superior";
		var sizes = [1, 1, 1];
		var space_dirs = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
		var spacings = [1, 1, 1];
		var space_origin = [0, 0, 0];
		var isNrrd = false;

		var lines = header.split( /\r?\n/ );
		for (i=0; i<lines.length; i++) {
			var line = lines[i];
			if ( line.match(/NRRD\d+/) ) {
				isNrrd = true;
			} 
			else if ( !line.match(/^#/) && (m = line.match( /(.*):(.*)/ )) ) {
				var key = m[1].trim();
				var value = m[2].trim();
				switch ( key ) 
				{
					case 'type':
						[bpp, signed, offset] = this._interpretPixelType(value);
						break;

					case 'dimension':
						dimension = parseInt(value, 10);
						break;

					case 'space':
						space = value;
						break;

					case 'sizes':
						var values = value.split( /\s+/ );
						sizes = values.map( function (v) { return parseInt(v, 10); } );
						break;

					case 'space directions':
						var parts = value.match( /\(.*?\)/g )
						space_dirs = parts.map( function (p) { 
							var comps = p.slice(1, -1).split( /,/ )
							return comps.map( function (comp) { return parseFloat( comp ); } ); 
						});
						break;

					case 'spacings':
						var values = value.split( /\s+/ );
						spacings = values.map( function (v) { return parseFloat(v); } );
						break;

					case 'space origin':
						space_origin = value.split('(')[1].split(')')[0].split(',');
						space_origin = space_origin.map( function (v) { return parseFloat(v); } );
						break;

					case 'encoding':
						encoding = value;
						break;

					case 'endian':
						endian = value;
						break;
				}
			}
		}

        // Validate the header
		if (!isNrrd) {
			this.done = true;
			this.errors = "Not a valid nrrd file.";
			if (this.loadCompleteCb) { this.loadCompleteCb(this); }
			return;			
		}
		if ((bpp < 0) || (bpp != 8 && bpp != 16) || (dimension !=2 && dimension !=3)) {
			this.done = true;
			this.errors = "Unsupported data type";
			if (this.loadCompleteCb) { this.loadCompleteCb(this); }
			return;
		}
        if (dimension == 2) {
            // Promote to 3D
            sizes = [sizes[0], sizes[1], 1];
            spacings = [spacings[0], spacings[1], 1];
            space_dirs = [[space_dirs[0][0], space_dirs[0][1], 0], [space_dirs[1][0], space_dirs[1][1], 0], [0, 0, 1]];
            space_origin = [space_origin[0], space_origin[1], 0];
        }

        // Configure the volume textures
        this.errors = this.vol.loadBegin(sizes, bpp, endian);   
        if (this.errors) {
            this.done = true;
            if (this.loadCompleteCb) { this.loadCompleteCb(this); }
            return;       
        } 

        // Read the pixel data, decompressing if necessary
		var rawPixelData = data.subarray(dataStart);
        var pixelData = (encoding == "raw") ? rawPixelData : fflate.decompressSync(rawPixelData); // TODO: process in chunks
		var pixVals = (bpp == 8) ? pixelData : new Uint16Array(pixelData.buffer);

        // // Set some volume attributes
        this.vol.setAttr("modality", "nrrd");
        this.vol.setAttr("rescaleSlope", 1);
        this.vol.setAttr("rescaleIntercept", 0);
        this.vol.setAttr("dataOffset", offset); ///////////////////////////////////// TODO
        this.vol.setAttr("sliceGap", 1.0); ///////////////////////////////////// TODO
        this.vol.setAttr("rowDir", space_dirs[0]);
        this.vol.setAttr("colDir", space_dirs[1]);
        this.vol.calcNearLphAxes();


        var numImgs = sizes[2];
        var pixelsPerImage = sizes[0] * sizes[1];
        this.imgBufferArray = new Array(4);    
        var batchSize = (bpp == 8) ? 4 : 2;

        for (var batchStartIndex = 0; batchStartIndex < numImgs; ) {
            batchSize = Math.min(batchSize, this.vol.dims[2] - batchStartIndex);
            var batchInfo = { startIndex:batchStartIndex, endIndex:batchStartIndex+batchSize, numLeftToLoad:batchSize, imgBuffers:this.imgBufferArray };
    
            for (i = 0; i < batchSize; i++) {
                var imgIndx = batchInfo.startIndex + i;
                batchInfo.imgBuffers[i] = pixVals.slice(imgIndx*pixelsPerImage, (imgIndx+1)*pixelsPerImage).buffer;

                batchInfo.numLeftToLoad--;
                if (batchInfo.numLeftToLoad === 0) {
                    // Copy the image data to the webgl texture
                    this._copyImagesToTexture(batchInfo);
                    
                    if (batchInfo.endIndex == this.vol.dims[2]) {
                        if (!this.done) {
                            this.vol.loadEnd();
                            this.done = true;            
                            if (this.loadCompleteCb) { this.loadCompleteCb(this); }
                            return;
                        }
                    }
                }    
                // Maybe report progress
                if (this.loadProgressCb) {
                    this.loadProgressCb(batchInfo.endIndex-batchInfo.numLeftToLoad, this.vol.dims[2]);
                    await new Promise(r => setTimeout(r, 5));
                    if (this.cancelled) { return; } 
                }
            }
            batchStartIndex += batchSize;
        }
    }
    catch (ex) {
        this._onImageLoadingError(fileReader);
    }
};


/**
 * 
 * @private
 * 
 */
Namespace.NrrdLoader3D.prototype._interpretPixelType = function(typeString)
{
	var bpp = -1, signed = false, offset = 0;

	switch( typeString ) 
	{
		case 'uchar':
		case 'unsigned char':
		case 'uint8':
		case 'uint8_t':
			bpp = 8;
			break;

		case 'signed char':
		case 'int8':
		case 'int8_t':
			bpp = 8;
			signed = true;
            offset = 2**(bpp-1);
			break;

        case 'ushort':
        case 'unsigned short':
        case 'unsigned short int':
        case 'uint16':
        case 'uint16_t':
            bpp = 16;
            break;

        case 'short':
        case 'short int':
		case 'signed short':
		case 'signed short int':
		case 'int16':
		case 'int16_t':
			bpp = 16;
			signed = true;
            offset = 2**(bpp-1);
			break;

        case 'uint':
        case 'unsigned int':
        case 'uint32':
        case 'uint32_t':
            bpp = 32;
            break;

		case 'int':
		case 'signed int':
		case 'int32':
		case 'int32_t':
			bpp = 32;
			signed = true;
            offset = 2**(bpp-1);
			break;
	}

	return [bpp, signed, offset]; 
};


})( window.BigLime = window.BigLime || {} );


},{"fflate":2}],2:[function(require,module,exports){
"use strict";
// DEFLATE is a complex format; to read this code, you should probably check the RFC first:
// https://tools.ietf.org/html/rfc1951
// You may also wish to take a look at the guide I made about this program:
// https://gist.github.com/101arrowz/253f31eb5abc3d9275ab943003ffecad
// Some of the following code is similar to that of UZIP.js:
// https://github.com/photopea/UZIP.js
// However, the vast majority of the codebase has diverged from UZIP.js to increase performance and reduce bundle size.
// Sometimes 0 will appear where -1 would be more appropriate. This is because using a uint
// is better for memory in most engines (I *think*).
var node_worker_1 = require("./node-worker.cjs");
// aliases for shorter compressed code (most minifers don't do this)
var u8 = Uint8Array, u16 = Uint16Array, i32 = Int32Array;
// fixed length extra bits
var fleb = new u8([0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 0, /* unused */ 0, 0, /* impossible */ 0]);
// fixed distance extra bits
var fdeb = new u8([0, 0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11, 12, 12, 13, 13, /* unused */ 0, 0]);
// code length index map
var clim = new u8([16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15]);
// get base, reverse index map from extra bits
var freb = function (eb, start) {
    var b = new u16(31);
    for (var i = 0; i < 31; ++i) {
        b[i] = start += 1 << eb[i - 1];
    }
    // numbers here are at max 18 bits
    var r = new i32(b[30]);
    for (var i = 1; i < 30; ++i) {
        for (var j = b[i]; j < b[i + 1]; ++j) {
            r[j] = ((j - b[i]) << 5) | i;
        }
    }
    return { b: b, r: r };
};
var _a = freb(fleb, 2), fl = _a.b, revfl = _a.r;
// we can ignore the fact that the other numbers are wrong; they never happen anyway
fl[28] = 258, revfl[258] = 28;
var _b = freb(fdeb, 0), fd = _b.b, revfd = _b.r;
// map of value to reverse (assuming 16 bits)
var rev = new u16(32768);
for (var i = 0; i < 32768; ++i) {
    // reverse table algorithm from SO
    var x = ((i & 0xAAAA) >> 1) | ((i & 0x5555) << 1);
    x = ((x & 0xCCCC) >> 2) | ((x & 0x3333) << 2);
    x = ((x & 0xF0F0) >> 4) | ((x & 0x0F0F) << 4);
    rev[i] = (((x & 0xFF00) >> 8) | ((x & 0x00FF) << 8)) >> 1;
}
// create huffman tree from u8 "map": index -> code length for code index
// mb (max bits) must be at most 15
// TODO: optimize/split up?
var hMap = (function (cd, mb, r) {
    var s = cd.length;
    // index
    var i = 0;
    // u16 "map": index -> # of codes with bit length = index
    var l = new u16(mb);
    // length of cd must be 288 (total # of codes)
    for (; i < s; ++i) {
        if (cd[i])
            ++l[cd[i] - 1];
    }
    // u16 "map": index -> minimum code for bit length = index
    var le = new u16(mb);
    for (i = 1; i < mb; ++i) {
        le[i] = (le[i - 1] + l[i - 1]) << 1;
    }
    var co;
    if (r) {
        // u16 "map": index -> number of actual bits, symbol for code
        co = new u16(1 << mb);
        // bits to remove for reverser
        var rvb = 15 - mb;
        for (i = 0; i < s; ++i) {
            // ignore 0 lengths
            if (cd[i]) {
                // num encoding both symbol and bits read
                var sv = (i << 4) | cd[i];
                // free bits
                var r_1 = mb - cd[i];
                // start value
                var v = le[cd[i] - 1]++ << r_1;
                // m is end value
                for (var m = v | ((1 << r_1) - 1); v <= m; ++v) {
                    // every 16 bit value starting with the code yields the same result
                    co[rev[v] >> rvb] = sv;
                }
            }
        }
    }
    else {
        co = new u16(s);
        for (i = 0; i < s; ++i) {
            if (cd[i]) {
                co[i] = rev[le[cd[i] - 1]++] >> (15 - cd[i]);
            }
        }
    }
    return co;
});
// fixed length tree
var flt = new u8(288);
for (var i = 0; i < 144; ++i)
    flt[i] = 8;
for (var i = 144; i < 256; ++i)
    flt[i] = 9;
for (var i = 256; i < 280; ++i)
    flt[i] = 7;
for (var i = 280; i < 288; ++i)
    flt[i] = 8;
// fixed distance tree
var fdt = new u8(32);
for (var i = 0; i < 32; ++i)
    fdt[i] = 5;
// fixed length map
var flm = /*#__PURE__*/ hMap(flt, 9, 0), flrm = /*#__PURE__*/ hMap(flt, 9, 1);
// fixed distance map
var fdm = /*#__PURE__*/ hMap(fdt, 5, 0), fdrm = /*#__PURE__*/ hMap(fdt, 5, 1);
// find max of array
var max = function (a) {
    var m = a[0];
    for (var i = 1; i < a.length; ++i) {
        if (a[i] > m)
            m = a[i];
    }
    return m;
};
// read d, starting at bit p and mask with m
var bits = function (d, p, m) {
    var o = (p / 8) | 0;
    return ((d[o] | (d[o + 1] << 8)) >> (p & 7)) & m;
};
// read d, starting at bit p continuing for at least 16 bits
var bits16 = function (d, p) {
    var o = (p / 8) | 0;
    return ((d[o] | (d[o + 1] << 8) | (d[o + 2] << 16)) >> (p & 7));
};
// get end of byte
var shft = function (p) { return ((p + 7) / 8) | 0; };
// typed array slice - allows garbage collector to free original reference,
// while being more compatible than .slice
var slc = function (v, s, e) {
    if (s == null || s < 0)
        s = 0;
    if (e == null || e > v.length)
        e = v.length;
    // can't use .constructor in case user-supplied
    return new u8(v.subarray(s, e));
};
/**
 * Codes for errors generated within this library
 */
exports.FlateErrorCode = {
    UnexpectedEOF: 0,
    InvalidBlockType: 1,
    InvalidLengthLiteral: 2,
    InvalidDistance: 3,
    StreamFinished: 4,
    NoStreamHandler: 5,
    InvalidHeader: 6,
    NoCallback: 7,
    InvalidUTF8: 8,
    ExtraFieldTooLong: 9,
    InvalidDate: 10,
    FilenameTooLong: 11,
    StreamFinishing: 12,
    InvalidZipData: 13,
    UnknownCompressionMethod: 14
};
// error codes
var ec = [
    'unexpected EOF',
    'invalid block type',
    'invalid length/literal',
    'invalid distance',
    'stream finished',
    'no stream handler',
    ,
    'no callback',
    'invalid UTF-8 data',
    'extra field too long',
    'date not in range 1980-2099',
    'filename too long',
    'stream finishing',
    'invalid zip data'
    // determined by unknown compression method
];
;
var err = function (ind, msg, nt) {
    var e = new Error(msg || ec[ind]);
    e.code = ind;
    if (Error.captureStackTrace)
        Error.captureStackTrace(e, err);
    if (!nt)
        throw e;
    return e;
};
// expands raw DEFLATE data
var inflt = function (dat, st, buf, dict) {
    // source length       dict length
    var sl = dat.length, dl = dict ? dict.length : 0;
    if (!sl || st.f && !st.l)
        return buf || new u8(0);
    var noBuf = !buf;
    // have to estimate size
    var resize = noBuf || st.i != 2;
    // no state
    var noSt = st.i;
    // Assumes roughly 33% compression ratio average
    if (noBuf)
        buf = new u8(sl * 3);
    // ensure buffer can fit at least l elements
    var cbuf = function (l) {
        var bl = buf.length;
        // need to increase size to fit
        if (l > bl) {
            // Double or set to necessary, whichever is greater
            var nbuf = new u8(Math.max(bl * 2, l));
            nbuf.set(buf);
            buf = nbuf;
        }
    };
    //  last chunk         bitpos           bytes
    var final = st.f || 0, pos = st.p || 0, bt = st.b || 0, lm = st.l, dm = st.d, lbt = st.m, dbt = st.n;
    // total bits
    var tbts = sl * 8;
    do {
        if (!lm) {
            // BFINAL - this is only 1 when last chunk is next
            final = bits(dat, pos, 1);
            // type: 0 = no compression, 1 = fixed huffman, 2 = dynamic huffman
            var type = bits(dat, pos + 1, 3);
            pos += 3;
            if (!type) {
                // go to end of byte boundary
                var s = shft(pos) + 4, l = dat[s - 4] | (dat[s - 3] << 8), t = s + l;
                if (t > sl) {
                    if (noSt)
                        err(0);
                    break;
                }
                // ensure size
                if (resize)
                    cbuf(bt + l);
                // Copy over uncompressed data
                buf.set(dat.subarray(s, t), bt);
                // Get new bitpos, update byte count
                st.b = bt += l, st.p = pos = t * 8, st.f = final;
                continue;
            }
            else if (type == 1)
                lm = flrm, dm = fdrm, lbt = 9, dbt = 5;
            else if (type == 2) {
                //  literal                            lengths
                var hLit = bits(dat, pos, 31) + 257, hcLen = bits(dat, pos + 10, 15) + 4;
                var tl = hLit + bits(dat, pos + 5, 31) + 1;
                pos += 14;
                // length+distance tree
                var ldt = new u8(tl);
                // code length tree
                var clt = new u8(19);
                for (var i = 0; i < hcLen; ++i) {
                    // use index map to get real code
                    clt[clim[i]] = bits(dat, pos + i * 3, 7);
                }
                pos += hcLen * 3;
                // code lengths bits
                var clb = max(clt), clbmsk = (1 << clb) - 1;
                // code lengths map
                var clm = hMap(clt, clb, 1);
                for (var i = 0; i < tl;) {
                    var r = clm[bits(dat, pos, clbmsk)];
                    // bits read
                    pos += r & 15;
                    // symbol
                    var s = r >> 4;
                    // code length to copy
                    if (s < 16) {
                        ldt[i++] = s;
                    }
                    else {
                        //  copy   count
                        var c = 0, n = 0;
                        if (s == 16)
                            n = 3 + bits(dat, pos, 3), pos += 2, c = ldt[i - 1];
                        else if (s == 17)
                            n = 3 + bits(dat, pos, 7), pos += 3;
                        else if (s == 18)
                            n = 11 + bits(dat, pos, 127), pos += 7;
                        while (n--)
                            ldt[i++] = c;
                    }
                }
                //    length tree                 distance tree
                var lt = ldt.subarray(0, hLit), dt = ldt.subarray(hLit);
                // max length bits
                lbt = max(lt);
                // max dist bits
                dbt = max(dt);
                lm = hMap(lt, lbt, 1);
                dm = hMap(dt, dbt, 1);
            }
            else
                err(1);
            if (pos > tbts) {
                if (noSt)
                    err(0);
                break;
            }
        }
        // Make sure the buffer can hold this + the largest possible addition
        // Maximum chunk size (practically, theoretically infinite) is 2^17
        if (resize)
            cbuf(bt + 131072);
        var lms = (1 << lbt) - 1, dms = (1 << dbt) - 1;
        var lpos = pos;
        for (;; lpos = pos) {
            // bits read, code
            var c = lm[bits16(dat, pos) & lms], sym = c >> 4;
            pos += c & 15;
            if (pos > tbts) {
                if (noSt)
                    err(0);
                break;
            }
            if (!c)
                err(2);
            if (sym < 256)
                buf[bt++] = sym;
            else if (sym == 256) {
                lpos = pos, lm = null;
                break;
            }
            else {
                var add = sym - 254;
                // no extra bits needed if less
                if (sym > 264) {
                    // index
                    var i = sym - 257, b = fleb[i];
                    add = bits(dat, pos, (1 << b) - 1) + fl[i];
                    pos += b;
                }
                // dist
                var d = dm[bits16(dat, pos) & dms], dsym = d >> 4;
                if (!d)
                    err(3);
                pos += d & 15;
                var dt = fd[dsym];
                if (dsym > 3) {
                    var b = fdeb[dsym];
                    dt += bits16(dat, pos) & (1 << b) - 1, pos += b;
                }
                if (pos > tbts) {
                    if (noSt)
                        err(0);
                    break;
                }
                if (resize)
                    cbuf(bt + 131072);
                var end = bt + add;
                if (bt < dt) {
                    var shift = dl - dt, dend = Math.min(dt, end);
                    if (shift + bt < 0)
                        err(3);
                    for (; bt < dend; ++bt)
                        buf[bt] = dict[shift + bt];
                }
                for (; bt < end; ++bt)
                    buf[bt] = buf[bt - dt];
            }
        }
        st.l = lm, st.p = lpos, st.b = bt, st.f = final;
        if (lm)
            final = 1, st.m = lbt, st.d = dm, st.n = dbt;
    } while (!final);
    // don't reallocate for streams or user buffers
    return bt != buf.length && noBuf ? slc(buf, 0, bt) : buf.subarray(0, bt);
};
// starting at p, write the minimum number of bits that can hold v to d
var wbits = function (d, p, v) {
    v <<= p & 7;
    var o = (p / 8) | 0;
    d[o] |= v;
    d[o + 1] |= v >> 8;
};
// starting at p, write the minimum number of bits (>8) that can hold v to d
var wbits16 = function (d, p, v) {
    v <<= p & 7;
    var o = (p / 8) | 0;
    d[o] |= v;
    d[o + 1] |= v >> 8;
    d[o + 2] |= v >> 16;
};
// creates code lengths from a frequency table
var hTree = function (d, mb) {
    // Need extra info to make a tree
    var t = [];
    for (var i = 0; i < d.length; ++i) {
        if (d[i])
            t.push({ s: i, f: d[i] });
    }
    var s = t.length;
    var t2 = t.slice();
    if (!s)
        return { t: et, l: 0 };
    if (s == 1) {
        var v = new u8(t[0].s + 1);
        v[t[0].s] = 1;
        return { t: v, l: 1 };
    }
    t.sort(function (a, b) { return a.f - b.f; });
    // after i2 reaches last ind, will be stopped
    // freq must be greater than largest possible number of symbols
    t.push({ s: -1, f: 25001 });
    var l = t[0], r = t[1], i0 = 0, i1 = 1, i2 = 2;
    t[0] = { s: -1, f: l.f + r.f, l: l, r: r };
    // efficient algorithm from UZIP.js
    // i0 is lookbehind, i2 is lookahead - after processing two low-freq
    // symbols that combined have high freq, will start processing i2 (high-freq,
    // non-composite) symbols instead
    // see https://reddit.com/r/photopea/comments/ikekht/uzipjs_questions/
    while (i1 != s - 1) {
        l = t[t[i0].f < t[i2].f ? i0++ : i2++];
        r = t[i0 != i1 && t[i0].f < t[i2].f ? i0++ : i2++];
        t[i1++] = { s: -1, f: l.f + r.f, l: l, r: r };
    }
    var maxSym = t2[0].s;
    for (var i = 1; i < s; ++i) {
        if (t2[i].s > maxSym)
            maxSym = t2[i].s;
    }
    // code lengths
    var tr = new u16(maxSym + 1);
    // max bits in tree
    var mbt = ln(t[i1 - 1], tr, 0);
    if (mbt > mb) {
        // more algorithms from UZIP.js
        // TODO: find out how this code works (debt)
        //  ind    debt
        var i = 0, dt = 0;
        //    left            cost
        var lft = mbt - mb, cst = 1 << lft;
        t2.sort(function (a, b) { return tr[b.s] - tr[a.s] || a.f - b.f; });
        for (; i < s; ++i) {
            var i2_1 = t2[i].s;
            if (tr[i2_1] > mb) {
                dt += cst - (1 << (mbt - tr[i2_1]));
                tr[i2_1] = mb;
            }
            else
                break;
        }
        dt >>= lft;
        while (dt > 0) {
            var i2_2 = t2[i].s;
            if (tr[i2_2] < mb)
                dt -= 1 << (mb - tr[i2_2]++ - 1);
            else
                ++i;
        }
        for (; i >= 0 && dt; --i) {
            var i2_3 = t2[i].s;
            if (tr[i2_3] == mb) {
                --tr[i2_3];
                ++dt;
            }
        }
        mbt = mb;
    }
    return { t: new u8(tr), l: mbt };
};
// get the max length and assign length codes
var ln = function (n, l, d) {
    return n.s == -1
        ? Math.max(ln(n.l, l, d + 1), ln(n.r, l, d + 1))
        : (l[n.s] = d);
};
// length codes generation
var lc = function (c) {
    var s = c.length;
    // Note that the semicolon was intentional
    while (s && !c[--s]) { }
    var cl = new u16(++s);
    //  ind      num         streak
    var cli = 0, cln = c[0], cls = 1;
    var w = function (v) { cl[cli++] = v; };
    for (var i = 1; i <= s; ++i) {
        if (c[i] == cln && i != s)
            ++cls;
        else {
            if (!cln && cls > 2) {
                for (; cls > 138; cls -= 138)
                    w(32754);
                if (cls > 2) {
                    w(cls > 10 ? ((cls - 11) << 5) | 28690 : ((cls - 3) << 5) | 12305);
                    cls = 0;
                }
            }
            else if (cls > 3) {
                w(cln), --cls;
                for (; cls > 6; cls -= 6)
                    w(8304);
                if (cls > 2)
                    w(((cls - 3) << 5) | 8208), cls = 0;
            }
            while (cls--)
                w(cln);
            cls = 1;
            cln = c[i];
        }
    }
    return { c: cl.subarray(0, cli), n: s };
};
// calculate the length of output from tree, code lengths
var clen = function (cf, cl) {
    var l = 0;
    for (var i = 0; i < cl.length; ++i)
        l += cf[i] * cl[i];
    return l;
};
// writes a fixed block
// returns the new bit pos
var wfblk = function (out, pos, dat) {
    // no need to write 00 as type: TypedArray defaults to 0
    var s = dat.length;
    var o = shft(pos + 2);
    out[o] = s & 255;
    out[o + 1] = s >> 8;
    out[o + 2] = out[o] ^ 255;
    out[o + 3] = out[o + 1] ^ 255;
    for (var i = 0; i < s; ++i)
        out[o + i + 4] = dat[i];
    return (o + 4 + s) * 8;
};
// writes a block
var wblk = function (dat, out, final, syms, lf, df, eb, li, bs, bl, p) {
    wbits(out, p++, final);
    ++lf[256];
    var _a = hTree(lf, 15), dlt = _a.t, mlb = _a.l;
    var _b = hTree(df, 15), ddt = _b.t, mdb = _b.l;
    var _c = lc(dlt), lclt = _c.c, nlc = _c.n;
    var _d = lc(ddt), lcdt = _d.c, ndc = _d.n;
    var lcfreq = new u16(19);
    for (var i = 0; i < lclt.length; ++i)
        ++lcfreq[lclt[i] & 31];
    for (var i = 0; i < lcdt.length; ++i)
        ++lcfreq[lcdt[i] & 31];
    var _e = hTree(lcfreq, 7), lct = _e.t, mlcb = _e.l;
    var nlcc = 19;
    for (; nlcc > 4 && !lct[clim[nlcc - 1]]; --nlcc) { }
    var flen = (bl + 5) << 3;
    var ftlen = clen(lf, flt) + clen(df, fdt) + eb;
    var dtlen = clen(lf, dlt) + clen(df, ddt) + eb + 14 + 3 * nlcc + clen(lcfreq, lct) + 2 * lcfreq[16] + 3 * lcfreq[17] + 7 * lcfreq[18];
    if (bs >= 0 && flen <= ftlen && flen <= dtlen)
        return wfblk(out, p, dat.subarray(bs, bs + bl));
    var lm, ll, dm, dl;
    wbits(out, p, 1 + (dtlen < ftlen)), p += 2;
    if (dtlen < ftlen) {
        lm = hMap(dlt, mlb, 0), ll = dlt, dm = hMap(ddt, mdb, 0), dl = ddt;
        var llm = hMap(lct, mlcb, 0);
        wbits(out, p, nlc - 257);
        wbits(out, p + 5, ndc - 1);
        wbits(out, p + 10, nlcc - 4);
        p += 14;
        for (var i = 0; i < nlcc; ++i)
            wbits(out, p + 3 * i, lct[clim[i]]);
        p += 3 * nlcc;
        var lcts = [lclt, lcdt];
        for (var it = 0; it < 2; ++it) {
            var clct = lcts[it];
            for (var i = 0; i < clct.length; ++i) {
                var len = clct[i] & 31;
                wbits(out, p, llm[len]), p += lct[len];
                if (len > 15)
                    wbits(out, p, (clct[i] >> 5) & 127), p += clct[i] >> 12;
            }
        }
    }
    else {
        lm = flm, ll = flt, dm = fdm, dl = fdt;
    }
    for (var i = 0; i < li; ++i) {
        var sym = syms[i];
        if (sym > 255) {
            var len = (sym >> 18) & 31;
            wbits16(out, p, lm[len + 257]), p += ll[len + 257];
            if (len > 7)
                wbits(out, p, (sym >> 23) & 31), p += fleb[len];
            var dst = sym & 31;
            wbits16(out, p, dm[dst]), p += dl[dst];
            if (dst > 3)
                wbits16(out, p, (sym >> 5) & 8191), p += fdeb[dst];
        }
        else {
            wbits16(out, p, lm[sym]), p += ll[sym];
        }
    }
    wbits16(out, p, lm[256]);
    return p + ll[256];
};
// deflate options (nice << 13) | chain
var deo = /*#__PURE__*/ new i32([65540, 131080, 131088, 131104, 262176, 1048704, 1048832, 2114560, 2117632]);
// empty
var et = /*#__PURE__*/ new u8(0);
// compresses data into a raw DEFLATE buffer
var dflt = function (dat, lvl, plvl, pre, post, st) {
    var s = st.z || dat.length;
    var o = new u8(pre + s + 5 * (1 + Math.ceil(s / 7000)) + post);
    // writing to this writes to the output buffer
    var w = o.subarray(pre, o.length - post);
    var lst = st.l;
    var pos = (st.r || 0) & 7;
    if (lvl) {
        if (pos)
            w[0] = st.r >> 3;
        var opt = deo[lvl - 1];
        var n = opt >> 13, c = opt & 8191;
        var msk_1 = (1 << plvl) - 1;
        //    prev 2-byte val map    curr 2-byte val map
        var prev = st.p || new u16(32768), head = st.h || new u16(msk_1 + 1);
        var bs1_1 = Math.ceil(plvl / 3), bs2_1 = 2 * bs1_1;
        var hsh = function (i) { return (dat[i] ^ (dat[i + 1] << bs1_1) ^ (dat[i + 2] << bs2_1)) & msk_1; };
        // 24576 is an arbitrary number of maximum symbols per block
        // 424 buffer for last block
        var syms = new i32(25000);
        // length/literal freq   distance freq
        var lf = new u16(288), df = new u16(32);
        //  l/lcnt  exbits  index          l/lind  waitdx          blkpos
        var lc_1 = 0, eb = 0, i = st.i || 0, li = 0, wi = st.w || 0, bs = 0;
        for (; i + 2 < s; ++i) {
            // hash value
            var hv = hsh(i);
            // index mod 32768    previous index mod
            var imod = i & 32767, pimod = head[hv];
            prev[imod] = pimod;
            head[hv] = imod;
            // We always should modify head and prev, but only add symbols if
            // this data is not yet processed ("wait" for wait index)
            if (wi <= i) {
                // bytes remaining
                var rem = s - i;
                if ((lc_1 > 7000 || li > 24576) && (rem > 423 || !lst)) {
                    pos = wblk(dat, w, 0, syms, lf, df, eb, li, bs, i - bs, pos);
                    li = lc_1 = eb = 0, bs = i;
                    for (var j = 0; j < 286; ++j)
                        lf[j] = 0;
                    for (var j = 0; j < 30; ++j)
                        df[j] = 0;
                }
                //  len    dist   chain
                var l = 2, d = 0, ch_1 = c, dif = imod - pimod & 32767;
                if (rem > 2 && hv == hsh(i - dif)) {
                    var maxn = Math.min(n, rem) - 1;
                    var maxd = Math.min(32767, i);
                    // max possible length
                    // not capped at dif because decompressors implement "rolling" index population
                    var ml = Math.min(258, rem);
                    while (dif <= maxd && --ch_1 && imod != pimod) {
                        if (dat[i + l] == dat[i + l - dif]) {
                            var nl = 0;
                            for (; nl < ml && dat[i + nl] == dat[i + nl - dif]; ++nl) {}
                            if (nl > l) {
                                l = nl, d = dif;
                                // break out early when we reach "nice" (we are satisfied enough)
                                if (nl > maxn)
                                    break;
                                // now, find the rarest 2-byte sequence within this
                                // length of literals and search for that instead.
                                // Much faster than just using the start
                                var mmd = Math.min(dif, nl - 2);
                                var md = 0;
                                for (var j = 0; j < mmd; ++j) {
                                    var ti = i - dif + j & 32767;
                                    var pti = prev[ti];
                                    var cd = ti - pti & 32767;
                                    if (cd > md)
                                        md = cd, pimod = ti;
                                }
                            }
                        }
                        // check the previous match
                        imod = pimod, pimod = prev[imod];
                        dif += imod - pimod & 32767;
                    }
                }
                // d will be nonzero only when a match was found
                if (d) {
                    // store both dist and len data in one int32
                    // Make sure this is recognized as a len/dist with 28th bit (2^28)
                    syms[li++] = 268435456 | (revfl[l] << 18) | revfd[d];
                    var lin = revfl[l] & 31, din = revfd[d] & 31;
                    eb += fleb[lin] + fdeb[din];
                    ++lf[257 + lin];
                    ++df[din];
                    wi = i + l;
                    ++lc_1;
                }
                else {
                    syms[li++] = dat[i];
                    ++lf[dat[i]];
                }
            }
        }
        for (i = Math.max(i, wi); i < s; ++i) {
            syms[li++] = dat[i];
            ++lf[dat[i]];
        }
        pos = wblk(dat, w, lst, syms, lf, df, eb, li, bs, i - bs, pos);
        if (!lst) {
            st.r = (pos & 7) | w[(pos / 8) | 0] << 3;
            // shft(pos) now 1 less if pos & 7 != 0
            pos -= 7;
            st.h = head, st.p = prev, st.i = i, st.w = wi;
        }
    }
    else {
        for (var i = st.w || 0; i < s + lst; i += 65535) {
            // end
            var e = i + 65535;
            if (e >= s) {
                // write final block
                w[(pos / 8) | 0] = lst;
                e = s;
            }
            pos = wfblk(w, pos + 1, dat.subarray(i, e));
        }
        st.i = s;
    }
    return slc(o, 0, pre + shft(pos) + post);
};
// CRC32 table
var crct = /*#__PURE__*/ (function () {
    var t = new Int32Array(256);
    for (var i = 0; i < 256; ++i) {
        var c = i, k = 9;
        while (--k)
            c = ((c & 1) && -306674912) ^ (c >>> 1);
        t[i] = c;
    }
    return t;
})();
// CRC32
var crc = function () {
    var c = -1;
    return {
        p: function (d) {
            // closures have awful performance
            var cr = c;
            for (var i = 0; i < d.length; ++i)
                cr = crct[(cr & 255) ^ d[i]] ^ (cr >>> 8);
            c = cr;
        },
        d: function () { return ~c; }
    };
};
// Adler32
var adler = function () {
    var a = 1, b = 0;
    return {
        p: function (d) {
            // closures have awful performance
            var n = a, m = b;
            var l = d.length | 0;
            for (var i = 0; i != l;) {
                var e = Math.min(i + 2655, l);
                for (; i < e; ++i)
                    m += n += d[i];
                n = (n & 65535) + 15 * (n >> 16), m = (m & 65535) + 15 * (m >> 16);
            }
            a = n, b = m;
        },
        d: function () {
            a %= 65521, b %= 65521;
            return (a & 255) << 24 | (a & 0xFF00) << 8 | (b & 255) << 8 | (b >> 8);
        }
    };
};
;
// deflate with opts
var dopt = function (dat, opt, pre, post, st) {
    if (!st) {
        st = { l: 1 };
        if (opt.dictionary) {
            var dict = opt.dictionary.subarray(-32768);
            var newDat = new u8(dict.length + dat.length);
            newDat.set(dict);
            newDat.set(dat, dict.length);
            dat = newDat;
            st.w = dict.length;
        }
    }
    return dflt(dat, opt.level == null ? 6 : opt.level, opt.mem == null ? (st.l ? Math.ceil(Math.max(8, Math.min(13, Math.log(dat.length))) * 1.5) : 20) : (12 + opt.mem), pre, post, st);
};
// Walmart object spread
var mrg = function (a, b) {
    var o = {};
    for (var k in a)
        o[k] = a[k];
    for (var k in b)
        o[k] = b[k];
    return o;
};
// worker clone
// This is possibly the craziest part of the entire codebase, despite how simple it may seem.
// The only parameter to this function is a closure that returns an array of variables outside of the function scope.
// We're going to try to figure out the variable names used in the closure as strings because that is crucial for workerization.
// We will return an object mapping of true variable name to value (basically, the current scope as a JS object).
// The reason we can't just use the original variable names is minifiers mangling the toplevel scope.
// This took me three weeks to figure out how to do.
var wcln = function (fn, fnStr, td) {
    var dt = fn();
    var st = fn.toString();
    var ks = st.slice(st.indexOf('[') + 1, st.lastIndexOf(']')).replace(/\s+/g, '').split(',');
    for (var i = 0; i < dt.length; ++i) {
        var v = dt[i], k = ks[i];
        if (typeof v == 'function') {
            fnStr += ';' + k + '=';
            var st_1 = v.toString();
            if (v.prototype) {
                // for global objects
                if (st_1.indexOf('[native code]') != -1) {
                    var spInd = st_1.indexOf(' ', 8) + 1;
                    fnStr += st_1.slice(spInd, st_1.indexOf('(', spInd));
                }
                else {
                    fnStr += st_1;
                    for (var t in v.prototype)
                        fnStr += ';' + k + '.prototype.' + t + '=' + v.prototype[t].toString();
                }
            }
            else
                fnStr += st_1;
        }
        else
            td[k] = v;
    }
    return fnStr;
};
var ch = [];
// clone bufs
var cbfs = function (v) {
    var tl = [];
    for (var k in v) {
        if (v[k].buffer) {
            tl.push((v[k] = new v[k].constructor(v[k])).buffer);
        }
    }
    return tl;
};
// use a worker to execute code
var wrkr = function (fns, init, id, cb) {
    if (!ch[id]) {
        var fnStr = '', td_1 = {}, m = fns.length - 1;
        for (var i = 0; i < m; ++i)
            fnStr = wcln(fns[i], fnStr, td_1);
        ch[id] = { c: wcln(fns[m], fnStr, td_1), e: td_1 };
    }
    var td = mrg({}, ch[id].e);
    return (0, node_worker_1.default)(ch[id].c + ';onmessage=function(e){for(var k in e.data)self[k]=e.data[k];onmessage=' + init.toString() + '}', id, td, cbfs(td), cb);
};
// base async inflate fn
var bInflt = function () { return [u8, u16, i32, fleb, fdeb, clim, fl, fd, flrm, fdrm, rev, ec, hMap, max, bits, bits16, shft, slc, err, inflt, inflateSync, pbf, gopt]; };
var bDflt = function () { return [u8, u16, i32, fleb, fdeb, clim, revfl, revfd, flm, flt, fdm, fdt, rev, deo, et, hMap, wbits, wbits16, hTree, ln, lc, clen, wfblk, wblk, shft, slc, dflt, dopt, deflateSync, pbf]; };
// gzip extra
var gze = function () { return [gzh, gzhl, wbytes, crc, crct]; };
// gunzip extra
var guze = function () { return [gzs, gzl]; };
// zlib extra
var zle = function () { return [zlh, wbytes, adler]; };
// unzlib extra
var zule = function () { return [zls]; };
// post buf
var pbf = function (msg) { return postMessage(msg, [msg.buffer]); };
// get opts
var gopt = function (o) { return o && {
    out: o.size && new u8(o.size),
    dictionary: o.dictionary
}; };
// async helper
var cbify = function (dat, opts, fns, init, id, cb) {
    var w = wrkr(fns, init, id, function (err, dat) {
        w.terminate();
        cb(err, dat);
    });
    w.postMessage([dat, opts], opts.consume ? [dat.buffer] : []);
    return function () { w.terminate(); };
};
// auto stream
var astrm = function (strm) {
    strm.ondata = function (dat, final) { return postMessage([dat, final], [dat.buffer]); };
    return function (ev) {
        if (ev.data.length) {
            strm.push(ev.data[0], ev.data[1]);
            postMessage([ev.data[0].length]);
        }
        else
            strm.flush();
    };
};
// async stream attach
var astrmify = function (fns, strm, opts, init, id, flush, ext) {
    var t;
    var w = wrkr(fns, init, id, function (err, dat) {
        if (err)
            w.terminate(), strm.ondata.call(strm, err);
        else if (!Array.isArray(dat))
            ext(dat);
        else if (dat.length == 1) {
            strm.queuedSize -= dat[0];
            if (strm.ondrain)
                strm.ondrain(dat[0]);
        }
        else {
            if (dat[1])
                w.terminate();
            strm.ondata.call(strm, err, dat[0], dat[1]);
        }
    });
    w.postMessage(opts);
    strm.queuedSize = 0;
    strm.push = function (d, f) {
        if (!strm.ondata)
            err(5);
        if (t)
            strm.ondata(err(4, 0, 1), null, !!f);
        strm.queuedSize += d.length;
        w.postMessage([d, t = f], [d.buffer]);
    };
    strm.terminate = function () { w.terminate(); };
    if (flush) {
        strm.flush = function () { w.postMessage([]); };
    }
};
// read 2 bytes
var b2 = function (d, b) { return d[b] | (d[b + 1] << 8); };
// read 4 bytes
var b4 = function (d, b) { return (d[b] | (d[b + 1] << 8) | (d[b + 2] << 16) | (d[b + 3] << 24)) >>> 0; };
var b8 = function (d, b) { return b4(d, b) + (b4(d, b + 4) * 4294967296); };
// write bytes
var wbytes = function (d, b, v) {
    for (; v; ++b)
        d[b] = v, v >>>= 8;
};
// gzip header
var gzh = function (c, o) {
    var fn = o.filename;
    c[0] = 31, c[1] = 139, c[2] = 8, c[8] = o.level < 2 ? 4 : o.level == 9 ? 2 : 0, c[9] = 3; // assume Unix
    if (o.mtime != 0)
        wbytes(c, 4, Math.floor(new Date(o.mtime || Date.now()) / 1000));
    if (fn) {
        c[3] = 8;
        for (var i = 0; i <= fn.length; ++i)
            c[i + 10] = fn.charCodeAt(i);
    }
};
// gzip footer: -8 to -4 = CRC, -4 to -0 is length
// gzip start
var gzs = function (d) {
    if (d[0] != 31 || d[1] != 139 || d[2] != 8)
        err(6, 'invalid gzip data');
    var flg = d[3];
    var st = 10;
    if (flg & 4)
        st += (d[10] | d[11] << 8) + 2;
    for (var zs = (flg >> 3 & 1) + (flg >> 4 & 1); zs > 0; zs -= !d[st++]) {}
    return st + (flg & 2);
};
// gzip length
var gzl = function (d) {
    var l = d.length;
    return (d[l - 4] | d[l - 3] << 8 | d[l - 2] << 16 | d[l - 1] << 24) >>> 0;
};
// gzip header length
var gzhl = function (o) { return 10 + (o.filename ? o.filename.length + 1 : 0); };
// zlib header
var zlh = function (c, o) {
    var lv = o.level, fl = lv == 0 ? 0 : lv < 6 ? 1 : lv == 9 ? 3 : 2;
    c[0] = 120, c[1] = (fl << 6) | (o.dictionary && 32);
    c[1] |= 31 - ((c[0] << 8) | c[1]) % 31;
    if (o.dictionary) {
        var h = adler();
        h.p(o.dictionary);
        wbytes(c, 2, h.d());
    }
};
// zlib start
var zls = function (d, dict) {
    if ((d[0] & 15) != 8 || (d[0] >> 4) > 7 || ((d[0] << 8 | d[1]) % 31))
        err(6, 'invalid zlib data');
    if ((d[1] >> 5 & 1) == +!dict)
        err(6, 'invalid zlib data: ' + (d[1] & 32 ? 'need' : 'unexpected') + ' dictionary');
    return (d[1] >> 3 & 4) + 2;
};
function StrmOpt(opts, cb) {
    if (typeof opts == 'function')
        cb = opts, opts = {};
    this.ondata = cb;
    return opts;
}
/**
 * Streaming DEFLATE compression
 */
var Deflate = /*#__PURE__*/ (function () {
    function Deflate(opts, cb) {
        if (typeof opts == 'function')
            cb = opts, opts = {};
        this.ondata = cb;
        this.o = opts || {};
        this.s = { l: 0, i: 32768, w: 32768, z: 32768 };
        // Buffer length must always be 0 mod 32768 for index calculations to be correct when modifying head and prev
        // 98304 = 32768 (lookback) + 65536 (common chunk size)
        this.b = new u8(98304);
        if (this.o.dictionary) {
            var dict = this.o.dictionary.subarray(-32768);
            this.b.set(dict, 32768 - dict.length);
            this.s.i = 32768 - dict.length;
        }
    }
    Deflate.prototype.p = function (c, f) {
        this.ondata(dopt(c, this.o, 0, 0, this.s), f);
    };
    /**
     * Pushes a chunk to be deflated
     * @param chunk The chunk to push
     * @param final Whether this is the last chunk
     */
    Deflate.prototype.push = function (chunk, final) {
        if (!this.ondata)
            err(5);
        if (this.s.l)
            err(4);
        var endLen = chunk.length + this.s.z;
        if (endLen > this.b.length) {
            if (endLen > 2 * this.b.length - 32768) {
                var newBuf = new u8(endLen & -32768);
                newBuf.set(this.b.subarray(0, this.s.z));
                this.b = newBuf;
            }
            var split = this.b.length - this.s.z;
            this.b.set(chunk.subarray(0, split), this.s.z);
            this.s.z = this.b.length;
            this.p(this.b, false);
            this.b.set(this.b.subarray(-32768));
            this.b.set(chunk.subarray(split), 32768);
            this.s.z = chunk.length - split + 32768;
            this.s.i = 32766, this.s.w = 32768;
        }
        else {
            this.b.set(chunk, this.s.z);
            this.s.z += chunk.length;
        }
        this.s.l = final & 1;
        if (this.s.z > this.s.w + 8191 || final) {
            this.p(this.b, final || false);
            this.s.w = this.s.i, this.s.i -= 2;
        }
    };
    /**
     * Flushes buffered uncompressed data. Useful to immediately retrieve the
     * deflated output for small inputs.
     */
    Deflate.prototype.flush = function () {
        if (!this.ondata)
            err(5);
        if (this.s.l)
            err(4);
        this.p(this.b, false);
        this.s.w = this.s.i, this.s.i -= 2;
    };
    return Deflate;
}());
exports.Deflate = Deflate;
/**
 * Asynchronous streaming DEFLATE compression
 */
var AsyncDeflate = /*#__PURE__*/ (function () {
    function AsyncDeflate(opts, cb) {
        astrmify([
            bDflt,
            function () { return [astrm, Deflate]; }
        ], this, StrmOpt.call(this, opts, cb), function (ev) {
            var strm = new Deflate(ev.data);
            onmessage = astrm(strm);
        }, 6, 1);
    }
    return AsyncDeflate;
}());
exports.AsyncDeflate = AsyncDeflate;
function deflate(data, opts, cb) {
    if (!cb)
        cb = opts, opts = {};
    if (typeof cb != 'function')
        err(7);
    return cbify(data, opts, [
        bDflt,
    ], function (ev) { return pbf(deflateSync(ev.data[0], ev.data[1])); }, 0, cb);
}
exports.deflate = deflate;
/**
 * Compresses data with DEFLATE without any wrapper
 * @param data The data to compress
 * @param opts The compression options
 * @returns The deflated version of the data
 */
function deflateSync(data, opts) {
    return dopt(data, opts || {}, 0, 0);
}
exports.deflateSync = deflateSync;
/**
 * Streaming DEFLATE decompression
 */
var Inflate = /*#__PURE__*/ (function () {
    function Inflate(opts, cb) {
        // no StrmOpt here to avoid adding to workerizer
        if (typeof opts == 'function')
            cb = opts, opts = {};
        this.ondata = cb;
        var dict = opts && opts.dictionary && opts.dictionary.subarray(-32768);
        this.s = { i: 0, b: dict ? dict.length : 0 };
        this.o = new u8(32768);
        this.p = new u8(0);
        if (dict)
            this.o.set(dict);
    }
    Inflate.prototype.e = function (c) {
        if (!this.ondata)
            err(5);
        if (this.d)
            err(4);
        if (!this.p.length)
            this.p = c;
        else if (c.length) {
            var n = new u8(this.p.length + c.length);
            n.set(this.p), n.set(c, this.p.length), this.p = n;
        }
    };
    Inflate.prototype.c = function (final) {
        this.s.i = +(this.d = final || false);
        var bts = this.s.b;
        var dt = inflt(this.p, this.s, this.o);
        this.ondata(slc(dt, bts, this.s.b), this.d);
        this.o = slc(dt, this.s.b - 32768), this.s.b = this.o.length;
        this.p = slc(this.p, (this.s.p / 8) | 0), this.s.p &= 7;
    };
    /**
     * Pushes a chunk to be inflated
     * @param chunk The chunk to push
     * @param final Whether this is the final chunk
     */
    Inflate.prototype.push = function (chunk, final) {
        this.e(chunk), this.c(final);
    };
    return Inflate;
}());
exports.Inflate = Inflate;
/**
 * Asynchronous streaming DEFLATE decompression
 */
var AsyncInflate = /*#__PURE__*/ (function () {
    function AsyncInflate(opts, cb) {
        astrmify([
            bInflt,
            function () { return [astrm, Inflate]; }
        ], this, StrmOpt.call(this, opts, cb), function (ev) {
            var strm = new Inflate(ev.data);
            onmessage = astrm(strm);
        }, 7, 0);
    }
    return AsyncInflate;
}());
exports.AsyncInflate = AsyncInflate;
function inflate(data, opts, cb) {
    if (!cb)
        cb = opts, opts = {};
    if (typeof cb != 'function')
        err(7);
    return cbify(data, opts, [
        bInflt
    ], function (ev) { return pbf(inflateSync(ev.data[0], gopt(ev.data[1]))); }, 1, cb);
}
exports.inflate = inflate;
/**
 * Expands DEFLATE data with no wrapper
 * @param data The data to decompress
 * @param opts The decompression options
 * @returns The decompressed version of the data
 */
function inflateSync(data, opts) {
    return inflt(data, { i: 2 }, opts && opts.out, opts && opts.dictionary);
}
exports.inflateSync = inflateSync;
// before you yell at me for not just using extends, my reason is that TS inheritance is hard to workerize.
/**
 * Streaming GZIP compression
 */
var Gzip = /*#__PURE__*/ (function () {
    function Gzip(opts, cb) {
        this.c = crc();
        this.l = 0;
        this.v = 1;
        Deflate.call(this, opts, cb);
    }
    /**
     * Pushes a chunk to be GZIPped
     * @param chunk The chunk to push
     * @param final Whether this is the last chunk
     */
    Gzip.prototype.push = function (chunk, final) {
        this.c.p(chunk);
        this.l += chunk.length;
        Deflate.prototype.push.call(this, chunk, final);
    };
    Gzip.prototype.p = function (c, f) {
        var raw = dopt(c, this.o, this.v && gzhl(this.o), f && 8, this.s);
        if (this.v)
            gzh(raw, this.o), this.v = 0;
        if (f)
            wbytes(raw, raw.length - 8, this.c.d()), wbytes(raw, raw.length - 4, this.l);
        this.ondata(raw, f);
    };
    /**
     * Flushes buffered uncompressed data. Useful to immediately retrieve the
     * GZIPped output for small inputs.
     */
    Gzip.prototype.flush = function () {
        Deflate.prototype.flush.call(this);
    };
    return Gzip;
}());
exports.Gzip = Gzip;
exports.Compress = Gzip;
/**
 * Asynchronous streaming GZIP compression
 */
var AsyncGzip = /*#__PURE__*/ (function () {
    function AsyncGzip(opts, cb) {
        astrmify([
            bDflt,
            gze,
            function () { return [astrm, Deflate, Gzip]; }
        ], this, StrmOpt.call(this, opts, cb), function (ev) {
            var strm = new Gzip(ev.data);
            onmessage = astrm(strm);
        }, 8, 1);
    }
    return AsyncGzip;
}());
exports.AsyncGzip = AsyncGzip;
exports.AsyncCompress = AsyncGzip;
function gzip(data, opts, cb) {
    if (!cb)
        cb = opts, opts = {};
    if (typeof cb != 'function')
        err(7);
    return cbify(data, opts, [
        bDflt,
        gze,
        function () { return [gzipSync]; }
    ], function (ev) { return pbf(gzipSync(ev.data[0], ev.data[1])); }, 2, cb);
}
exports.gzip = gzip;
exports.compress = gzip;
/**
 * Compresses data with GZIP
 * @param data The data to compress
 * @param opts The compression options
 * @returns The gzipped version of the data
 */
function gzipSync(data, opts) {
    if (!opts)
        opts = {};
    var c = crc(), l = data.length;
    c.p(data);
    var d = dopt(data, opts, gzhl(opts), 8), s = d.length;
    return gzh(d, opts), wbytes(d, s - 8, c.d()), wbytes(d, s - 4, l), d;
}
exports.gzipSync = gzipSync;
exports.compressSync = gzipSync;
/**
 * Streaming single or multi-member GZIP decompression
 */
var Gunzip = /*#__PURE__*/ (function () {
    function Gunzip(opts, cb) {
        this.v = 1;
        this.r = 0;
        Inflate.call(this, opts, cb);
    }
    /**
     * Pushes a chunk to be GUNZIPped
     * @param chunk The chunk to push
     * @param final Whether this is the last chunk
     */
    Gunzip.prototype.push = function (chunk, final) {
        Inflate.prototype.e.call(this, chunk);
        this.r += chunk.length;
        if (this.v) {
            var p = this.p.subarray(this.v - 1);
            var s = p.length > 3 ? gzs(p) : 4;
            if (s > p.length) {
                if (!final)
                    return;
            }
            else if (this.v > 1 && this.onmember) {
                this.onmember(this.r - p.length);
            }
            this.p = p.subarray(s), this.v = 0;
        }
        // necessary to prevent TS from using the closure value
        // This allows for workerization to function correctly
        Inflate.prototype.c.call(this, final);
        // process concatenated GZIP
        if (this.s.f && !this.s.l && !final) {
            this.v = shft(this.s.p) + 9;
            this.s = { i: 0 };
            this.o = new u8(0);
            this.push(new u8(0), final);
        }
    };
    return Gunzip;
}());
exports.Gunzip = Gunzip;
/**
 * Asynchronous streaming single or multi-member GZIP decompression
 */
var AsyncGunzip = /*#__PURE__*/ (function () {
    function AsyncGunzip(opts, cb) {
        var _this = this;
        astrmify([
            bInflt,
            guze,
            function () { return [astrm, Inflate, Gunzip]; }
        ], this, StrmOpt.call(this, opts, cb), function (ev) {
            var strm = new Gunzip(ev.data);
            strm.onmember = function (offset) { return postMessage(offset); };
            onmessage = astrm(strm);
        }, 9, 0, function (offset) { return _this.onmember && _this.onmember(offset); });
    }
    return AsyncGunzip;
}());
exports.AsyncGunzip = AsyncGunzip;
function gunzip(data, opts, cb) {
    if (!cb)
        cb = opts, opts = {};
    if (typeof cb != 'function')
        err(7);
    return cbify(data, opts, [
        bInflt,
        guze,
        function () { return [gunzipSync]; }
    ], function (ev) { return pbf(gunzipSync(ev.data[0], ev.data[1])); }, 3, cb);
}
exports.gunzip = gunzip;
/**
 * Expands GZIP data
 * @param data The data to decompress
 * @param opts The decompression options
 * @returns The decompressed version of the data
 */
function gunzipSync(data, opts) {
    var st = gzs(data);
    if (st + 8 > data.length)
        err(6, 'invalid gzip data');
    return inflt(data.subarray(st, -8), { i: 2 }, opts && opts.out || new u8(gzl(data)), opts && opts.dictionary);
}
exports.gunzipSync = gunzipSync;
/**
 * Streaming Zlib compression
 */
var Zlib = /*#__PURE__*/ (function () {
    function Zlib(opts, cb) {
        this.c = adler();
        this.v = 1;
        Deflate.call(this, opts, cb);
    }
    /**
     * Pushes a chunk to be zlibbed
     * @param chunk The chunk to push
     * @param final Whether this is the last chunk
     */
    Zlib.prototype.push = function (chunk, final) {
        this.c.p(chunk);
        Deflate.prototype.push.call(this, chunk, final);
    };
    Zlib.prototype.p = function (c, f) {
        var raw = dopt(c, this.o, this.v && (this.o.dictionary ? 6 : 2), f && 4, this.s);
        if (this.v)
            zlh(raw, this.o), this.v = 0;
        if (f)
            wbytes(raw, raw.length - 4, this.c.d());
        this.ondata(raw, f);
    };
    /**
     * Flushes buffered uncompressed data. Useful to immediately retrieve the
     * zlibbed output for small inputs.
     */
    Zlib.prototype.flush = function () {
        Deflate.prototype.flush.call(this);
    };
    return Zlib;
}());
exports.Zlib = Zlib;
/**
 * Asynchronous streaming Zlib compression
 */
var AsyncZlib = /*#__PURE__*/ (function () {
    function AsyncZlib(opts, cb) {
        astrmify([
            bDflt,
            zle,
            function () { return [astrm, Deflate, Zlib]; }
        ], this, StrmOpt.call(this, opts, cb), function (ev) {
            var strm = new Zlib(ev.data);
            onmessage = astrm(strm);
        }, 10, 1);
    }
    return AsyncZlib;
}());
exports.AsyncZlib = AsyncZlib;
function zlib(data, opts, cb) {
    if (!cb)
        cb = opts, opts = {};
    if (typeof cb != 'function')
        err(7);
    return cbify(data, opts, [
        bDflt,
        zle,
        function () { return [zlibSync]; }
    ], function (ev) { return pbf(zlibSync(ev.data[0], ev.data[1])); }, 4, cb);
}
exports.zlib = zlib;
/**
 * Compress data with Zlib
 * @param data The data to compress
 * @param opts The compression options
 * @returns The zlib-compressed version of the data
 */
function zlibSync(data, opts) {
    if (!opts)
        opts = {};
    var a = adler();
    a.p(data);
    var d = dopt(data, opts, opts.dictionary ? 6 : 2, 4);
    return zlh(d, opts), wbytes(d, d.length - 4, a.d()), d;
}
exports.zlibSync = zlibSync;
/**
 * Streaming Zlib decompression
 */
var Unzlib = /*#__PURE__*/ (function () {
    function Unzlib(opts, cb) {
        Inflate.call(this, opts, cb);
        this.v = opts && opts.dictionary ? 2 : 1;
    }
    /**
     * Pushes a chunk to be unzlibbed
     * @param chunk The chunk to push
     * @param final Whether this is the last chunk
     */
    Unzlib.prototype.push = function (chunk, final) {
        Inflate.prototype.e.call(this, chunk);
        if (this.v) {
            if (this.p.length < 6 && !final)
                return;
            this.p = this.p.subarray(zls(this.p, this.v - 1)), this.v = 0;
        }
        if (final) {
            if (this.p.length < 4)
                err(6, 'invalid zlib data');
            this.p = this.p.subarray(0, -4);
        }
        // necessary to prevent TS from using the closure value
        // This allows for workerization to function correctly
        Inflate.prototype.c.call(this, final);
    };
    return Unzlib;
}());
exports.Unzlib = Unzlib;
/**
 * Asynchronous streaming Zlib decompression
 */
var AsyncUnzlib = /*#__PURE__*/ (function () {
    function AsyncUnzlib(opts, cb) {
        astrmify([
            bInflt,
            zule,
            function () { return [astrm, Inflate, Unzlib]; }
        ], this, StrmOpt.call(this, opts, cb), function (ev) {
            var strm = new Unzlib(ev.data);
            onmessage = astrm(strm);
        }, 11, 0);
    }
    return AsyncUnzlib;
}());
exports.AsyncUnzlib = AsyncUnzlib;
function unzlib(data, opts, cb) {
    if (!cb)
        cb = opts, opts = {};
    if (typeof cb != 'function')
        err(7);
    return cbify(data, opts, [
        bInflt,
        zule,
        function () { return [unzlibSync]; }
    ], function (ev) { return pbf(unzlibSync(ev.data[0], gopt(ev.data[1]))); }, 5, cb);
}
exports.unzlib = unzlib;
/**
 * Expands Zlib data
 * @param data The data to decompress
 * @param opts The decompression options
 * @returns The decompressed version of the data
 */
function unzlibSync(data, opts) {
    return inflt(data.subarray(zls(data, opts && opts.dictionary), -4), { i: 2 }, opts && opts.out, opts && opts.dictionary);
}
exports.unzlibSync = unzlibSync;
/**
 * Streaming GZIP, Zlib, or raw DEFLATE decompression
 */
var Decompress = /*#__PURE__*/ (function () {
    function Decompress(opts, cb) {
        this.o = StrmOpt.call(this, opts, cb) || {};
        this.G = Gunzip;
        this.I = Inflate;
        this.Z = Unzlib;
    }
    // init substream
    // overriden by AsyncDecompress
    Decompress.prototype.i = function () {
        var _this = this;
        this.s.ondata = function (dat, final) {
            _this.ondata(dat, final);
        };
    };
    /**
     * Pushes a chunk to be decompressed
     * @param chunk The chunk to push
     * @param final Whether this is the last chunk
     */
    Decompress.prototype.push = function (chunk, final) {
        if (!this.ondata)
            err(5);
        if (!this.s) {
            if (this.p && this.p.length) {
                var n = new u8(this.p.length + chunk.length);
                n.set(this.p), n.set(chunk, this.p.length);
            }
            else
                this.p = chunk;
            if (this.p.length > 2) {
                this.s = (this.p[0] == 31 && this.p[1] == 139 && this.p[2] == 8)
                    ? new this.G(this.o)
                    : ((this.p[0] & 15) != 8 || (this.p[0] >> 4) > 7 || ((this.p[0] << 8 | this.p[1]) % 31))
                        ? new this.I(this.o)
                        : new this.Z(this.o);
                this.i();
                this.s.push(this.p, final);
                this.p = null;
            }
        }
        else
            this.s.push(chunk, final);
    };
    return Decompress;
}());
exports.Decompress = Decompress;
/**
 * Asynchronous streaming GZIP, Zlib, or raw DEFLATE decompression
 */
var AsyncDecompress = /*#__PURE__*/ (function () {
    function AsyncDecompress(opts, cb) {
        Decompress.call(this, opts, cb);
        this.queuedSize = 0;
        this.G = AsyncGunzip;
        this.I = AsyncInflate;
        this.Z = AsyncUnzlib;
    }
    AsyncDecompress.prototype.i = function () {
        var _this = this;
        this.s.ondata = function (err, dat, final) {
            _this.ondata(err, dat, final);
        };
        this.s.ondrain = function (size) {
            _this.queuedSize -= size;
            if (_this.ondrain)
                _this.ondrain(size);
        };
    };
    /**
     * Pushes a chunk to be decompressed
     * @param chunk The chunk to push
     * @param final Whether this is the last chunk
     */
    AsyncDecompress.prototype.push = function (chunk, final) {
        this.queuedSize += chunk.length;
        Decompress.prototype.push.call(this, chunk, final);
    };
    return AsyncDecompress;
}());
exports.AsyncDecompress = AsyncDecompress;
function decompress(data, opts, cb) {
    if (!cb)
        cb = opts, opts = {};
    if (typeof cb != 'function')
        err(7);
    return (data[0] == 31 && data[1] == 139 && data[2] == 8)
        ? gunzip(data, opts, cb)
        : ((data[0] & 15) != 8 || (data[0] >> 4) > 7 || ((data[0] << 8 | data[1]) % 31))
            ? inflate(data, opts, cb)
            : unzlib(data, opts, cb);
}
exports.decompress = decompress;
/**
 * Expands compressed GZIP, Zlib, or raw DEFLATE data, automatically detecting the format
 * @param data The data to decompress
 * @param opts The decompression options
 * @returns The decompressed version of the data
 */
function decompressSync(data, opts) {
    return (data[0] == 31 && data[1] == 139 && data[2] == 8)
        ? gunzipSync(data, opts)
        : ((data[0] & 15) != 8 || (data[0] >> 4) > 7 || ((data[0] << 8 | data[1]) % 31))
            ? inflateSync(data, opts)
            : unzlibSync(data, opts);
}
exports.decompressSync = decompressSync;
// flatten a directory structure
var fltn = function (d, p, t, o) {
    for (var k in d) {
        var val = d[k], n = p + k, op = o;
        if (Array.isArray(val))
            op = mrg(o, val[1]), val = val[0];
        if (val instanceof u8)
            t[n] = [val, op];
        else {
            t[n += '/'] = [new u8(0), op];
            fltn(val, n, t, o);
        }
    }
};
// text encoder
var te = typeof TextEncoder != 'undefined' && /*#__PURE__*/ new TextEncoder();
// text decoder
var td = typeof TextDecoder != 'undefined' && /*#__PURE__*/ new TextDecoder();
// text decoder stream
var tds = 0;
try {
    td.decode(et, { stream: true });
    tds = 1;
}
catch (e) { }
// decode UTF8
var dutf8 = function (d) {
    for (var r = '', i = 0;;) {
        var c = d[i++];
        var eb = (c > 127) + (c > 223) + (c > 239);
        if (i + eb > d.length)
            return { s: r, r: slc(d, i - 1) };
        if (!eb)
            r += String.fromCharCode(c);
        else if (eb == 3) {
            c = ((c & 15) << 18 | (d[i++] & 63) << 12 | (d[i++] & 63) << 6 | (d[i++] & 63)) - 65536,
                r += String.fromCharCode(55296 | (c >> 10), 56320 | (c & 1023));
        }
        else if (eb & 1)
            r += String.fromCharCode((c & 31) << 6 | (d[i++] & 63));
        else
            r += String.fromCharCode((c & 15) << 12 | (d[i++] & 63) << 6 | (d[i++] & 63));
    }
};
/**
 * Streaming UTF-8 decoding
 */
var DecodeUTF8 = /*#__PURE__*/ (function () {
    /**
     * Creates a UTF-8 decoding stream
     * @param cb The callback to call whenever data is decoded
     */
    function DecodeUTF8(cb) {
        this.ondata = cb;
        if (tds)
            this.t = new TextDecoder();
        else
            this.p = et;
    }
    /**
     * Pushes a chunk to be decoded from UTF-8 binary
     * @param chunk The chunk to push
     * @param final Whether this is the last chunk
     */
    DecodeUTF8.prototype.push = function (chunk, final) {
        if (!this.ondata)
            err(5);
        final = !!final;
        if (this.t) {
            this.ondata(this.t.decode(chunk, { stream: true }), final);
            if (final) {
                if (this.t.decode().length)
                    err(8);
                this.t = null;
            }
            return;
        }
        if (!this.p)
            err(4);
        var dat = new u8(this.p.length + chunk.length);
        dat.set(this.p);
        dat.set(chunk, this.p.length);
        var _a = dutf8(dat), s = _a.s, r = _a.r;
        if (final) {
            if (r.length)
                err(8);
            this.p = null;
        }
        else
            this.p = r;
        this.ondata(s, final);
    };
    return DecodeUTF8;
}());
exports.DecodeUTF8 = DecodeUTF8;
/**
 * Streaming UTF-8 encoding
 */
var EncodeUTF8 = /*#__PURE__*/ (function () {
    /**
     * Creates a UTF-8 decoding stream
     * @param cb The callback to call whenever data is encoded
     */
    function EncodeUTF8(cb) {
        this.ondata = cb;
    }
    /**
     * Pushes a chunk to be encoded to UTF-8
     * @param chunk The string data to push
     * @param final Whether this is the last chunk
     */
    EncodeUTF8.prototype.push = function (chunk, final) {
        if (!this.ondata)
            err(5);
        if (this.d)
            err(4);
        this.ondata(strToU8(chunk), this.d = final || false);
    };
    return EncodeUTF8;
}());
exports.EncodeUTF8 = EncodeUTF8;
/**
 * Converts a string into a Uint8Array for use with compression/decompression methods
 * @param str The string to encode
 * @param latin1 Whether or not to interpret the data as Latin-1. This should
 *               not need to be true unless decoding a binary string.
 * @returns The string encoded in UTF-8/Latin-1 binary
 */
function strToU8(str, latin1) {
    if (latin1) {
        var ar_1 = new u8(str.length);
        for (var i = 0; i < str.length; ++i)
            ar_1[i] = str.charCodeAt(i);
        return ar_1;
    }
    if (te)
        return te.encode(str);
    var l = str.length;
    var ar = new u8(str.length + (str.length >> 1));
    var ai = 0;
    var w = function (v) { ar[ai++] = v; };
    for (var i = 0; i < l; ++i) {
        if (ai + 5 > ar.length) {
            var n = new u8(ai + 8 + ((l - i) << 1));
            n.set(ar);
            ar = n;
        }
        var c = str.charCodeAt(i);
        if (c < 128 || latin1)
            w(c);
        else if (c < 2048)
            w(192 | (c >> 6)), w(128 | (c & 63));
        else if (c > 55295 && c < 57344)
            c = 65536 + (c & 1023 << 10) | (str.charCodeAt(++i) & 1023),
                w(240 | (c >> 18)), w(128 | ((c >> 12) & 63)), w(128 | ((c >> 6) & 63)), w(128 | (c & 63));
        else
            w(224 | (c >> 12)), w(128 | ((c >> 6) & 63)), w(128 | (c & 63));
    }
    return slc(ar, 0, ai);
}
exports.strToU8 = strToU8;
/**
 * Converts a Uint8Array to a string
 * @param dat The data to decode to string
 * @param latin1 Whether or not to interpret the data as Latin-1. This should
 *               not need to be true unless encoding to binary string.
 * @returns The original UTF-8/Latin-1 string
 */
function strFromU8(dat, latin1) {
    if (latin1) {
        var r = '';
        for (var i = 0; i < dat.length; i += 16384)
            r += String.fromCharCode.apply(null, dat.subarray(i, i + 16384));
        return r;
    }
    else if (td) {
        return td.decode(dat);
    }
    else {
        var _a = dutf8(dat), s = _a.s, r = _a.r;
        if (r.length)
            err(8);
        return s;
    }
}
exports.strFromU8 = strFromU8;
;
// deflate bit flag
var dbf = function (l) { return l == 1 ? 3 : l < 6 ? 2 : l == 9 ? 1 : 0; };
// skip local zip header
var slzh = function (d, b) { return b + 30 + b2(d, b + 26) + b2(d, b + 28); };
// read zip header
var zh = function (d, b, z) {
    var fnl = b2(d, b + 28), fn = strFromU8(d.subarray(b + 46, b + 46 + fnl), !(b2(d, b + 8) & 2048)), es = b + 46 + fnl, bs = b4(d, b + 20);
    var _a = z && bs == 4294967295 ? z64e(d, es) : [bs, b4(d, b + 24), b4(d, b + 42)], sc = _a[0], su = _a[1], off = _a[2];
    return [b2(d, b + 10), sc, su, fn, es + b2(d, b + 30) + b2(d, b + 32), off];
};
// read zip64 extra field
var z64e = function (d, b) {
    for (; b2(d, b) != 1; b += 4 + b2(d, b + 2)) {}
    return [b8(d, b + 12), b8(d, b + 4), b8(d, b + 20)];
};
// extra field length
var exfl = function (ex) {
    var le = 0;
    if (ex) {
        for (var k in ex) {
            var l = ex[k].length;
            if (l > 65535)
                err(9);
            le += l + 4;
        }
    }
    return le;
};
// write zip header
var wzh = function (d, b, f, fn, u, c, ce, co) {
    var fl = fn.length, ex = f.extra, col = co && co.length;
    var exl = exfl(ex);
    wbytes(d, b, ce != null ? 0x2014B50 : 0x4034B50), b += 4;
    if (ce != null)
        d[b++] = 20, d[b++] = f.os;
    d[b] = 20, b += 2; // spec compliance? what's that?
    d[b++] = (f.flag << 1) | (c < 0 && 8), d[b++] = u && 8;
    d[b++] = f.compression & 255, d[b++] = f.compression >> 8;
    var dt = new Date(f.mtime == null ? Date.now() : f.mtime), y = dt.getFullYear() - 1980;
    if (y < 0 || y > 119)
        err(10);
    wbytes(d, b, (y << 25) | ((dt.getMonth() + 1) << 21) | (dt.getDate() << 16) | (dt.getHours() << 11) | (dt.getMinutes() << 5) | (dt.getSeconds() >> 1)), b += 4;
    if (c != -1) {
        wbytes(d, b, f.crc);
        wbytes(d, b + 4, c < 0 ? -c - 2 : c);
        wbytes(d, b + 8, f.size);
    }
    wbytes(d, b + 12, fl);
    wbytes(d, b + 14, exl), b += 16;
    if (ce != null) {
        wbytes(d, b, col);
        wbytes(d, b + 6, f.attrs);
        wbytes(d, b + 10, ce), b += 14;
    }
    d.set(fn, b);
    b += fl;
    if (exl) {
        for (var k in ex) {
            var exf = ex[k], l = exf.length;
            wbytes(d, b, +k);
            wbytes(d, b + 2, l);
            d.set(exf, b + 4), b += 4 + l;
        }
    }
    if (col)
        d.set(co, b), b += col;
    return b;
};
// write zip footer (end of central directory)
var wzf = function (o, b, c, d, e) {
    wbytes(o, b, 0x6054B50); // skip disk
    wbytes(o, b + 8, c);
    wbytes(o, b + 10, c);
    wbytes(o, b + 12, d);
    wbytes(o, b + 16, e);
};
/**
 * A pass-through stream to keep data uncompressed in a ZIP archive.
 */
var ZipPassThrough = /*#__PURE__*/ (function () {
    /**
     * Creates a pass-through stream that can be added to ZIP archives
     * @param filename The filename to associate with this data stream
     */
    function ZipPassThrough(filename) {
        this.filename = filename;
        this.c = crc();
        this.size = 0;
        this.compression = 0;
    }
    /**
     * Processes a chunk and pushes to the output stream. You can override this
     * method in a subclass for custom behavior, but by default this passes
     * the data through. You must call this.ondata(err, chunk, final) at some
     * point in this method.
     * @param chunk The chunk to process
     * @param final Whether this is the last chunk
     */
    ZipPassThrough.prototype.process = function (chunk, final) {
        this.ondata(null, chunk, final);
    };
    /**
     * Pushes a chunk to be added. If you are subclassing this with a custom
     * compression algorithm, note that you must push data from the source
     * file only, pre-compression.
     * @param chunk The chunk to push
     * @param final Whether this is the last chunk
     */
    ZipPassThrough.prototype.push = function (chunk, final) {
        if (!this.ondata)
            err(5);
        this.c.p(chunk);
        this.size += chunk.length;
        if (final)
            this.crc = this.c.d();
        this.process(chunk, final || false);
    };
    return ZipPassThrough;
}());
exports.ZipPassThrough = ZipPassThrough;
// I don't extend because TypeScript extension adds 1kB of runtime bloat
/**
 * Streaming DEFLATE compression for ZIP archives. Prefer using AsyncZipDeflate
 * for better performance
 */
var ZipDeflate = /*#__PURE__*/ (function () {
    /**
     * Creates a DEFLATE stream that can be added to ZIP archives
     * @param filename The filename to associate with this data stream
     * @param opts The compression options
     */
    function ZipDeflate(filename, opts) {
        var _this = this;
        if (!opts)
            opts = {};
        ZipPassThrough.call(this, filename);
        this.d = new Deflate(opts, function (dat, final) {
            _this.ondata(null, dat, final);
        });
        this.compression = 8;
        this.flag = dbf(opts.level);
    }
    ZipDeflate.prototype.process = function (chunk, final) {
        try {
            this.d.push(chunk, final);
        }
        catch (e) {
            this.ondata(e, null, final);
        }
    };
    /**
     * Pushes a chunk to be deflated
     * @param chunk The chunk to push
     * @param final Whether this is the last chunk
     */
    ZipDeflate.prototype.push = function (chunk, final) {
        ZipPassThrough.prototype.push.call(this, chunk, final);
    };
    return ZipDeflate;
}());
exports.ZipDeflate = ZipDeflate;
/**
 * Asynchronous streaming DEFLATE compression for ZIP archives
 */
var AsyncZipDeflate = /*#__PURE__*/ (function () {
    /**
     * Creates an asynchronous DEFLATE stream that can be added to ZIP archives
     * @param filename The filename to associate with this data stream
     * @param opts The compression options
     */
    function AsyncZipDeflate(filename, opts) {
        var _this = this;
        if (!opts)
            opts = {};
        ZipPassThrough.call(this, filename);
        this.d = new AsyncDeflate(opts, function (err, dat, final) {
            _this.ondata(err, dat, final);
        });
        this.compression = 8;
        this.flag = dbf(opts.level);
        this.terminate = this.d.terminate;
    }
    AsyncZipDeflate.prototype.process = function (chunk, final) {
        this.d.push(chunk, final);
    };
    /**
     * Pushes a chunk to be deflated
     * @param chunk The chunk to push
     * @param final Whether this is the last chunk
     */
    AsyncZipDeflate.prototype.push = function (chunk, final) {
        ZipPassThrough.prototype.push.call(this, chunk, final);
    };
    return AsyncZipDeflate;
}());
exports.AsyncZipDeflate = AsyncZipDeflate;
// TODO: Better tree shaking
/**
 * A zippable archive to which files can incrementally be added
 */
var Zip = /*#__PURE__*/ (function () {
    /**
     * Creates an empty ZIP archive to which files can be added
     * @param cb The callback to call whenever data for the generated ZIP archive
     *           is available
     */
    function Zip(cb) {
        this.ondata = cb;
        this.u = [];
        this.d = 1;
    }
    /**
     * Adds a file to the ZIP archive
     * @param file The file stream to add
     */
    Zip.prototype.add = function (file) {
        var _this = this;
        if (!this.ondata)
            err(5);
        // finishing or finished
        if (this.d & 2)
            this.ondata(err(4 + (this.d & 1) * 8, 0, 1), null, false);
        else {
            var f = strToU8(file.filename), fl_1 = f.length;
            var com = file.comment, o = com && strToU8(com);
            var u = fl_1 != file.filename.length || (o && (com.length != o.length));
            var hl_1 = fl_1 + exfl(file.extra) + 30;
            if (fl_1 > 65535)
                this.ondata(err(11, 0, 1), null, false);
            var header = new u8(hl_1);
            wzh(header, 0, file, f, u, -1);
            var chks_1 = [header];
            var pAll_1 = function () {
                for (var _i = 0, chks_2 = chks_1; _i < chks_2.length; _i++) {
                    var chk = chks_2[_i];
                    _this.ondata(null, chk, false);
                }
                chks_1 = [];
            };
            var tr_1 = this.d;
            this.d = 0;
            var ind_1 = this.u.length;
            var uf_1 = mrg(file, {
                f: f,
                u: u,
                o: o,
                t: function () {
                    if (file.terminate)
                        file.terminate();
                },
                r: function () {
                    pAll_1();
                    if (tr_1) {
                        var nxt = _this.u[ind_1 + 1];
                        if (nxt)
                            nxt.r();
                        else
                            _this.d = 1;
                    }
                    tr_1 = 1;
                }
            });
            var cl_1 = 0;
            file.ondata = function (err, dat, final) {
                if (err) {
                    _this.ondata(err, dat, final);
                    _this.terminate();
                }
                else {
                    cl_1 += dat.length;
                    chks_1.push(dat);
                    if (final) {
                        var dd = new u8(16);
                        wbytes(dd, 0, 0x8074B50);
                        wbytes(dd, 4, file.crc);
                        wbytes(dd, 8, cl_1);
                        wbytes(dd, 12, file.size);
                        chks_1.push(dd);
                        uf_1.c = cl_1, uf_1.b = hl_1 + cl_1 + 16, uf_1.crc = file.crc, uf_1.size = file.size;
                        if (tr_1)
                            uf_1.r();
                        tr_1 = 1;
                    }
                    else if (tr_1)
                        pAll_1();
                }
            };
            this.u.push(uf_1);
        }
    };
    /**
     * Ends the process of adding files and prepares to emit the final chunks.
     * This *must* be called after adding all desired files for the resulting
     * ZIP file to work properly.
     */
    Zip.prototype.end = function () {
        var _this = this;
        if (this.d & 2) {
            this.ondata(err(4 + (this.d & 1) * 8, 0, 1), null, true);
            return;
        }
        if (this.d)
            this.e();
        else
            this.u.push({
                r: function () {
                    if (!(_this.d & 1))
                        return;
                    _this.u.splice(-1, 1);
                    _this.e();
                },
                t: function () { }
            });
        this.d = 3;
    };
    Zip.prototype.e = function () {
        var bt = 0, l = 0, tl = 0;
        for (var _i = 0, _a = this.u; _i < _a.length; _i++) {
            var f = _a[_i];
            tl += 46 + f.f.length + exfl(f.extra) + (f.o ? f.o.length : 0);
        }
        var out = new u8(tl + 22);
        for (var _b = 0, _c = this.u; _b < _c.length; _b++) {
            var f = _c[_b];
            wzh(out, bt, f, f.f, f.u, -f.c - 2, l, f.o);
            bt += 46 + f.f.length + exfl(f.extra) + (f.o ? f.o.length : 0), l += f.b;
        }
        wzf(out, bt, this.u.length, tl, l);
        this.ondata(null, out, true);
        this.d = 2;
    };
    /**
     * A method to terminate any internal workers used by the stream. Subsequent
     * calls to add() will fail.
     */
    Zip.prototype.terminate = function () {
        for (var _i = 0, _a = this.u; _i < _a.length; _i++) {
            var f = _a[_i];
            f.t();
        }
        this.d = 2;
    };
    return Zip;
}());
exports.Zip = Zip;
function zip(data, opts, cb) {
    if (!cb)
        cb = opts, opts = {};
    if (typeof cb != 'function')
        err(7);
    var r = {};
    fltn(data, '', r, opts);
    var k = Object.keys(r);
    var lft = k.length, o = 0, tot = 0;
    var slft = lft, files = new Array(lft);
    var term = [];
    var tAll = function () {
        for (var i = 0; i < term.length; ++i)
            term[i]();
    };
    var cbd = function (a, b) {
        mt(function () { cb(a, b); });
    };
    mt(function () { cbd = cb; });
    var cbf = function () {
        var out = new u8(tot + 22), oe = o, cdl = tot - o;
        tot = 0;
        for (var i = 0; i < slft; ++i) {
            var f = files[i];
            try {
                var l = f.c.length;
                wzh(out, tot, f, f.f, f.u, l);
                var badd = 30 + f.f.length + exfl(f.extra);
                var loc = tot + badd;
                out.set(f.c, loc);
                wzh(out, o, f, f.f, f.u, l, tot, f.m), o += 16 + badd + (f.m ? f.m.length : 0), tot = loc + l;
            }
            catch (e) {
                return cbd(e, null);
            }
        }
        wzf(out, o, files.length, cdl, oe);
        cbd(null, out);
    };
    if (!lft)
        cbf();
    var _loop_1 = function (i) {
        var fn = k[i];
        var _a = r[fn], file = _a[0], p = _a[1];
        var c = crc(), size = file.length;
        c.p(file);
        var f = strToU8(fn), s = f.length;
        var com = p.comment, m = com && strToU8(com), ms = m && m.length;
        var exl = exfl(p.extra);
        var compression = p.level == 0 ? 0 : 8;
        var cbl = function (e, d) {
            if (e) {
                tAll();
                cbd(e, null);
            }
            else {
                var l = d.length;
                files[i] = mrg(p, {
                    size: size,
                    crc: c.d(),
                    c: d,
                    f: f,
                    m: m,
                    u: s != fn.length || (m && (com.length != ms)),
                    compression: compression
                });
                o += 30 + s + exl + l;
                tot += 76 + 2 * (s + exl) + (ms || 0) + l;
                if (!--lft)
                    cbf();
            }
        };
        if (s > 65535)
            cbl(err(11, 0, 1), null);
        if (!compression)
            cbl(null, file);
        else if (size < 160000) {
            try {
                cbl(null, deflateSync(file, p));
            }
            catch (e) {
                cbl(e, null);
            }
        }
        else
            term.push(deflate(file, p, cbl));
    };
    // Cannot use lft because it can decrease
    for (var i = 0; i < slft; ++i) {
        _loop_1(i);
    }
    return tAll;
}
exports.zip = zip;
/**
 * Synchronously creates a ZIP file. Prefer using `zip` for better performance
 * with more than one file.
 * @param data The directory structure for the ZIP archive
 * @param opts The main options, merged with per-file options
 * @returns The generated ZIP archive
 */
function zipSync(data, opts) {
    if (!opts)
        opts = {};
    var r = {};
    var files = [];
    fltn(data, '', r, opts);
    var o = 0;
    var tot = 0;
    for (var fn in r) {
        var _a = r[fn], file = _a[0], p = _a[1];
        var compression = p.level == 0 ? 0 : 8;
        var f = strToU8(fn), s = f.length;
        var com = p.comment, m = com && strToU8(com), ms = m && m.length;
        var exl = exfl(p.extra);
        if (s > 65535)
            err(11);
        var d = compression ? deflateSync(file, p) : file, l = d.length;
        var c = crc();
        c.p(file);
        files.push(mrg(p, {
            size: file.length,
            crc: c.d(),
            c: d,
            f: f,
            m: m,
            u: s != fn.length || (m && (com.length != ms)),
            o: o,
            compression: compression
        }));
        o += 30 + s + exl + l;
        tot += 76 + 2 * (s + exl) + (ms || 0) + l;
    }
    var out = new u8(tot + 22), oe = o, cdl = tot - o;
    for (var i = 0; i < files.length; ++i) {
        var f = files[i];
        wzh(out, f.o, f, f.f, f.u, f.c.length);
        var badd = 30 + f.f.length + exfl(f.extra);
        out.set(f.c, f.o + badd);
        wzh(out, o, f, f.f, f.u, f.c.length, f.o, f.m), o += 16 + badd + (f.m ? f.m.length : 0);
    }
    wzf(out, o, files.length, cdl, oe);
    return out;
}
exports.zipSync = zipSync;
/**
 * Streaming pass-through decompression for ZIP archives
 */
var UnzipPassThrough = /*#__PURE__*/ (function () {
    function UnzipPassThrough() {
    }
    UnzipPassThrough.prototype.push = function (data, final) {
        this.ondata(null, data, final);
    };
    UnzipPassThrough.compression = 0;
    return UnzipPassThrough;
}());
exports.UnzipPassThrough = UnzipPassThrough;
/**
 * Streaming DEFLATE decompression for ZIP archives. Prefer AsyncZipInflate for
 * better performance.
 */
var UnzipInflate = /*#__PURE__*/ (function () {
    /**
     * Creates a DEFLATE decompression that can be used in ZIP archives
     */
    function UnzipInflate() {
        var _this = this;
        this.i = new Inflate(function (dat, final) {
            _this.ondata(null, dat, final);
        });
    }
    UnzipInflate.prototype.push = function (data, final) {
        try {
            this.i.push(data, final);
        }
        catch (e) {
            this.ondata(e, null, final);
        }
    };
    UnzipInflate.compression = 8;
    return UnzipInflate;
}());
exports.UnzipInflate = UnzipInflate;
/**
 * Asynchronous streaming DEFLATE decompression for ZIP archives
 */
var AsyncUnzipInflate = /*#__PURE__*/ (function () {
    /**
     * Creates a DEFLATE decompression that can be used in ZIP archives
     */
    function AsyncUnzipInflate(_, sz) {
        var _this = this;
        if (sz < 320000) {
            this.i = new Inflate(function (dat, final) {
                _this.ondata(null, dat, final);
            });
        }
        else {
            this.i = new AsyncInflate(function (err, dat, final) {
                _this.ondata(err, dat, final);
            });
            this.terminate = this.i.terminate;
        }
    }
    AsyncUnzipInflate.prototype.push = function (data, final) {
        if (this.i.terminate)
            data = slc(data, 0);
        this.i.push(data, final);
    };
    AsyncUnzipInflate.compression = 8;
    return AsyncUnzipInflate;
}());
exports.AsyncUnzipInflate = AsyncUnzipInflate;
/**
 * A ZIP archive decompression stream that emits files as they are discovered
 */
var Unzip = /*#__PURE__*/ (function () {
    /**
     * Creates a ZIP decompression stream
     * @param cb The callback to call whenever a file in the ZIP archive is found
     */
    function Unzip(cb) {
        this.onfile = cb;
        this.k = [];
        this.o = {
            0: UnzipPassThrough
        };
        this.p = et;
    }
    /**
     * Pushes a chunk to be unzipped
     * @param chunk The chunk to push
     * @param final Whether this is the last chunk
     */
    Unzip.prototype.push = function (chunk, final) {
        var _this = this;
        if (!this.onfile)
            err(5);
        if (!this.p)
            err(4);
        if (this.c > 0) {
            var len = Math.min(this.c, chunk.length);
            var toAdd = chunk.subarray(0, len);
            this.c -= len;
            if (this.d)
                this.d.push(toAdd, !this.c);
            else
                this.k[0].push(toAdd);
            chunk = chunk.subarray(len);
            if (chunk.length)
                return this.push(chunk, final);
        }
        else {
            var f = 0, i = 0, is = void 0, buf = void 0;
            if (!this.p.length)
                buf = chunk;
            else if (!chunk.length)
                buf = this.p;
            else {
                buf = new u8(this.p.length + chunk.length);
                buf.set(this.p), buf.set(chunk, this.p.length);
            }
            var l = buf.length, oc = this.c, add = oc && this.d;
            var _loop_2 = function () {
                var _a;
                var sig = b4(buf, i);
                if (sig == 0x4034B50) {
                    f = 1, is = i;
                    this_1.d = null;
                    this_1.c = 0;
                    var bf = b2(buf, i + 6), cmp_1 = b2(buf, i + 8), u = bf & 2048, dd = bf & 8, fnl = b2(buf, i + 26), es = b2(buf, i + 28);
                    if (l > i + 30 + fnl + es) {
                        var chks_3 = [];
                        this_1.k.unshift(chks_3);
                        f = 2;
                        var sc_1 = b4(buf, i + 18), su_1 = b4(buf, i + 22);
                        var fn_1 = strFromU8(buf.subarray(i + 30, i += 30 + fnl), !u);
                        if (sc_1 == 4294967295) {
                            _a = dd ? [-2] : z64e(buf, i), sc_1 = _a[0], su_1 = _a[1];
                        }
                        else if (dd)
                            sc_1 = -1;
                        i += es;
                        this_1.c = sc_1;
                        var d_1;
                        var file_1 = {
                            name: fn_1,
                            compression: cmp_1,
                            start: function () {
                                if (!file_1.ondata)
                                    err(5);
                                if (!sc_1)
                                    file_1.ondata(null, et, true);
                                else {
                                    var ctr = _this.o[cmp_1];
                                    if (!ctr)
                                        file_1.ondata(err(14, 'unknown compression type ' + cmp_1, 1), null, false);
                                    d_1 = sc_1 < 0 ? new ctr(fn_1) : new ctr(fn_1, sc_1, su_1);
                                    d_1.ondata = function (err, dat, final) { file_1.ondata(err, dat, final); };
                                    for (var _i = 0, chks_4 = chks_3; _i < chks_4.length; _i++) {
                                        var dat = chks_4[_i];
                                        d_1.push(dat, false);
                                    }
                                    if (_this.k[0] == chks_3 && _this.c)
                                        _this.d = d_1;
                                    else
                                        d_1.push(et, true);
                                }
                            },
                            terminate: function () {
                                if (d_1 && d_1.terminate)
                                    d_1.terminate();
                            }
                        };
                        if (sc_1 >= 0)
                            file_1.size = sc_1, file_1.originalSize = su_1;
                        this_1.onfile(file_1);
                    }
                    return "break";
                }
                else if (oc) {
                    if (sig == 0x8074B50) {
                        is = i += 12 + (oc == -2 && 8), f = 3, this_1.c = 0;
                        return "break";
                    }
                    else if (sig == 0x2014B50) {
                        is = i -= 4, f = 3, this_1.c = 0;
                        return "break";
                    }
                }
            };
            var this_1 = this;
            for (; i < l - 4; ++i) {
                var state_1 = _loop_2();
                if (state_1 === "break")
                    break;
            }
            this.p = et;
            if (oc < 0) {
                var dat = f ? buf.subarray(0, is - 12 - (oc == -2 && 8) - (b4(buf, is - 16) == 0x8074B50 && 4)) : buf.subarray(0, i);
                if (add)
                    add.push(dat, !!f);
                else
                    this.k[+(f == 2)].push(dat);
            }
            if (f & 2)
                return this.push(buf.subarray(i), final);
            this.p = buf.subarray(i);
        }
        if (final) {
            if (this.c)
                err(13);
            this.p = null;
        }
    };
    /**
     * Registers a decoder with the stream, allowing for files compressed with
     * the compression type provided to be expanded correctly
     * @param decoder The decoder constructor
     */
    Unzip.prototype.register = function (decoder) {
        this.o[decoder.compression] = decoder;
    };
    return Unzip;
}());
exports.Unzip = Unzip;
var mt = typeof queueMicrotask == 'function' ? queueMicrotask : typeof setTimeout == 'function' ? setTimeout : function (fn) { fn(); };
function unzip(data, opts, cb) {
    if (!cb)
        cb = opts, opts = {};
    if (typeof cb != 'function')
        err(7);
    var term = [];
    var tAll = function () {
        for (var i = 0; i < term.length; ++i)
            term[i]();
    };
    var files = {};
    var cbd = function (a, b) {
        mt(function () { cb(a, b); });
    };
    mt(function () { cbd = cb; });
    var e = data.length - 22;
    for (; b4(data, e) != 0x6054B50; --e) {
        if (!e || data.length - e > 65558) {
            cbd(err(13, 0, 1), null);
            return tAll;
        }
    }
    ;
    var lft = b2(data, e + 8);
    if (lft) {
        var c = lft;
        var o = b4(data, e + 16);
        var z = o == 4294967295 || c == 65535;
        if (z) {
            var ze = b4(data, e - 12);
            z = b4(data, ze) == 0x6064B50;
            if (z) {
                c = lft = b4(data, ze + 32);
                o = b4(data, ze + 48);
            }
        }
        var fltr = opts && opts.filter;
        var _loop_3 = function (i) {
            var _a = zh(data, o, z), c_1 = _a[0], sc = _a[1], su = _a[2], fn = _a[3], no = _a[4], off = _a[5], b = slzh(data, off);
            o = no;
            var cbl = function (e, d) {
                if (e) {
                    tAll();
                    cbd(e, null);
                }
                else {
                    if (d)
                        files[fn] = d;
                    if (!--lft)
                        cbd(null, files);
                }
            };
            if (!fltr || fltr({
                name: fn,
                size: sc,
                originalSize: su,
                compression: c_1
            })) {
                if (!c_1)
                    cbl(null, slc(data, b, b + sc));
                else if (c_1 == 8) {
                    var infl = data.subarray(b, b + sc);
                    // Synchronously decompress under 512KB, or barely-compressed data
                    if (su < 524288 || sc > 0.8 * su) {
                        try {
                            cbl(null, inflateSync(infl, { out: new u8(su) }));
                        }
                        catch (e) {
                            cbl(e, null);
                        }
                    }
                    else
                        term.push(inflate(infl, { size: su }, cbl));
                }
                else
                    cbl(err(14, 'unknown compression type ' + c_1, 1), null);
            }
            else
                cbl(null, null);
        };
        for (var i = 0; i < c; ++i) {
            _loop_3(i);
        }
    }
    else
        cbd(null, {});
    return tAll;
}
exports.unzip = unzip;
/**
 * Synchronously decompresses a ZIP archive. Prefer using `unzip` for better
 * performance with more than one file.
 * @param data The raw compressed ZIP file
 * @param opts The ZIP extraction options
 * @returns The decompressed files
 */
function unzipSync(data, opts) {
    var files = {};
    var e = data.length - 22;
    for (; b4(data, e) != 0x6054B50; --e) {
        if (!e || data.length - e > 65558)
            err(13);
    }
    ;
    var c = b2(data, e + 8);
    if (!c)
        return {};
    var o = b4(data, e + 16);
    var z = o == 4294967295 || c == 65535;
    if (z) {
        var ze = b4(data, e - 12);
        z = b4(data, ze) == 0x6064B50;
        if (z) {
            c = b4(data, ze + 32);
            o = b4(data, ze + 48);
        }
    }
    var fltr = opts && opts.filter;
    for (var i = 0; i < c; ++i) {
        var _a = zh(data, o, z), c_2 = _a[0], sc = _a[1], su = _a[2], fn = _a[3], no = _a[4], off = _a[5], b = slzh(data, off);
        o = no;
        if (!fltr || fltr({
            name: fn,
            size: sc,
            originalSize: su,
            compression: c_2
        })) {
            if (!c_2)
                files[fn] = slc(data, b, b + sc);
            else if (c_2 == 8)
                files[fn] = inflateSync(data.subarray(b, b + sc), { out: new u8(su) });
            else
                err(14, 'unknown compression type ' + c_2);
        }
    }
    return files;
}
exports.unzipSync = unzipSync;

},{"./node-worker.cjs":3}],3:[function(require,module,exports){
"use strict";
var ch2 = {};
exports.default = (function (c, id, msg, transfer, cb) {
    var w = new Worker(ch2[id] || (ch2[id] = URL.createObjectURL(new Blob([
        c + ';addEventListener("error",function(e){e=e.error;postMessage({$e$:[e.message,e.code,e.stack]})})'
    ], { type: 'text/javascript' }))));
    w.onmessage = function (e) {
        var d = e.data, ed = d.$e$;
        if (ed) {
            var err = new Error(ed[0]);
            err['code'] = ed[1];
            err.stack = ed[2];
            cb(err, null);
        }
        else
            cb(null, d);
    };
    w.postMessage(msg, transfer);
    return w;
});

},{}]},{},[1]);








;(function(Namespace, undefined) {
    "use strict";
    var vec2 = glMatrix.vec2;


/**
 * @category 3D
 * @classdesc
 * This class implements a control for interactively adjusting an opacity curve.
 * 
 * @constructor
 * @param {Number} width - The width of the control.
 * @param {Number} height - The height of the control.
 * 
 */
Namespace.OpacityControl = function(width, height, presets) 
{     
    this.graphAreaColor = '#a0a0a0';
    this.toolsAreaColor = '#c0c0c0';  
    this.presets = presets;

    // Lay out the UI
    this._buildUi(width, height, presets);
    
    // Set initial state
    this.opacityCurve = presets ? Namespace.OpacityCurve.FromString(presets[0].opacityCurveStr) : new Namespace.OpacityCurve();        
    this.activePtIndex = 0;  
    this.colorPicker.value = Namespace.Color.ToHexString( this.opacityCurve.curvePts[this.activePtIndex] );
    this._drawGraph();

    // Attach for direct-interaction events
    this.graphInteractor = new Namespace.Interactor(this.canvas, 'opgraph', {btns:0, shift:undefined, ctrl:undefined, alt:false, meta:false});
    this.graphInteractor.addEventListener('start move end', this._onGraphInteract.bind(this));
    this.canvas.addEventListener( (Namespace.Utils.isTouchDevice() ? 'touchend' : 'mouseup'), this._onGraphClick.bind(this) ); 
};


/**
 * Builds the user interface.
 * @private
 * 
 * @param {Number} width - The width of the control.
 * @param {Number} height - The height of the control.
 * 
 */
Namespace.OpacityControl.prototype._buildUi = function(width, height, presets) 
{ 
    // Main div
    var Ui = Namespace.Ui;
    this.mainDiv = Ui.CreateElement('div', 'opcontrol_maindiv', null, {width:width, height:height});

    // Graph div
    var toolsDivHeight = 50;
    var graphDivHeight = height - toolsDivHeight;
    this.graphDiv = Ui.CreateElement('div', 'opcontrol_graphdiv', this.mainDiv, {width:width, height:graphDivHeight});

    // Tools div    
    this.toolsDiv = Ui.CreateElement('div', 'opcontrol_toolsdiv', this.mainDiv, {width:width-2, height:toolsDivHeight, 
        bottom:0, border:'1px solid #909090'} );
  
    // Graph canvas
    this.canvas = Ui.CreateElement('canvas', 'opcontrol_canvas', this.graphDiv, {width:width, height:graphDivHeight}, 
        {width:width, height:graphDivHeight, borderWidth:6});
    this.canvas.addEventListener('contextmenu', function(e) {e.preventDefault();} ); // Disable right-click context menu

    // Color selector
    this.colorPicker = Ui.CreateElement('input', 'opcontrol_colorpicker', this.toolsDiv, {width:75, height:30, left:20, top:10}, 
        {type:'color', value:'#ffffff'});
    this.colorPicker.addEventListener( 'change', this._onColorSelected.bind(this) ); 
    Ui.CreateElement('label', 'opcontrol_colorpicker_label', this.toolsDiv, {left:110, top:16}, {innerHTML:'Point color'});

    // Preset selector
    if (presets) {
        this.presetSelector = Ui.CreateElement('select', 'opcontrol_presetselector', this.toolsDiv, 
            {width:140, height:30, right:80, top:10, fontSize:16}, {val:'0'});
        for (var i=0; i<presets.length; i++) {
            Ui.CreateElement('option', 'opcontrol_presetoption', this.presetSelector, {}, 
            {value:i.toString(), text:presets[i].name});
        }
        this.presetSelector.addEventListener('change', function(){ this.trigger('preset-selected', {val:this.presetSelector.selectedIndex}); }.bind(this));
        Ui.CreateElement('label', 'opcontrol_presetselector_label', this.toolsDiv, {right:20, top:16}, {innerHTML:'Preset'});
    }

};


/**
 * Sets a new opacity curve.
 * 
 * @param {OpacityCurve} newOpCurve - The new curve.
 * @param {Boolena} [omitNotify=false] - Whether to skip firing the change event.
 * 
 */
Namespace.OpacityControl.prototype.setOpacityCurve = function(newOpCurve, omitNotify) 
{ 
    this.opacityCurve.setControlPoints( newOpCurve.controlPts );
    this._drawGraph();
    if (this.presets) { this._updatePresetSelector(); }
    
    // Notify
    if (!omitNotify) { this.trigger( 'opacity-change', {opCurve:this.opacityCurve} ); }   
};


/**
 * Sets the presets that will be displayed in the drop down selector.
 * 
 * @param {Array} presets - The presets to use.
 * 
 */
Namespace.OpacityControl.prototype.setPresets = function(presets) 
{
    while (this.presetSelector.options.length > 0) {                
        this.presetSelector.remove(0);
    } 
    
    presets.forEach( function(preset, i) {
        Namespace.Ui.CreateElement('option', '3dcon_presetoption', this.presetSelector, {}, {value:i.toString(), text:preset.name});
    }.bind(this) );
}


/**
 * Makes sure that the preset-selector matches the current curve.
 * @private
 *  
 */
Namespace.OpacityControl.prototype._updatePresetSelector = function() 
{ 
    if (!this.presets) { return; }
    
    // Check if the current params match any of the presets
    var opCurveStr = this.opacityCurve.toString();
    var presetIndex = -1;
    for (var i=0; i<this.presets.length; i++) {
        if (this.presets[i].opacityCurveStr == opCurveStr) {
            presetIndex = i;
            break;
        }
    }
    if (this.presetSelector.selectedIndex != presetIndex) {
        this.presetSelector.selectedIndex = presetIndex;
    }
};



/**
 * Handler for color-selected events.
 * @private
 * 
 */
Namespace.OpacityControl.prototype._onColorSelected = function() 
{ 
    if  ( this.activePtIndex !== null ) {
        var cpColor = this.opacityCurve.curvePts[this.activePtIndex];
        if (cpColor) {
            var newColor = Namespace.Color.FromHexString(this.colorPicker.value);
            cpColor.r = newColor.r;
            cpColor.g = newColor.g;
            cpColor.b = newColor.b;
            this.opacityCurve._updateControlPointsFromCurvePoints();
        }
        this._drawGraph();
        this.trigger( 'opacity-change', {opCurve:this.opacityCurve} );  
    }
};


/**
 * Handler for direct interaction with the graph.
 * @private
 * 
 * @param {Event} event - event info.
 * 
 */
Namespace.OpacityControl.prototype._onGraphInteract = function(event)
{
    if (event.type == 'start')
    {
        if ( !Namespace.Utils.isTouchDevice() && (event.detail.origEvent.button !== 0) ) { return; }
    
        // Check whether a control point has been selected
        var hitPtIndex = this._hitTest( this.graphInteractor.currPoint );
        if (hitPtIndex === null) { return; }
        this.activePtIndex = hitPtIndex;
        this.draggingCurve = true;

        this.colorPicker.value = Namespace.Color.ToHexString( this.opacityCurve.curvePts[this.activePtIndex] );
        this.alphaStart = this.opacityCurve.curvePts[this.activePtIndex].a;
        this.indxStart = this.activePtIndex;

        // Make note of the bracketing points
        this.leftPtIndex = this.activePtIndex;
        while (this.leftPtIndex > 0 && !this.opacityCurve.curvePts[this.leftPtIndex-1]) {
            this.leftPtIndex--;
        }
        this.rightPtIndex = this.activePtIndex;
        while (this.rightPtIndex < this.opacityCurve.numPoints()-1 && !this.opacityCurve.curvePts[this.rightPtIndex+1]) {
            this.rightPtIndex++;
        }

        this._drawGraph();
        this.trigger('opacity-change-start');
    }

    else if (event.type == 'move')
    {
        if (!this.draggingCurve) { return; }

        var deltaPos = vec2.create();
        if (!event.detail.origEvent.ctrlKey) // Move a single curve point
        {
            // Calculate the change in mouse/touch position
            vec2.subtract(deltaPos, this._windowPointToCurvePoint(this.graphInteractor.currPoint), 
                this._windowPointToCurvePoint(this.graphInteractor.startPoint) );
        
            // Allow fine control of the curve when the shift key is pressed
            if (event.detail.origEvent.shiftKey) { 
                vec2.scale(deltaPos, deltaPos, 0.2);
            }
        
            // Compute the new alpha value
            var cp = this.opacityCurve.curvePts;
            var newAlpha = Math.round( this.alphaStart + deltaPos[1] );
            cp[this.activePtIndex].a = Math.max(0,Math.min(255,newAlpha));
            
            // Compute the new curve-point position
            if ( (this.activePtIndex !== 0) && (this.activePtIndex !== this.opacityCurve.numPoints()-1 ) ) {
                var newPtIndex = Math.max(this.leftPtIndex, Math.min(this.rightPtIndex, Math.round(this.indxStart + deltaPos[0])) );
                if (newPtIndex != this.activePtIndex) {
                    cp[newPtIndex] = cp[this.activePtIndex];
                    cp[this.activePtIndex] = null;
                    this.activePtIndex = newPtIndex;
                }
            }
        }
        else // Move the entire curve left or right
        {
            // Calculate the change in mouse/touch position
            vec2.subtract(deltaPos, this._windowPointToCurvePoint(this.graphInteractor.currPoint), 
                this._windowPointToCurvePoint(this.graphInteractor.prevPoint) );
    
            // Allow fine control of the curve when the shift key is pressed
            if (event.detail.origEvent.shiftKey) { 
                vec2.scale(deltaPos, deltaPos, 0.2);
            }
    
            var cps = this.opacityCurve.controlPts;
            var numCps = cps.length/2;
            if (numCps > 3)
            {
                var deltaIndx = Math.round(deltaPos[0]);
                if (deltaIndx > 0) {
                    deltaIndx = Math.min(deltaIndx, Math.max(0, Namespace.OpacityCurve.NumPoints-1-cps[2*numCps-4]-10));
                }
                else {
                    deltaIndx = Math.max(deltaIndx, Math.min(0, -(cps[2] - 10)));
                }
                if (deltaIndx != 0) {
                    for (let i=2; i<2*numCps-2; i+=2) { cps[i] += deltaIndx; }
                    this.opacityCurve.setControlPoints(cps);
                }
            }
        }

        this.opacityCurve._updateControlPointsFromCurvePoints();
        this._drawGraph();
        this.trigger( 'opacity-change', {opCurve:this.opacityCurve} );  
    }

    else if (event.type == 'end')
    {
        if (this.draggingCurve) {
            this.trigger('opacity-change-end');
            this.draggingCurve = false;
        }
    }    
};
	

/**
 * Handler for click events on the graph area: adds or removes a curve point.
 * @private
 * 
 * @param {Event} event - event info.
 * 
 */
Namespace.OpacityControl.prototype._onGraphClick = function(event) 
{ 
    var isTouchDevice = Namespace.Utils.isTouchDevice();
    if ( !isTouchDevice && (event.button !== 2) ) { return; } // Must be a right click
    if ( isTouchDevice && (!event.originalEvent || !event.originalEvent.targetTouches || !event.originalEvent.targetTouches.length) ) { 
        return; // Must be multi-touch
    } 
    event.preventDefault();

	// Get the event coordinates
    var loc = Namespace.Interactor._getEventCoordinates(event);
    var rect = this.canvas.getBoundingClientRect();
    loc = [loc[0] - rect.left, loc[1] - rect.top];

    // If a point was clicked, then remove it
    var cp = this.opacityCurve.curvePts;
    var N = this.opacityCurve.numPoints();
    var curveModified = false;    
    var clickedPtIndex = this._hitTest(loc);
    if ( clickedPtIndex && (clickedPtIndex != N-1) ) {
        cp[clickedPtIndex] = null;   
        this.activePtIndex = 0;
        this.colorPicker.value = Namespace.Color.ToHexString( cp[0] );
        curveModified = true;                   
    }
    else {  // Add a point
        var clickedPt = this._windowPointToCurvePoint(loc);   
        if (!cp[clickedPt[0]]) { 
            var leftCp = 0;
            for (var i=clickedPt[0]-1; i>=0; i--) {
                if ( cp[i] ) { 
                    leftCp = cp[i]; 
                    break;
                }
            }
            var newPtColor = new Namespace.Color(leftCp.r, leftCp.g, leftCp.b, clickedPt[1]);
            cp[ clickedPt[0] ] = newPtColor;
            this.activePtIndex = clickedPt[0];
            this.colorPicker.value = Namespace.Color.ToHexString(newPtColor);
            curveModified = true; 
        }
    }

    if (curveModified) {
        this.opacityCurve._updateControlPointsFromCurvePoints();
        this._drawGraph();
        this.trigger( 'opacity-change', {opCurve:this.opacityCurve} );  
    }
};


/**
 * Performs hit testing.
 * @private
 * 
 * @param {vec2} windowPt - The point to test.
 * 
 */
Namespace.OpacityControl.prototype._hitTest = function(windowPt)
{
    var clickedPt = this._windowPointToCurvePoint(windowPt);
    var tol = 10;

    var cp = this.opacityCurve.curvePts;
    var N = cp.length;
    var aspectRatio = (256.0/N) * (this.canvas.width/this.canvas.height);
    var minDist = Number.MAX_SAFE_INTEGER;
    var bestPtIndex = -1;
    for (var i=0; i<N; i++) {
        if ( cp[i] ) {
            var dx = (i - clickedPt[0])*aspectRatio;
            var dy = cp[i].a - clickedPt[1];
            var dist = dx*dx + dy*dy;
            if (dist < minDist) {
                minDist = dist;
                bestPtIndex = i;
            }
        }
    }
    return (Math.sqrt(minDist) < tol) ? bestPtIndex : null;
};


/**
 * Converts a window coordinate to a curve point.
 * @private
 * 
 * @param {vec2} windowPt - The point to convert.
 * 
 */
Namespace.OpacityControl.prototype._windowPointToCurvePoint = function(windowPt)
{
    var bw = this.canvas.borderWidth;
    var graphWidth = this.canvas.width - 2*bw;
    var graphHeight = this.canvas.height - 2*bw;
    
    var Nm1 = this.opacityCurve.numPoints() - 1;
    var n = Math.round( (windowPt[0]-bw)*Nm1/graphWidth );
    n = Math.max(0, Math.min(Nm1, n));
    var alpha = Math.round( 255*(this.canvas.height-1-windowPt[1]-bw)/graphHeight );
    alpha = Math.max(0, Math.min(255, alpha));

    return [n, alpha];
};

 
/**
 * Draws the opacity curve graph.
 * @private
 * 
 */
Namespace.OpacityControl.prototype._drawGraph = function() 
{ 
    var ctx = this.canvas.getContext("2d");
    var w = this.canvas.width;
    var h = this.canvas.height;
    var bw = this.canvas.borderWidth;
    var insideWidth = w - 2*bw;
    var insideHeight = h - 2*bw;

    // Clear the canvas
    ctx.clearRect(0,0,w,h);
    ctx.beginPath();

    // Draw the background
    ctx.fillStyle = this.graphAreaColor;
    ctx.fillRect(0,0,w,h);

    // Draw the border
    ctx.beginPath();
    ctx.strokeStyle = "#606060";
    ctx.rect(0,0,w,h);
    ctx.stroke();
    ctx.rect(bw, bw, w-2*bw, h-2*bw);
    ctx.stroke();

    // Draw the curve
    var ctrlPts = this.opacityCurve.controlPts;
    var N = Namespace.OpacityCurve.NumPoints;
    var prevX, prevY, prevColor;
    for (var n=0; n<ctrlPts.length; n+=2) {
        var curvePtIndx = ctrlPts[n];
        var rgbaColor = ctrlPts[n+1];

        // Draw the point
        var hexColor = Namespace.Color.ToHexString( rgbaColor );
        var x = bw + (curvePtIndx/(N-1)) * insideWidth;
        var y = h - (bw + (rgbaColor.a/255) * insideHeight); 
        var r = (curvePtIndx == this.activePtIndex) ? 6 : 4;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, 2*Math.PI, true);
        ctx.fillStyle = hexColor;
        ctx.fill(); 

        // Draw the line segment
        if (prevX || (prevX === 0)) {
            var grad = ctx.createLinearGradient(prevX, prevY, x, y);
            grad.addColorStop(0, prevColor);
            grad.addColorStop(1, hexColor);
            ctx.strokeStyle = grad;
            ctx.beginPath();
            ctx.moveTo(prevX,prevY);
            ctx.lineTo(x,y);
            ctx.stroke();
        }
        prevX = x;
        prevY = y;
        prevColor = hexColor;
        
    }
};


/**
 * Attaches an event handler.
 * 
 * @param {String} name - The name of the event.
 * @param {Function} fn - The function to call when the event occurs.
 * 
 */
Namespace.OpacityControl.prototype.addEventListener = function(eventName, fn)
{
	Namespace.Notifier.prototype.addEventListener.call(this, eventName, fn);
};


/**
 * Removes an event handler.
 * 
 * @param {String} name - The name of the event.
 * @param {Function} fn - The handler function to remove.
 * 
 */
Namespace.OpacityControl.prototype.removeEventListener = function(eventName, fn)
{
	Namespace.Notifier.prototype.removeEventListener.call(this, eventName, fn);
};


/**
 * Fires a specified event.
 * 
 * @param {String} name - The name of the event to fire.
 * 
 */
Namespace.OpacityControl.prototype.trigger = function(eventName, args)
{
	Namespace.Notifier.prototype.trigger.call(this, eventName, args);
};


})( window.BigLime = window.BigLime || {} );







;(function(Namespace, undefined) {
    "use strict";


/**
 * @category 3D
 * @classdesc
 * This class encapsulates a set of points that define an opacity curve.
 * 
 * @constructor
 * @param {Array} [ctrlPoints] - The initial curve points.
 */
Namespace.OpacityCurve = function(ctrlPoints) 
{     
    // Create and initialize the array of control points
    var N = Namespace.OpacityCurve.NumPoints;
    this.curvePts = new Array(N);

    this.controlPts = [];
    ctrlPoints = ctrlPoints || [0, new Namespace.Color(255, 255, 255, 0),  N/4, new Namespace.Color(255, 180, 140, 0),  
        3*N/4, new Namespace.Color(255, 255, 255, 240),  N-1, new Namespace.Color(255, 255, 255, 240)];
    this.setControlPoints(ctrlPoints); 

    // Buffer used when copying the curve to a GL texture
    this.rgbaBuf = new Uint8Array(4*N);    
};
Namespace.OpacityCurve.NumPoints = 1024; // Must be a multiple of 256


/**
 * Creates a deep copy of this object.
 * 
 */
Namespace.OpacityCurve.prototype.clone = function() 
{     
    return new Namespace.OpacityCurve(this.controlPts); 
};


/**
 * Copies the curve data from another OpacityCurve instance.
 * 
 */
Namespace.OpacityCurve.prototype.updateFrom = function(src) 
{     
    this.setControlPoints(src.controlPts);  
};


/**
 * Gets the number of points in the curve.
 * 
 */
Namespace.OpacityCurve.prototype.numPoints = function() 
{ 
    return this.curvePts.length;
};


/**
 * Sets the control points for the curve.
 * 
 * @param {Array} newControlPts - The new set of control points.
 * 
 */
Namespace.OpacityCurve.prototype.setControlPoints = function(newControlPts) 
{ 
    // Reset
    this.controlPts = []; 
    for (var i=0; i<this.curvePts.length; i++) { this.curvePts[i] = null; }

    // Accept the new control points
    for (var j=0; j<newControlPts.length; j+=2) {
        this.controlPts.push( newControlPts[j] );
        this.controlPts.push( Namespace.Color.Clone(newControlPts[j+1]) );
        this.curvePts[ newControlPts[j] ] = Namespace.Color.Clone( newControlPts[j+1] );
    }
};


/**
 * Copies the curve data into a Texture object.
 * 
 * @param {Texture2D} texture - The destination texture.
 * 
 */
Namespace.OpacityCurve.prototype.copyToTexture = function(texture) 
{ 
    // Check the input
    if ( texture.width != this.curvePts.length ) {
        Namespace.Logger.Report("OpacityCurve.copyToTexture: Invalid texture size.", Namespace.Logger.Severity.Error);
        return;
    }
        
    var cp = this.curvePts;
    var N = cp.length;    

    // Do piecewise linear interpolation between the control points
    var indxA = 0;
    var indxB = 1;
    var colorA = cp[0] || new Namespace.Color(0,0,0,0);

    while (indxB < N) {
        var colorB = cp[indxB];
        if ( !colorB && (indxB == N-1) ) { colorB = new Namespace.Color(0,0,0,0); } 
        if ( colorB ) {
            for (var k = indxA; k<=indxB; k++) {
                var delta = (k - indxA)/(indxB - indxA);
                this.rgbaBuf[4*k]   = Math.round( colorA.r + delta*(colorB.r - colorA.r) );
                this.rgbaBuf[4*k+1] = Math.round( colorA.g + delta*(colorB.g - colorA.g) );
                this.rgbaBuf[4*k+2] = Math.round( colorA.b + delta*(colorB.b - colorA.b) );
                this.rgbaBuf[4*k+3] = Math.round( colorA.a + delta*(colorB.a - colorA.a) );
            }
            indxA = indxB;
            colorA = colorB;
        }
        indxB++;
    }

    // Copy the curve values into the texture
    var gl = texture.context.gl;
    texture.bind();
    gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, N, 1, gl.RGBA, gl.UNSIGNED_BYTE, this.rgbaBuf);
    gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 1, N, 1, gl.RGBA, gl.UNSIGNED_BYTE, this.rgbaBuf);
};


/**
 * Outputs a string representation of the control points.
 * 
 */
Namespace.OpacityCurve.prototype.toString = function() 
{ 
    var result = "";

    var cp = this.controlPts;
    for (var i=0; i<cp.length; i+=2) { 
        result += "[" + cp[i].toString() + "]" + cp[i+1].toString() + (i < cp.length-2 ? "; " : "");
    }
    return result;
};


/**
 * Creates an OpacityCurve from its string representation.
 * @static
 * 
 * @param {String} str - The string representaion.
 * 
 */
Namespace.OpacityCurve.FromString = function(str) 
{ 
    var opCurve = null;

    try {
        var tokens = str.trim().split(';');
        var ctrlPts = [];
        for (var i=0; i<tokens.length; i++) {
            var token = tokens[i];
            var pa = token.indexOf('[');
            var pb = token.indexOf(']');
            var ptIndex = parseInt( token.substring(pa+1, pb) );
            var ptColor = Namespace.Color.FromString( token.substring(pb+1));
            ctrlPts.push(ptIndex, ptColor);
        }
        opCurve = new Namespace.OpacityCurve( ctrlPts );
    }
    catch (ex) {
        Namespace.Logger.Report('OpacityCurve.FromString: Invalid input string', Namespace.Logger.Severity.Error);
    }
    return opCurve;
};


/**
 * Syncs the control points with the curve points.
 * 
 * @private
 * 
 */
Namespace.OpacityCurve.prototype._updateControlPointsFromCurvePoints = function() 
{ 
    // Reset
    this.controlPts = []; 
    for (var i=0; i<this.curvePts.length; i++) { 
        if ( this.curvePts[i] ) {
            this.controlPts.push(i);
            this.controlPts.push( Namespace.Color.Clone(this.curvePts[i]) );
        }
    }
};



})( window.BigLime = window.BigLime || {} );







;(function(Namespace, undefined) {
    "use strict";


/**
 * @category 3D
 * @classdesc
 * This class encapsulates a
 * 
 * @constructor
 * @param 
 */
Namespace.ReliefMask = function(context, txIndex, width, height) 
{     
    this.context  = context;  
    this.width    = Math.round(width);
    this.height   = Math.round(height);

    // Create the GL texture object
    const gl = this.context.gl;
    this.texture = new Namespace.Texture2D(context, txIndex, this.width, this.height, gl.RGBA, gl.LINEAR);

    // Buffer used when copying data to the GL texture
    this.dataBuffer = new ArrayBuffer(4*this.width*this.height);
    this.dataView = new DataView(this.dataBuffer);
    this.dataBuffer8 = new Uint8Array(this.dataBuffer);

    // for (let y=Math.round(this.height/4); y<3*this.height/4; y++) {
    //     for (let x=Math.round(this.width/4); x<3*this.width/4; x++) {
    //         const n = 4*(y*this.width + x);
    //         this.dataView.setUint16(n, 128*255, true);
    //     }
    // }
    this.copyDataToTexture();
};



/**
 * 
 * 
 * 
 */
Namespace.ReliefMask.prototype.destroy = function() 
{ 
    if (!this.context) { return; } // We are already destroyed

    // Delete the Texture object
    this.texture.destroy();
    this.texture = null;

    this.context = null;
};


Namespace.ReliefMask.prototype.copyDataToTexture = function(yRange=null) 
{ 
    const gl = this.context.gl;
    this.texture.bind();

    const yStart = yRange ? Math.max(0, yRange[0]) : 0;
    const yCount = yRange ? Math.min(this.height-yStart, yRange[1]-yStart+1) : this.height;
    const data = yRange ? this.dataBuffer8.subarray(yStart*this.width*4, (yStart+yCount)*this.width*4) : this.dataBuffer8;
    gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, yStart, this.width, yCount, gl.RGBA, gl.UNSIGNED_BYTE, data);
};


})( window.BigLime = window.BigLime || {} );







;(function(Namespace, undefined) {
    "use strict";
    var Sev = Namespace.Logger.Severity;
    var vec3 = glMatrix.vec3;
    var vec4 = glMatrix.vec4;
    var mat4 = glMatrix.mat4;


/**
 * @category 3D
 * @classdesc
 * The RenderEngine class performs MIP and VR rendering.
 * 
 * @constructor
 * @param {Object} [args] - Engine parameters.
 * @param {HTMLCanvasElement} [args.canvas] - A canvas on which to render. If not provided, an internal, off-screen canvas will be created.
 * @param {Object}  [args.options] - optional configuration parameters.
 * @param {Number}  [args.options.glVersion] - The desired WebGL version. If not provided, the latest supported version will be used.
 * @param {Boolean} [args.options.logErrors=false] - Whether to check for errors after every WebGL call, and log them.
 * @param {Boolean} [args.options.logCalls=false] - Whether to log all WebGL function calls.
 * 
 */
Namespace.RenderEngine = function(args={}) 
{ 
    // Cache or create our canvas
    this.canvas = args.canvas ||
        Namespace.Ui.CreateElement('canvas', 'renderengine_canvas', null, {width:100, height:100, background:'black'});
    
    this.ctx              = new Namespace.GLContext(this.canvas, args.options);   
    this.volume           = null;    
    this.shaders          = {};   
    this.frameBuffers     = {};    
    this.vertexBuffers    = {};
    this.lutTexture   = null;  
    this.prevOpacityCurve = "";  
    this.loader           = null;
    this.loadingData      = false;
    this.pickMode         = false;
    this.shadowMapRez     = 0.5;

    // Transformation matrices
    this.transforms = {
        model         : mat4.create(), // Model-to-clipspace transform
        view          : mat4.create(), // Rotation, then pan, then zoom
        mvp           : mat4.create(), // Model, then view, then projection
        mvpInv        : mat4.create(), // Inverse mvp transform
        shadowMvp     : [mat4.create(), mat4.create()], // MVP transform for the shadow maps
        shadowMvpInv  : [mat4.create(), mat4.create()]  // Inverse mvp transform for the shadow map  
    };

    // Create our Volume object. (In WebGL 1, we reserve several textures for our FrameBuffers and LUTs.)
    var ctx = this.ctx;
    this.volume = (ctx.glVersion == 1) ? new Namespace.VolumeT2(ctx, ctx.GlMaxTextures-2) : new Namespace.VolumeT3(ctx, 0);

    // Rendering parameters
    this.renderParams = new Namespace.RenderParams();
    this.renderParams.slab = new Namespace.Slab(this.volume);
    this.volume.setInterpType(this.renderParams.interpType);

    // Create the vertex buffers that define the rendered volume, and a slab vertex buffer.
    var gl = ctx.gl;
    this.vertexBuffers.threed = ctx.createAttrBuffer( new Namespace.Shapes3D.Cube(1), 3 ); 
    this.vertexBuffers.twod   = ctx.createAttrBuffer( new Namespace.Shapes3D.Rectangle(2,2), 3 );            

    // Create the frame buffers that we render into  
    this.frameBuffers.threed = new Namespace.FrameBuffer(ctx, ctx.GlMaxTextures-1, this.canvas.width, this.canvas.height, gl.RGBA, gl.LINEAR, false);
    this.frameBuffers.shadows = null; // Will be allocated after we load volume data.
    this.frameBuffers.gfx = null;  // Will be allocated after we load volume data.
        
    // Create a Texture to hold the opacity curve data
    this.lutTexture = new Namespace.Texture2D(ctx, ctx.GlMaxTextures-2, Namespace.OpacityCurve.NumPoints, 16, gl.RGBA, gl.LINEAR);
    this._createColorMapLuts();

    // Optional Mask object, will be allocated after we load volume data.
    this.mask = null;

    // Set the initial background color
    this.clearDisplay();
};


/**
 * Destructor.
 * 
 */
Namespace.RenderEngine.prototype.destroy = function() 
{     
    if (!this.ctx) { return; } // We are already destroyed

    if (this.volume) { this.volume.destroy(); }  
    if (this.lutTexture) { this.lutTexture.destroy(); }
    if (this.mask) { this.mask.destroy(); }

    Object.values(this.frameBuffers).forEach( b => { if (b) { b.destroy(); } } );
    Object.values(this.vertexBuffers).forEach( b => { if (b) { b.destroy(); } } );
    Object.values(this.shaders).forEach( s => { if (s) { s.destroy(); } } );

    
    this.lutTexture = null;
    this.volume = null;
    this.mask = null;
    this.frameBuffers = {};
    this.vertexBuffers = {};
    this.shaders = {};
    this.ctx = null;
};


/**
 * Resizes the raster and its associated buffers to match the client size
 * of a given HTML element, optionally with a downsampling factor.
 * 
 * @param {HTMLElement} element - The HTML element to match.
 * @param {Number} [downsamp=1] - The downsampling factor.
 */
Namespace.RenderEngine.prototype.sizeRasterToMatch = function(element, downsamp=1)
{
    var rect = element.getBoundingClientRect();
    var dw = Math.round( downsamp * rect.width );
    var dh = Math.round( downsamp * rect.height );

    // Set our canvas raster size
    if (this.canvas.width != dw) { this.canvas.width = dw; }
    if (this.canvas.height != dh) { this.canvas.height = dh; }

    // Resize the frame buffers as well
    this.frameBuffers.threed.resize(dw, dh);

    var rp = this.renderParams;
    if (this.frameBuffers.gfx && rp.showGraphics) { this.frameBuffers.gfx.resize(2*dw, 2*dh); }

    if (this.frameBuffers.shadows && rp.lightSet.shadowsEnabled()) {
        var smScale = (downsamp < 1) ? 1 : this.shadowMapRez;
        this.frameBuffers.shadows.resize(Math.round(smScale*dw), 2*Math.round(smScale*dh)); 
    }
};


/**
 * Clears the display.
 * 
 */
Namespace.RenderEngine.prototype.clearDisplay = function() 
{ 
    var rp = this.renderParams;
    var bgColor = (rp.renderType == Namespace.RenderType.VR) ? (rp.vrBackColor || Namespace.Color.Black()) : Namespace.Color.Black();
    this.ctx.clearCanvas(bgColor);
};


/**
 * Sets the shadow map resolution.
 *
 */
Namespace.RenderEngine.prototype.setShadowMapResolution = function(val)
{
    if (this.shadowMapRez == val) { return; }
    
    this.shadowMapRez = val;

    if (this.frameBuffers.shadows) { 
        this.frameBuffers.shadows.resize(Math.round(val*this.canvas.width), 2*Math.round(val*this.canvas.height)); 
    }
};


/**
 * Provides a new set of rendering parameters.
 *
 */
Namespace.RenderEngine.prototype.setRenderParams = function(rp)
{
    this.renderParams = rp;
};


/**
 * Loads image data into the rendering engine.
 * 
 * @param {Object} [args]
 * @param {FileList|File} args.imgFiles - The image File object(s) to load.
 * @param {Loader3D} args.loader - A 3D volume loader.
 * @param {Function} [args.completionCb] - The callback to invoke when loading is complete.
 * @param {Function} [args.progressCb] - The progress callback to invoke during loading.
 */
Namespace.RenderEngine.prototype.loadVolume = function(args={}) 
{
    // Disallow overlapping load requests
    if (this.loadingData) {
        var msg = 'RenderEngine ignored an overlapping load request.';
        Namespace.Logger.Report(msg, Sev.Warn); 
        if (completionCb) { completionCb(msg, null, this); }
        return;
    }

    // Clear the canvas
    this.clearDisplay();

    // Release auxiliary textures, to maximize the number available for volume data
    if (this.frameBuffers.gfx) { this.frameBuffers.gfx.destroy(); }
    if (this.frameBuffers.shadows) { this.frameBuffers.shadows.destroy(); }
    if (this.mask) { this.mask.destroy(); }
    this.frameBuffers.shadows = null;
    this.frameBuffers.gfx = null;
    this.mask = null;
    
    // Delete existing shaders
    this.ctx.setCurrentProgram(null); 
    Object.values(this.shaders).forEach( s => { if (s) { s.destroy(); } } );
    this.shaders = {};  

    // Start loading the images
    var loader = this.loader = args.loader;
    loader.clientData = loader.clientData || {};
    loader.clientData.renderEngineData = {completionCb: args.completionCb};
    this.loadingData = true;

    var errMsg = loader.loadImagesIntoVolume(args.imgFiles, this.volume, this._onVolumeLoaded.bind(this), args.progressCb);
    if (errMsg) {
        Namespace.Logger.Report(errMsg, Sev.Error); 
        this.loadingData = false;
        if (args.completionCb) { args.completionCb(errMsg, null, this); }
        this.loader = null;
        return errMsg;
    } 
};


/**
 * Cancels any in-progress loading.
 * Client callbacks will not be invoked.
 * 
 */
Namespace.RenderEngine.prototype.cancelLoading = function()
{
    if (this.loadingData) {
        this.loadingData = false;
        this.loader.cancelLoading();
        this.loader = null;
    }
}


/**
 * Internal handler for volume-loaded events.
 * @private
 * 
 * @param {Loader3D} loader - The loader object that was used.
 */
Namespace.RenderEngine.prototype._onVolumeLoaded = function(loader)
{        
    this.loadingData = false;
    this.loader = null;

    // Check for errors
    var engineData = loader.clientData.renderEngineData;
    if (loader.errors) {
        if (engineData.completionCb) { engineData.completionCb(loader.errors, loader.warnings, this); }
        return;
    }

    try {    
        var ctx = this.ctx;
        var vol = this.volume;

        // Allocate our FrameBuffers
        var numAvailTextures = ctx.GlMaxTextures - 2 - vol.numTextures();
        var w = this.frameBuffers.threed.width;
        var h = this.frameBuffers.threed.height;    
        if (numAvailTextures >= 1) {
            this.frameBuffers.shadows = new Namespace.FrameBuffer(ctx, ctx.GlMaxTextures-3,
                 Math.round(this.shadowMapRez*w), 2*Math.round(this.shadowMapRez*h), ctx.gl.RGBA, ctx.gl.LINEAR, false);
        }        
        if (numAvailTextures >= 2) {
            this.frameBuffers.gfx = new Namespace.FrameBuffer(ctx, ctx.GlMaxTextures-4, 
                2*w, 2*h, ctx.gl.RGBA, ctx.gl.LINEAR, true);     
        }
        if (numAvailTextures >= 3) {
            this.mask = new Namespace.ReliefMask(ctx, ctx.GlMaxTextures-5, vol.dims[0], vol.dims[1]);     
        }

        // Set the step size for ray tracing
        this.baseRayStepSize = 1.0/Math.max( vol.dims[0], vol.dims[1], vol.dims[2], 64 );       
    }
    catch (err)
    {
        var errMsg = 'RenderEngine exception: ' + err.message;
        if (engineData.completionCb) { engineData.completionCb(errMsg, loader.warnings, this); }
        return;
    }

    // Call back
    if (engineData.completionCb) { engineData.completionCb("", loader.warnings, this); }
};


/**
 * Indicates whether the RenderEngine has loaded a volume.
 * 
 */
Namespace.RenderEngine.prototype.hasImageData = function()
{
    return this.volume.loaded;
};


/**
 * Starts an animation loop.
 * 
 */
Namespace.RenderEngine.prototype.animate = function(maxFps, customFunc)
{
    // Make sure we are not already animating
    if ( this.isAnimating() ) {
        Namespace.Logger.Report('RenderEngine: Overlapping animate request ignored.', Sev.Warn);
        return;
    }

    var fpsInterval = (maxFps > 0) ? 1000/maxFps : 0;
    var then = performance.now();

    // Create the animation loop
    var animFunc = customFunc || this.render.bind(this);
    var animLoop = function() {
        if (fpsInterval <= 0) {
            animFunc();
        }
        else {
            var now = performance.now();
            if (now - then > fpsInterval) {
                then = now;
                animFunc();
            }
        }
        this.animId = Namespace.Utils.requestAnimFrame(animLoop); 
    }.bind(this);

    // Start the animation
    this.animId = Namespace.Utils.requestAnimFrame(animLoop);
};


/**
 * Stops a running animation loop.
 * 
 */
Namespace.RenderEngine.prototype.stopAnimation = function()
{
    if ( this.isAnimating() ) {
        Namespace.Utils.cancelAnimFrame(this.animId);
        this.animId = null;
    }
};


/**
 * Indicates whether an animation loop is running.
 * 
 */
Namespace.RenderEngine.prototype.isAnimating = function()
{
    return !!this.animId;
};


/**
 *  Renders the volume.
 *  @private
 * 
 */
Namespace.RenderEngine.prototype.render = function(overlayLinesFunc=null)
{
    var vol = this.volume;
    if (!vol.loaded  || this.loadingData) { return; }

    var rp = this.renderParams;
    vol.setInterpType(rp.interpType); 

    // Get the volume- and shadow- shader names
    var currShaderNames = this._getCurrentVolShaderNames();
    var volShaderName = currShaderNames.vol;
    var shadowShaderName = currShaderNames.shadow;

    // Set common rendering parameters
    this.ctx.gl.enable(this.ctx.gl.CULL_FACE);

    // Update our transform matrices
    this.updateTransforms();
    
    // Get the current slab params
    var slabInfo = rp.slab ? rp.slab.getVerticesTx().map(a => [...a]).flat() : new Array(24).fill(0);

    // Maybe send the opacity curve to the GPU
    var isVr = (rp.renderType == Namespace.RenderType.VR);
    var isXray = (rp.renderType == Namespace.RenderType.XRAY);
    if (isVr || isXray) {
        var opCurveStr = rp.opacityCurve.toString();
        if (opCurveStr != this.prevOpacityCurve) {
            rp.opacityCurve.copyToTexture(this.lutTexture);
            this.prevOpacityCurve = opCurveStr;
        }
    }

    // Maybe render the shadow maps
    if (shadowShaderName != "") {
        this._renderShadowMaps(shadowShaderName, slabInfo);
    }

    // Maybe render embedded graphics
    if ( isVr && this.frameBuffers.gfx && rp.showGraphics && (vol.meshManager.numVisibleMeshes() > 0) ) {
        this._renderGraphics();
    }

    // Render the volume to a temporary frame buffer
    this._renderVolToFramebuffer(volShaderName, slabInfo);

    // Apply win/level, overlays, etc.
    this._renderFramebufferToCanvas(overlayLinesFunc);  
};


/**
 * Renders the shadow maps.
 * @private
 * 
 */
Namespace.RenderEngine.prototype._renderShadowMaps = function(shaderName, slabInfo)
{    
    var vol = this.volume;
    var opRange = vol.getOpacityRange();
    var rp = this.renderParams;

    var shadowShader = this._useShader(shaderName);
    shadowShader.setUniform('uBitsPerPixel', vol.bpp);
    shadowShader.setUniform('uMosaicDims',   vol.txInfo ? vol.txInfo.mosaicDims : [1,1,1]); 
    shadowShader.setUniform('uNumTextures',  vol.numTextures());   
    shadowShader.setUniform('uVolShape',     vol.shape);
    shadowShader.setUniform('uOpacityRange', [opRange[0], 1.0/opRange[1]] );
    shadowShader.setUniform('uRayStepSize',  this.baseRayStepSize);
    shadowShader.setUniform('uMaskEnabled',  rp.useMask);
    shadowShader.setUniform('uSlabInfo',     slabInfo);
    shadowShader.setUniform('uVolNumImages', vol.dims[2]);
    shadowShader.setAttribute('aPosition',   this.vertexBuffers.threed);    

    var sfb = this.frameBuffers.shadows;
    var w = sfb.width;
    var h = sfb.height/2;
    for (var L=0; L<rp.lightSet.dirLights.length; L++) {   
        if (rp.lightSet.dirLights[L].shadowDarkness > 0) { 
            shadowShader.setUniform("uShadowMvpTransform", this.transforms.shadowMvp[L]);
            shadowShader.setUniform("uShadowMvpInvTransform", this.transforms.shadowMvpInv[L]);
            shadowShader.draw({target:sfb, clearColor:Namespace.Color.White, viewport:[0, L*h, w, h]});
        }
    }
};


/**
 * Renders the graphics and produces a depth map for them.
 * @private
 * 
 */
Namespace.RenderEngine.prototype._renderGraphics = function()
{  
    var vol = this.volume; 
    if (!vol.loaded || this.loadingData) { return; } 

    // Set the uniforms that might be changing with each render    
    var gfxShader = this._useShader("gfx");
    gfxShader.setUniform("uMvpTransform", this.transforms.mvp);
    gfxShader.setUniform("uMvpInvTransform", this.transforms.mvpInv);
    gfxShader.setUniform("uRotMatrix", this.renderParams.rotMatrix);
    gfxShader.setUniform("uPersp",  this.renderParams.persp);

    // Clear the color and depth buffers
    var gl = this.ctx.gl;
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.frameBuffers.gfx.glFrameBuffer);
    gl.clearColor(1.0, 1.0, 1.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);     

    // Loop over graphics layers
    gl.enable(gl.DEPTH_TEST);
    var w = gl.drawingBufferWidth;
    var h = gl.drawingBufferHeight;
    for (var L=0; L<2; L++) {
        var nv = vol.meshManager.numVisibleVertices(L);
        if (nv > 0) {
            // Activate the triangle-data buffers
            vol.meshManager.activateMeshes(L, gfxShader);  

            // Render the triangles           
            gfxShader.setUniform("uRenderDepthMap", false);
            gfxShader.draw({numVertices:nv, target:this.frameBuffers.gfx, clear:false, viewport:[0, L*h, w, h]});

            // Render the depth map           
            gfxShader.setUniform("uRenderDepthMap", true);
            gfxShader.draw({numVertices:nv, target:this.frameBuffers.gfx, clear:false, viewport:[w, L*h, w, h]}); 
        }        
    }
    gl.disable(gl.DEPTH_TEST);
};


/**
 * Renders the volume to the frame buffer.
 * @private
 * 
 * @param {Object} slabInfo - An array of uniforms that describes the slab.
 */
Namespace.RenderEngine.prototype._renderVolToFramebuffer = function(volShaderName, slabInfo)
{    
    var vol = this.volume;
    if (!vol.loaded || this.loadingData) { return; } 
        
    // Prepare the 3D pipeline
    var xfrms = this.transforms;
    var rp = this.renderParams;
    var volShader = this._useShader(volShaderName);
                 
    // Set uniforms 
    volShader.setUniform('uModelTransform',  xfrms.model);
    volShader.setUniform('uViewTransform',   xfrms.view);
    volShader.setUniform('uMvpTransform',    xfrms.mvp);
    volShader.setUniform('uMvpInvTransform', xfrms.mvpInv);
    volShader.setUniform('uRayStepSize',     this.baseRayStepSize/rp.rayOversamp);
    volShader.setUniform('uPersp',           rp.persp);
    volShader.setUniform('uMarkerLoc',       rp.markerLoc);  
    volShader.setUniform('uMarkerSize',      rp.markerSize); 
    volShader.setUniform('uShowMarker',      rp.showMarker);
    volShader.setUniform('uMaskEnabled',     rp.useMask);
    volShader.setUniform('uSlabInfo',        slabInfo);
    volShader.setUniform('uVolShape',        vol.shape);
    volShader.setUniform('uVolNumImages',    vol.dims[2]);
    volShader.setUniform('uBitsPerPixel',    vol.bpp);
    volShader.setUniform('uNumTextures',     vol.numTextures());         
    volShader.setUniform('uMosaicDims',      vol.txInfo ? vol.txInfo.mosaicDims : [1,1,1]); 
    volShader.setAttribute('aPosition',      this.vertexBuffers.threed);

    var isVrMode = (rp.renderType == Namespace.RenderType.VR);
    if (isVrMode)
    {
        var opRange = vol.getOpacityRange();
        volShader.setUniform('uAntiAlias',     (rp.antiAlias ? 1 : 0)); 
        volShader.setUniform('uGfxBlendWeight', rp.gfxBlendWeight); 
        volShader.setUniform('uMarkerColor',    Namespace.Color.ScaleTo1(rp.markerColor));
        volShader.setUniform('uOpacityRange',  [opRange[0], 1.0/opRange[1]] ); 
        volShader.setUniform('uOutBufferSize',  this.frameBuffers.threed.getSize());
        volShader.setUniform('uSealBorders',    rp.sealBorders); 
        volShader.setUniform("uShadowSampler",  this.frameBuffers.shadows ? this.frameBuffers.shadows.txIndex : -1);
        volShader.setUniform('uVrBackColor',    Namespace.Color.ScaleTo1(rp.vrBackColor).slice(0,3));
    
        if (!this.pickMode) {   
            volShader.setUniform("uAmbientLight", rp.lightSet.ambientLight); 
            for (var L=0; L<rp.lightSet.dirLights.length; L++) {
                var light = rp.lightSet.dirLights[L];
                var prefix = "uLights[" + L.toString() + "].";
                volShader.setUniform(prefix + 'diffuse',        light.diffuse); 
                volShader.setUniform(prefix + 'specStrength',   light.specStrength);  
                volShader.setUniform(prefix + 'specExp',        light.specExp); 
                volShader.setUniform(prefix + 'shadowDarkness', light.shadowDarkness);
                volShader.setUniform(prefix + 'shadowSoftness', light.shadowSoftness);
                volShader.setUniform(prefix + 'shadowMvp',      xfrms.shadowMvp[L]);

                // Transform the light direction to texture space before sending it
                var tdir = vec4.fromValues(light.dir[0], light.dir[1], light.dir[2], 0.0);
                vec4.normalize(tdir, vec4.transformMat4(tdir, tdir, xfrms.mvpInv));
                volShader.setUniform(prefix + 'dir', vec3.fromValues(tdir[0], tdir[1], tdir[2]));
            }  
        }
    }
    else if (rp.renderType == Namespace.RenderType.XRAY) {
        var opRange = vol.getOpacityRange();
        volShader.setUniform('uOpacityRange',  [opRange[0], 1.0/opRange[1]] ); 
        volShader.setUniform('uUseLut',  rp.useXrayLut); 
    }

    // Draw
    var bgColor = isVrMode ? ( rp.vrBackColor || Namespace.Color.Black() ) : Namespace.Color.Black();     
    volShader.draw( {target:this.frameBuffers.threed, clearColor:bgColor} );
};


/**
 * Renders the frame buffer to the canvas, applying win/level transform
 * and/or overlays.
 * @private
 * 
 */
Namespace.RenderEngine.prototype._renderFramebufferToCanvas = function(overlayLinesFunc)
{    
    if (!this.volume.loaded || this.loadingData) { return; } // No data is loaded

    // Prepare the 2D pipeline
    var gl = this.ctx.gl;
    var rp = this.renderParams;
 
    // Run the window/level shader
    var wlShader = this._useShader('winLevel');
    wlShader.setInputTexture('uWLSampler', this.frameBuffers.threed.texture);
    wlShader.setInputTexture('uLutSampler', this.lutTexture);
    wlShader.setUniform('uWinWidth', rp.winWidth); 
    wlShader.setUniform('uWinLevel', rp.winLevel); 
    wlShader.setUniform('uMarkerColor', Namespace.Color.ScaleTo1(rp.markerColor));
    wlShader.setUniform('uPassThruMode', (rp.renderType == Namespace.RenderType.VR ? 1 : 0) ); 
    wlShader.setUniform('uColorMapIndex', rp.colorMapIndex); 
    wlShader.setAttribute('aPosition', this.vertexBuffers.twod);
    wlShader.draw();

    // Draw any overlay lines (eg the slab wireframe)
    if (overlayLinesFunc) 
    {
        var lineInfo = overlayLinesFunc(this.transforms);
        if (lineInfo) {
            var slabShader = this._useShader('slab');
            slabShader.setUniform('uMvpTransform', this.transforms.mvp);
            slabShader.setUniform('uPersp', rp.persp);
            slabShader.setAttribute('aPosition', lineInfo.vertexBuffer);
            slabShader.setAttribute('aColor', lineInfo.attrBuffer);
            slabShader.draw( {clear:false, drawMode:gl.LINES, numVertices:2*lineInfo.numLines} );
        }
    }
};


/**
 * Returns the name of the appropriate 3d shader to use, and its shadows-shader, 
 * based on the current settings.
 * @private
 * 
 */
Namespace.RenderEngine.prototype._getCurrentVolShaderNames = function()
{
    var vol = this.volume;
    if (!vol.loaded || this.loadingData) { return; }

    // Build the shader name based on our current state variables
    var rp = this.renderParams;
    var isVrMode   = (rp.renderType == Namespace.RenderType.VR);
    var isXrayMode = (rp.renderType == Namespace.RenderType.XRAY);
    var renderType = isVrMode ? 'vr' : isXrayMode ? 'xray' : 'mip';    
    var slabSuffix = rp.clipToSlab ? '_slab' : "";
    var gfxSuffix  = !isXrayMode && rp.showGraphics && this.frameBuffers.gfx && (vol.meshManager.numVisibleMeshes() > 0) ? "_gfx" : "";
    var shadSuffix = isVrMode && this.frameBuffers.shadows && rp.lightSet.shadowsEnabled() ? "_shadows" : "";

    var pixelLayoutSuffix = "";
    if (this.ctx.glVersion === 1) {
        var interp = (rp.interpType == Namespace.Interp3D.TriLinear) ? 'lin' : 'nn';
        var txSuffix = (vol.numTextures() <= 1) ? '_st' : '_mt'; 
        pixelLayoutSuffix = '_' + vol.bpp.toString() + 'bit_' + interp + txSuffix;
    }

    var volShaderName = renderType + slabSuffix + gfxSuffix + shadSuffix + pixelLayoutSuffix;    
    var shadowShaderName = isVrMode ? ('shadows' + slabSuffix + pixelLayoutSuffix) : "";  

    return {vol:volShaderName, shadow:shadowShaderName};
};


/**
 * Activates the given shader.
 * @private
 * 
 * @param {String} shaderName - The name of the shader to use.
 */
Namespace.RenderEngine.prototype._useShader = function(shaderName)
{
    // If the shader doesn't exist yet, then create it
    var shader = this.shaders[shaderName] || this._createShader(shaderName);
    this.ctx.setCurrentProgram(shader);     
    return shader;
};


/**
 * Creates a shader iven its id string.
 * @private
 * 
 * @param {String} shaderName - The id string of the shader to create.
 */
Namespace.RenderEngine.prototype._createShader = function(shaderName)
{
    var vol = this.volume;
    var glVersion = this.ctx.glVersion.toString();
    var comps = shaderName.split('_');
    var renderTypeStr = comps[0];

    var vCode = Namespace.ShaderCode[ renderTypeStr + '_vert_' + glVersion ]; 
    var fCode = Namespace.ShaderCode[ renderTypeStr + '_frag_' + glVersion ]; 

    // Add any shader-specific defines
    var defs = "";
    if (shaderName.indexOf('_slab') !== -1) { defs += '\n#define CLIP_TO_SLAB'; }
    if (shaderName.indexOf('_gfx')  !== -1) { defs += '\n#define RENDER_GRAPHICS'; }
    if (shaderName.indexOf('_shadows') !== -1) { defs += "\n#define RENDER_SHADOWS"; }

    if ((renderTypeStr == 'vr') || (renderTypeStr == 'shadows') || (renderTypeStr == 'xray') || (renderTypeStr == 'winLevel')) {
        var lutYOffset = 1/this.lutTexture.height;
        defs += "\n#define LUT_TX_YOFFSET " + lutYOffset.toString() + ((lutYOffset % 1 == 0) ? ".0" : "");
    }
    if (renderTypeStr == 'winLevel') { 
        var lutXScale = 256/this.lutTexture.width;
        var lutYScale = 2/this.lutTexture.height;
        defs += "\n#define LUT_TX_XSCALE " + lutXScale.toString() + ((lutXScale % 1 == 0) ? ".0" : ""); 
        defs += "\n#define LUT_TX_YSCALE " + lutYScale.toString() + ((lutYScale % 1 == 0) ? ".0" : "");
    }
    if (this.ctx.glVersion == 1) {
        defs += '\n#define PIXEL_LAYOUT_' + comps.slice(comps.length-3).join('_').toUpperCase();
        defs += '\n#define NUM_IMAGE_TEXTURES ' + vol.numTextures();
    }

    var codeSubs = {'//<<SYMBOL_DEFS>>//': defs};  
    var shader = new Namespace.ShaderProgram( this.ctx, shaderName, vCode, fCode, codeSubs, codeSubs, true );            
    this.shaders[shaderName] = shader;    


    // Set any required input textures
    if (renderTypeStr == 'vr') {
        shader.setInputTexture("uGfxSampler", this.frameBuffers.gfx ? this.frameBuffers.gfx.texture : null);
    }
    if ((renderTypeStr == 'vr') || (renderTypeStr == 'shadows') || (renderTypeStr == 'xray')) {
        shader.setInputTexture('uLutSampler', this.lutTexture);
    }
    if ((renderTypeStr == 'vr') || (renderTypeStr == 'shadows') || (renderTypeStr == 'xray') || (renderTypeStr == 'mip') ) 
    {
        shader.setInputTexture('uMaskSampler', this.mask ? this.mask.texture : null);

        if (this.ctx.glVersion === 2)  {
            shader.setInputTexture('uVolumeSampler', vol.texture);             
        } else {
            if (vol.numTextures() == 1) {
                shader.setInputTexture('uSampler', vol.textures[0]);
            } else { 
                shader.setInputTexture('uSamplers', vol.textures);
            }                         
        } 
    }
    return shader;
};


/**
 * Updates all of our transform matrices.
 *
 */
Namespace.RenderEngine.prototype.updateTransforms = function() 
{ 
    this.calcTransforms(this.renderParams, this.ctx.canvas, {result:this.transforms});
};


/**
 * Calculates all of our transform matrices.
 *
 */
Namespace.RenderEngine.prototype.calcTransforms = function(renderParams, canvas, args={omitLights:false, result:null})
{    
    var rp = renderParams;
    var xfrms = args.result || {
        model         : mat4.create(),
        view          : mat4.create(),
        mvp           : mat4.create(),
        mvpInv        : mat4.create(),
        shadowMvp     : args.omitLights ? null : [mat4.create(), mat4.create()],
        shadowMvpInv  : args.omitLights ? null : [mat4.create(), mat4.create()]
    };

    if (!this.volume.loaded) { return xfrms; } // No data is loaded

    // Model Transform: Scales our 3d box axes to match the aspect ratios of the current volume, 
    // then scales all coordinates so that the diagonal of the box just fits into clip space.
    var scaleFactors = vec3.normalize(vec3.create(), this.volume.shape)
    vec3.scale(scaleFactors, scaleFactors, 2);
    mat4.fromScaling(xfrms.model, scaleFactors);

    // View Transform: Rotate, pan, and zoom
    var pan = mat4.fromTranslation(mat4.create(), vec3.fromValues(-rp.pan[0], -rp.pan[1], 0));
    var zoomVals = Array.isArray(rp.zoom) ? rp.zoom : [rp.zoom, rp.zoom];
    var zoom = mat4.fromScaling(mat4.create(), vec3.fromValues(zoomVals[0], zoomVals[1], 1));
    mat4.multiply(xfrms.view, zoom, mat4.multiply(mat4.create(), pan, rp.rotMatrix));
    
    // Projection Transform:
    var aspect = canvas.height/canvas.width;
    var proj = mat4.fromScaling(mat4.create(), vec3.fromValues(Math.min(aspect, 1.0), Math.min(1.0/aspect, 1.0), 1));

    // MVP Transform:
    mat4.multiply(xfrms.mvp, proj, mat4.multiply(mat4.create(), xfrms.view, xfrms.model));
    mat4.invert(xfrms.mvpInv, xfrms.mvp);

    // Shadow-map Transforms:
    if (!args.omitLights && (rp.renderType == Namespace.RenderType.VR))  {
        for (var L = 0; L < rp.lightSet.dirLights.length; L++) {
            var light = rp.lightSet.dirLights[L];    
            if (light.shadowDarkness > 0) {
                // Model
                var sMvp = xfrms.shadowMvp[L];
                mat4.copy(sMvp, xfrms.model);

                // View (just the rotation part, to which we add a delta rotation towards the light direction)
                var sRot = mat4.clone(rp.rotMatrix);
                var rotAxis = vec3.cross(vec3.create(), vec3.fromValues(0,0,1), light.dir);
                var rotAngle = Math.asin( vec3.length(rotAxis) );
                if (Math.abs(rotAngle) > 0.0001) {
                    var deltaRot = mat4.fromRotation(mat4.create(), -rotAngle, rotAxis);
                    mat4.multiply(sRot, deltaRot, sRot);
                }
                mat4.multiply(sMvp, sRot, sMvp);

                // Projection
                mat4.multiply(sMvp, proj, sMvp);
                mat4.invert(xfrms.shadowMvpInv[L], sMvp);
            }
        }                    
    }
    return xfrms;
};


/**
 * Populates the color-map lookup tables.
 * 
 */
Namespace.RenderEngine.prototype._createColorMapLuts = function() 
{     
    var N = Math.min(257, this.lutTexture.width);
    var gl = this.lutTexture.context.gl;
    var rgbaBuf = new Uint8Array(4*N);     
    this.lutTexture.bind();

    // 0. 16-colors
    var colorMapIndex = 0, i=0, j=0;
    var colors = [];
    colors.push([0,0,0,255]);      colors.push([1,1,171,255]);    colors.push([1,1,224,255]);      colors.push([0,110,255,255]);
    colors.push([1,171,254,255]);  colors.push([1,224,254,255]);  colors.push([1,254,1,255]);      colors.push([190,255,0,255]);
    colors.push([255,255,0,255]);  colors.push([255,224,0,255]);  colors.push([255,141,0,255]);    colors.push([250,94,0,255]);
    colors.push([245,0,0,255]);    colors.push([245,0,197,255]);  colors.push([222,180,222,255]);  colors.push([255,255,255,255]);
    colors.push([255,255,255,255]);

    for (i=0; i<N; i++) {
        var color = colors[ Math.floor(i/16) ]; 
        for (j=0; j<4; j++) { rgbaBuf[4*i + j] = color[j]; }
    }
    gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 2+2*colorMapIndex, N, 1, gl.RGBA, gl.UNSIGNED_BYTE, rgbaBuf);
    gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 3+2*colorMapIndex, N, 1, gl.RGBA, gl.UNSIGNED_BYTE, rgbaBuf);

    // TODO: Add more LUTs
};


})( window.BigLime = window.BigLime || {} );







;(function(Namespace, undefined) {
    "use strict";
    var vec2 = glMatrix.vec2;
    var vec3 = glMatrix.vec3;
    var mat4 = glMatrix.mat4;
    

/**
 * @category 3D
 * @classdesc
 * This class encapsulates a set of rendering parameters.
 * 
 * @constructor
 * @param {RenderParams|Settings|Object} [src] - An object to initialize from.
 */
Namespace.RenderParams = function(src) 
{ 
    this.antiAlias      = false;
    this.clipToSlab     = true;
    this.gfxBlendWeight = 0.5;
    this.interpType     = Namespace.Interp3D.TriLinear;
    this.lightSet       = new Namespace.LightSet();
    this.markerColor    = Namespace.Color.FromName('green');
    this.markerLoc      = vec3.fromValues(0.5, 0.5, 0.5);
    this.markerSize     = 0.0075;
    this.opacityCurve   = new Namespace.OpacityCurve();
    this.pan            = vec2.fromValues(0, 0);
    this.persp          = 0.0;
    this.rayOversamp    = 1.0;
    this.renderType     = Namespace.RenderType.VR;
    this.rotMatrix      = mat4.create();
    this.sealBorders    = false;
    this.showGraphics   = true;
    this.showMarker     = true;
    this.showSlab       = true;
    this.slab           = null;
    this.useMask        = false;
    this.colorMapIndex  = 0;
    this.useXrayLut     = false;
    this.vrBackColor    = new Namespace.Color(18, 9, 57); 
    this.winLevel       = 0.0;
    this.winWidth       = 1.0;
    this.zoom           = 1.0;

    if (src) { this.updateFrom(src); }
};


/**
 * Updates the RenderParams from another RenderParams object or a Settings object.
 * 
 */
Namespace.RenderParams.prototype.updateFrom = function(src) 
{ 
    if (Object.hasOwn(src, 'antiAlias'))      { this.antiAlias = src.antiAlias; } 
    if (Object.hasOwn(src, 'clipToSlab'))     { this.clipToSlab = src.clipToSlab; }
    if (Object.hasOwn(src, 'gfxBlendWeight')) { this.gfxBlendWeight = src.gfxBlendWeight; }
    if (Object.hasOwn(src, 'interpType'))     { this.interpType = src.interpType; }
    if (Object.hasOwn(src, 'lightSet'))       { this.lightSet.updateFrom(src.lightSet); }
    if (Object.hasOwn(src, 'markerColor'))    { this.markerColor = Namespace.Color.Clone(src.markerColor); }
    if (Object.hasOwn(src, 'markerLoc'))      { vec3.copy(this.markerLoc, src.markerLoc); }
    if (Object.hasOwn(src, 'markerSize'))     { this.markerSize = src.markerSize; }
    if (Object.hasOwn(src, 'pan'))            { vec2.copy(this.pan,src.pan); }
    if (Object.hasOwn(src, 'persp'))          { this.persp = src.persp; }
    if (Object.hasOwn(src, 'rayOversamp'))    { this.rayOversamp = src.rayOversamp; }
    if (Object.hasOwn(src, 'renderType'))     { this.renderType = src.renderType; }
    if (Object.hasOwn(src, 'rotMatrix'))      { mat4.copy(this.rotMatrix, src.rotMatrix); }
    if (Object.hasOwn(src, 'sealBorders'))    { this.sealBorders = src.sealBorders; }
    if (Object.hasOwn(src, 'showGraphics'))   { this.showGraphics = src.showGraphics; }
    if (Object.hasOwn(src, 'showMarker'))     { this.showMarker = src.showMarker; }
    if (Object.hasOwn(src, 'showSlab'))       { this.showSlab = src.showSlab; }
    if (Object.hasOwn(src, 'useMask'))        { this.useMask = src.useMask; }
    if (Object.hasOwn(src, 'useXrayLut'))     { this.useXrayLut = src.useXrayLut; }
    if (Object.hasOwn(src, 'colorMapIndex'))  { this.colorMapIndex = src.colorMapIndex; }
    if (Object.hasOwn(src, 'vrBackColor'))    { this.vrBackColor = Namespace.Color.Clone(src.vrBackColor); }
    if (Object.hasOwn(src, 'winLevel'))       { this.winLevel = src.winLevel; }
    if (Object.hasOwn(src, 'winWidth'))       { this.winWidth = src.winWidth; }
    
    if (Object.hasOwn(src, 'opacityCurveStr')) { 
        this.opacityCurve.updateFrom( Namespace.OpacityCurve.FromString(src.opacityCurveStr) ); 
    } else if (Object.hasOwn(src, 'opacityCurve')) {
        this.opacityCurve.updateFrom(src.opacityCurve);
    }

    if (Object.hasOwn(src, 'slab')) { 
        if (!this.slab) { 
            this.slab = src.slab.clone(); 
        } else {
            this.slab.updateFrom(src.slab);
        }
    }

    if (Object.hasOwn(src, 'zoom')) { 
        if (Array.isArray(src.zoom))  {
            if (Array.isArray(this.zoom) ) { 
                vec2.copy(this.zoom, src.zoom); 
            } else { 
                this.zoom = vec2.clone(src.zoom); 
            }
        } else { 
            if (Array.isArray(this.zoom) ) { 
                vec2.set(this.zoom, src.zoom, src.zoom); 
            } else { 
                this.zoom = src.zoom; 
            } 
        }
    }
};


})( window.BigLime = window.BigLime || {} );







;(function(Namespace, undefined) {
    "use strict";
    

/**
 * @category 3D
 * @classdesc
 * Settings ara a subset of RenderParams, that excludes the pose
 * transient parameters (pan, zoom, rotation, win/level, slab, marker-location, etc.).
 * 
 * @constructor
 * @param {RenderParams|Settings|Object} [src] - An object to initialize from.
 */
Namespace.Settings = function(src) 
{ 
    this.antiAlias       = false;
    this.interpType      = Namespace.Interp3D.TriLinear;
    this.lightSet        = new Namespace.LightSet();
    this.opacityCurveStr = (new Namespace.OpacityCurve()).toString();
    this.useXrayLut      = false;
    this.colorMapIndex   = 0;
    this.persp           = 0.0;
    this.rayOversamp     = 1.0;
    this.renderType      = Namespace.RenderType.VR;
    this.sealBorders     = false;
    this.vrBackColor     = new Namespace.Color(18, 9, 57); 

    if (src) { this.updateFrom(src); }
};


/**
 * Updates the Settings from a RenderParams or Settings or JSON object.
 * (Doesn't update the name.)
 * 
 * @param {RenderParams} [src] - The object to update from.
 * 
 */
Namespace.Settings.prototype.updateFrom = function(src) 
{ 
    if (Object.hasOwn(src, 'antiAlias'))      { this.antiAlias = src.antiAlias; } 
    if (Object.hasOwn(src, 'interpType'))     { this.interpType = src.interpType; }
    if (Object.hasOwn(src, 'lightSet'))       { this.lightSet.updateFrom(src.lightSet); }
    if (Object.hasOwn(src, 'useXrayLut'))     { this.useXrayLut = src.useXrayLut; }
    if (Object.hasOwn(src, 'colorMapIndex'))  { this.colorMapIndex = src.colorMapIndex; }
    if (Object.hasOwn(src, 'persp'))          { this.persp = src.persp; }
    if (Object.hasOwn(src, 'rayOversamp'))    { this.rayOversamp = src.rayOversamp; }
    if (Object.hasOwn(src, 'renderType'))     { this.renderType = src.renderType; }
    if (Object.hasOwn(src, 'sealBorders'))    { this.sealBorders = src.sealBorders; }
    if (Object.hasOwn(src, 'vrBackColor'))    { this.vrBackColor = Namespace.Color.Clone(src.vrBackColor); }

    if (Object.hasOwn(src, 'opacityCurveStr')) { 
        this.opacityCurveStr = src.opacityCurveStr; 
    } else if (Object.hasOwn(src, 'opacityCurve')) {
        this.opacityCurveStr = src.opacityCurve.toString();
    }
};


/**
 * Indicates whether a the Settings object matches a given 
 * RenderParams | Settings | json object.
 * 
 */
Namespace.Settings.prototype.matches = function(that)
{
    if (this.antiAlias != that.antiAlias) { return false; }
    if (this.interpType != that.interpType) { return false; }
    if (!this.lightSet.valueEquals(that.lightSet)) { return false; }
    if (this.opacityCurveStr != that.opacityCurve.toString()) { return false; }
    if (this.useXrayLut != that.useXrayLut) { return false; }
    if (this.colorMapIndex != that.colorMapIndex) { return false; }
    if (this.persp != that.persp) { return false; }
    if (this.rayOversamp != that.rayOversamp) { return false; }   
    if (this.renderType != that.renderType) { return false; }    
    if (this.sealBorders != that.sealBorders) { return false; }
    if (!Namespace.Color.AreEqual(this.vrBackColor, that.vrBackColor)) { return false; }

    return true;
}


/**
 * Creates a Json-string representation of this object.
 * 
 */
Namespace.Settings.prototype.toJsonString = function() 
{ 
    return JSON.stringify(this,  
        function(key, val) { return val.toFixed ? Number(val.toFixed(8)) : val; }, 4
    );
};


/**
 * Creates a Settings object from its Json-string representation.
 * 
 */
Namespace.Settings.FromJsonString = function(str) 
{ 
    var jsonObj = JSON.parse(str);
    var settings = new Namespace.Settings();
    settings.updateFrom(jsonObj);
    settings.name = jsonObj.name;
    return settings;
};



})( window.BigLime = window.BigLime || {} );







;(function(Namespace, undefined) {
    "use strict";

/**
 * @category 3D
 * @classdesc
 • This class represents a WebGL shader (either a fragment shader or a vertex shader). 
 * 
 * @constructor
 * @param {GLContext} context - The rendering context.
 * @param {GLenum} type - The shader type (gl.VERTEX_SHADER or gl.FRAGMENT_SHADER).
 * @param {String} name - A name for the shader.
 * @param {String} code - The shader code.
 * @param {Object} [subs] - A map of text substitutions to be made in the code. 
 * @param {Boolean} [compile=true] - Whether to compile the shader code at construction time.
 * 
 */
Namespace.Shader = function(context, type, name, code, subs, compile) 
{ 
    // Initialize members
    this.context    =  context;        
    this.type       =  type;
    this.name       =  name || "";
    this.code       =  "";
    this.glShader   =  null;
    this.isCompiled =  false;

    // Apply any code substitutions
    if (subs) {
        for (var key in subs) {
            if (subs.hasOwnProperty(key)) {           
                code = code.split(key).join(subs[key]); // Replaces all occurrences of key
            }
        }	
    }
    this.code = code;

    // Create our WebGLShader object
    this.glShader = context.gl.createShader(this.type);
    context.gl.shaderSource(this.glShader, this.code);

    // Compile it, if requested
    if ( (typeof(compile) === 'undefined') || !!compile ) {
        this.compile();
    }     
};


/**
 * Destructor.
 * 
 */
Namespace.Shader.prototype.destroy = function() 
{ 
    // Check if we are already destroyed
    if (!this.context) { return; }

    // Destroy sub-objects
    if (this.glShader) { 
        this.context.gl.deleteShader(this.glShader); 
    }

    // Null-out the data members     
    this.context = null;
    this.code = "";
    this.glShader = null;
    this.isCompiled = false;
};


/**
 * Compiles the shader if it's not already compiled.
 * 
 */
Namespace.Shader.prototype.compile = function()
{
    // Do nothing if we are already compiled
    if (this.isCompiled) { return; }
    
    // Compile and check for errors
    var gl = this.context.gl;
    gl.compileShader(this.glShader);

    if (!gl.getShaderParameter(this.glShader, gl.COMPILE_STATUS) && !gl.isContextLost()) {
        Namespace.Logger.Report("Shader.compile: " + this.name + " compilation error(s):\n" + 
            gl.getShaderInfoLog(this.glShader), Namespace.Logger.Severity.Error); 
    } else {
        this.isCompiled = true;
    }
};


})( window.BigLime = window.BigLime || {} );







;(function(Namespace, undefined) {
    "use strict";
    var Sev = Namespace.Logger.Severity;

/**
 * @category 3D
 * @classdesc
 * This class encapsulates a WebGL program (which is essentially just a vertex shader
 * together with a fragment shader).
 * 
 * @constructor
 * @param {GLContext} context - The rendering context. 
 * @param {String} name - A name for the program.
 * @param {String} vCode - The vertex shader code.
 * @param {String} fCode - The fragment shader code.
 * @param {Object} vSubs - A map of text substitutions to be made in vCode.
 * @param {Object} fSubs - A map of text substitutions to be made in fCode.
 * @param {Boolean} compile=true - Whether to compile the program at construction time.
 * 
 */
Namespace.ShaderProgram = function(context, name, vCode, fCode, vSubs, fSubs, compile) 
{ 
    // Initialize data members
    this.context     = context;
    this.name        = name || "";
    this.vShader     = null;
    this.fShader     = null;
    this.glProgram   = null;
    this.uniforms    = {};
    this.attributes  = {};
    this.numVertices = undefined;
    this.indexBuffer = null;
    this.isCompiled  = false;

    // Create the vertex shader
    var gl = this.context.gl;
    this.vShader = new Namespace.Shader(context, gl.VERTEX_SHADER, this.name + '_vshader', vCode, vSubs, compile);

    // Create the fragment shader
    this.fShader = new Namespace.Shader(context, gl.FRAGMENT_SHADER, this.name + '_fshader', fCode, fSubs, compile);

    // Create our WebGL program object
    this.glProgram = gl.createProgram();
    gl.attachShader(this.glProgram, this.vShader.glShader);
    gl.attachShader(this.glProgram, this.fShader.glShader);
    
    // Compile and link it, if requested
    if ( (typeof(compile) === 'undefined') || !!compile ) {
        this.compile();
    } 
};


/**
 * Destructor.
 * 
 */
Namespace.ShaderProgram.prototype.destroy = function() 
{ 
    // Check if we are already destroyed
    if (!this.context) { return; } 

    // Destroy sub-objects
    if (this.glProgram) { this.context.gl.deleteProgram(this.glProgram); }
    if (this.vShader) { this.vShader.destroy(); }
    if (this.fShader) { this.fShader.destroy(); }

    // Null-out the data members 
    this.glProgram  = null;
    this.vShader    = null;
    this.fShader    = null;
    this.uniforms   = {};
    this.attributes = {};
    this.context    = null;
};


/**
 * Compiles and links the shader program if it hasn't already been done.
 * 
 */
Namespace.ShaderProgram.prototype.compile = function() 
{ 
    // Do nothing if we are already compiled
    if (this.isCompiled) { return; }
    
    // Compile the shaders if necessary
    this.vShader.compile();
    this.fShader.compile();
    
    // Link
    var gl = this.context.gl;
    var glProgram = this.glProgram;
    gl.linkProgram(glProgram);

    // Check for errors
    if ( !gl.getProgramParameter(glProgram, gl.LINK_STATUS) && !gl.isContextLost() ) {
        Namespace.Logger.Report("ShaderProgram.compile: " +  this.name + " link error(s):\n" + gl.getProgramInfoLog(glProgram) , Sev.Error); 
    }	
    else 
    {
        // Cache info about the program's uniforms and attributes, for quick access later.
        var i;
        var numUniforms = gl.getProgramParameter(glProgram, gl.ACTIVE_UNIFORMS);
        for (i = 0; i < numUniforms; ++i) {
            var u = gl.getActiveUniform(glProgram, i);
            var name = (u.name.lastIndexOf('[0]') == u.name.length-3) ? u.name.slice(0,-3) :  u.name;
            this.uniforms[name] = {index:i, type:u.type, size:u.size, loc:gl.getUniformLocation(glProgram, u.name)};
        }    

        var numAttributes = gl.getProgramParameter(glProgram, gl.ACTIVE_ATTRIBUTES);
        for (i = 0; i < numAttributes; ++i) {
            var a = gl.getActiveAttrib(glProgram, i);
            this.attributes[a.name] = {index:i, type:a.type, size:a.size, loc:gl.getAttribLocation(glProgram, a.name), attrBuffer:null, bufferOffset:0};
        }
        this.isCompiled = true;  

        // Once the program is linked, the GL shaders can be deleted
        gl.detachShader(glProgram, this.vShader.glShader);
        gl.detachShader(glProgram, this.fShader.glShader);
        gl.deleteShader(this.vShader.glShader);
        gl.deleteShader(this.fShader.glShader);
        this.vShader.glShader = null;
        this.fShader.glShader = null;
    }
};


/**
 * Sets the value of a uniform variable.
 * 
 * @param {string} name - The name of the variable to set.
 * @param {number} val - The value to set.
 * @param {Boolean} [lenient=true] - Whether to silently ignore unrecognized variable names.
 */
Namespace.ShaderProgram.prototype.setUniform = function(name, val, lenient)
{
    // In order to set a uniform, this program must be WebGL's current program
    this.context.setCurrentProgram(this);

    // Get the appropriate setter function for the given variable name
    if (name.lastIndexOf('[0]') == name.length-3) { name = name.slice(0,-3); }
    var uni = this.uniforms[name];
    if (uni) {
        var loc = uni.loc;
        var setterFunc = this.context.uniformSetters[uni.type];
        if (loc && setterFunc) {
            setterFunc(loc, val);
        }
    } 
    else { 
        if ( (typeof(lenient) !== 'undefined') && !lenient ) {
            Namespace.Logger.Report("ShaderProgram.setUniform: Unrecognized uniform: " + name, Sev.Warn);
        }
    }
};


/**
 * Sets multiple uniform values.
 * 
 * @param {Array} uniforms - An object whose properties are the uniform names and values to set.
 * @param {Boolean} [lenient=true] - Whether to silently ignore unrecognized variable names.
 */
Namespace.ShaderProgram.prototype.setUniforms = function(uniforms, lenient)
{
    for (var name in uniforms) {
        if (uniforms.hasOwnProperty(name)) {
            this.setUniform(name, uniforms[name], lenient);
        }
    }
};


/**
 * Gets the value of a uniform variable.
 * Note: This method can be slow, because it requires communication with the GPU.
 *
 * @param {string} name - The name of the variable to get.
 * @param {number} [index] - The index of the array element to get. (Only required when the
 *   named variable is an array.)
 */
Namespace.ShaderProgram.prototype.getUniform = function(name, index)
{
    // In order to get a uniform, this program must be WebGL's current program
    this.context.setCurrentProgram(this);

    var gl = this.context.gl;
    var uni = this.uniforms[name];
    if (!uni) { return null; }

    if (index === undefined) {
        return gl.getUniform(this.glProgram, uni.loc);
    } 
    else {
        var loc = gl.getUniformLocation(this.glProgram, name + '[' + index.toString() + ']');
        return loc ? gl.getUniform(this.glProgram, loc) : null;        
    }
};


/**
 * Checks whether the program has an active uniform with a given name.
 *
 * @param {string} name - The name of the uniform to check for.
 * @return {Boolean} True if the program has an active uniform with the given name, otherwise false.
 */
Namespace.ShaderProgram.prototype.hasUniform = function(name)
{
    if (name.lastIndexOf('[0]') == name.length-3) { name = name.slice(0,-3); }
    return this.uniforms.hasOwnProperty(name);
};


/**
 * Sets a vertex-attribute buffer.
 * 
 * @param {string} name - The name of the vertex attribute.
 * @param {AttributeBuffer} attrBuffer - An AttributeBuffer containing the vertex-attribute values.
 * @param {Boolean} [bind=true] - Whether to bind the buffer in WebGL.
 * @param {number} [bufferOffset=0] - The offset in bytes to the first component in the buffer.
 */
Namespace.ShaderProgram.prototype.setAttribute = function(name, attrBuffer, bind=true, bufferOffset=0)
{
    if (this.attributes[name]) 
    {
        // Cache the buffer object
        this.attributes[name].attrBuffer = attrBuffer;
        this.attributes[name].bufferOffset = bufferOffset;
        this.numVertices = (attrBuffer.numBytes - bufferOffset)/attrBuffer.bytesPerVertex;
        if (bind) { this.bindAttributes([name]); }
    }
    else {
        Namespace.Logger.Report("ShaderProgram.setAttribute: Unrecognized attribute: " + name, Sev.Error);   
    }
};


/**
 * Binds the program's vertex attribute arrays in WebGL.
 * 
 * @param {Array} [names=empty] - The names of the attributes to bind. If null or emoty, then all attributes will be bound.
 */
Namespace.ShaderProgram.prototype.bindAttributes = function(names=[])
{
    names = names || [];
    var gl = this.context.gl;
    for (var attrName in this.attributes) {
        if (this.hasAttribute(attrName)) {
            if ((names.length === 0) || (names.indexOf(attrName) >= 0)) { 
                var a = this.attributes[attrName];
                if (a.attrBuffer) {
                    var stride = 0;
                    gl.bindBuffer(gl.ARRAY_BUFFER, a.attrBuffer.glBuffer);
                    gl.enableVertexAttribArray(a.loc);
                    gl.vertexAttribPointer(a.loc, a.attrBuffer.attrDim, a.attrBuffer.dataType, a.attrBuffer.normalizeValues, stride, a.bufferOffset);
                } 
            }   
        }
    }  
};


/**
 * Checks whether the program has an attribute with a given name.
 *
 * @param {string} name - The name of the attribute to check for.
 * @return {Boolean} True if the program has an attribute with the given name, otherwise false.
 */
Namespace.ShaderProgram.prototype.hasAttribute = function(name)
{
    return this.attributes.hasOwnProperty(name);
};


/**
 * Sets an index buffer for the program.
 * 
 * @param {IndexBuffer} buffer - An IndexBuffer object, or null.
 */
Namespace.ShaderProgram.prototype.setIndexBuffer = function(buffer)
{
    // Cache the buffer
    this.indexBuffer = buffer;
};


/**
 * Sets an input texture, or array of input textures.
 * 
 * @param {String} varName - The name of the corresponding sampler in the shader GLSL code.
 * @param {Texture2D|Texture3D|Array} texture - The input texture(s).
 */
Namespace.ShaderProgram.prototype.setInputTexture = function(varName, texture)
{
    if (Array.isArray(texture))
    {
        var txIndices = new Int32Array(texture.length);
        for (var i=0; i<texture.length; i++) { 
            texture[i].bind();
            txIndices[i] = texture[i].txIndex; 
        }
        this.setUniform(varName, txIndices);     
    }
    else if (texture) {
        texture.bind();
        this.setUniform(varName, texture.txIndex); 
    }
    else {
        this.setUniform(varName, -1); 
    }

};



/**
 * Runs the program.
 * 
 * @param {object} [args]
 * @param {Number} [args.numVertices=all] - The number of vertices to draw. 
 * @param {Number} [args.firstVertex=0] -  The index of the first vertex to draw.
 * @param {Color} [args.clearColor=Black] - The background color to use. 
 * @param {Boolean} [args.clear=true] - Whether to clear the canvas before drawing. 
 * @param {GLEnum} [args.drawMode=gl.TRIANGLES] - The GL drawing mode.
 * @param {FrameBuffer} [args.target=null] - The rendering target (defaults to gl.canvas).
 * @param {Array} [args.viewport=(0,0,w,h)] - The sub-area of the target to render into.
 */
Namespace.ShaderProgram.prototype.draw = function(args) 
{
    // Get render options
    var gl           = this.context.gl;
    var numVertices  = this.indexBuffer ? this.indexBuffer.numIndices : this.numVertices;
    var firstVertex  = 0;
    var clear        = true;
    var clearColor   = [0,0,0,1]; // black
    var drawMode     = gl.TRIANGLES;
    var renderTarget = null; // null means "render to canvas"
    var vp           = [0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight];

    if (args)
    {
        if ( typeof args.numVertices !== 'undefined' ) { numVertices = args.numVertices; }
        if ( typeof args.firstVertex !== 'undefined' ) { firstVertex = args.firstVertex; }
        if ( typeof args.clear       !== 'undefined' ) { clear = args.clear; }
        if ( typeof args.clearColor  !== 'undefined' ) { clearColor =  Namespace.Color.ScaleTo1(args.clearColor); }
        if ( typeof args.drawMode    !== 'undefined' ) { drawMode = args.drawMode; }
        if ( typeof args.target      !== 'undefined' ) { renderTarget = args.target; }
        if ( typeof args.viewport    !== 'undefined' ) { vp = args.viewport; }
    }   
    
    // Set the render target
    gl.bindFramebuffer(gl.FRAMEBUFFER, (renderTarget ? renderTarget.glFrameBuffer : null));

    // Draw
    this.context.setCurrentProgram(this);
    gl.viewport(vp[0], vp[1], vp[2], vp[3]);
    if (clear) { 
        gl.clearColor( clearColor[0], clearColor[1], clearColor[2], clearColor[3] );
        gl.clear(gl.COLOR_BUFFER_BIT); 
    }
    if (this.indexBuffer) {
        this.indexBuffer.bind();
        gl.drawElements(drawMode, numVertices, this.indexBuffer.dataType, firstVertex*this.indexBuffer.elemSize);
    } else {
        gl.drawArrays(drawMode, firstVertex, numVertices);
    }
};
                

})( window.BigLime = window.BigLime || {} );









;(function(Namespace, undefined) {
    "use strict";
    var vec3 = glMatrix.vec3;

/**
 * @category 3D
 * @classdesc
 * This class provides methods for creating basic shapes, represented as vertex lists.
 * 
 * @constructor
 */
Namespace.Shapes3D = function(){};


/** 
 * Creates an axis-aligned cube.
 * @static
 * @param {Number} size - The length of the cube sides. 
 * @param {vec3} center=[0,0,0] - The location of the cube center.
 * @param {Array} faceColors - The colors of each face of the cube.
 */
Namespace.Shapes3D.Cube = function(size, center, faceColors) 
{
    // Build the vertex buffer
    center = center || [0,0,0];
    var s = size/2;
    var vbuf = [
        -s,-s,-s, +s,-s,-s, -s,+s,-s,   -s,+s,-s, +s,-s,-s, +s,+s,-s,
        +s,-s,-s, +s,-s,+s, +s,+s,-s,   +s,+s,-s, +s,-s,+s, +s,+s,+s,
        -s,+s,-s, +s,+s,-s, -s,+s,+s,   -s,+s,+s, +s,+s,-s, +s,+s,+s,
        -s,-s,+s, -s,+s,+s, +s,-s,+s,   -s,+s,+s, +s,+s,+s, +s,-s,+s,
        -s,-s,-s, -s,+s,-s, -s,-s,+s,   -s,+s,-s, -s,+s,+s, -s,-s,+s,
        -s,-s,-s, -s,-s,+s, +s,-s,-s,   -s,-s,+s, +s,-s,+s, +s,-s,-s
    ];
    for (var i=0; i<vbuf.length; i++) { vbuf[i] += center[i%3]; }

    if ( !faceColors || !faceColors.length ) {
        return vbuf;
    }

    // Build the color buffer
    var cbuf = [];
    for (var f=0; f<6; f++) {
        var col = faceColors[f%(faceColors.length)];
        if (typeof col == 'string') { col = Namespace.Color.FromName(col, true); }
        for (var j=0; j<18; j++) { cbuf.push(col[j%3]); } 
    }
    
    return {vertices:vbuf, colors:cbuf};
};


/** 
 * Creates a rectangle.
 * @static
 * @param {Number} width - The width of the rectangle.
 * @param {Number} height - The height of the rectangle.
 * @param {vec3} center=[0,0,0] - The center of the rectangle.
 * @param {vec3} rowDir=[1,0,0] - The rectangle's horizontal direction.
 * @param {vec3} colDir=[0,1,0] - The rectangle's vertical direction.
 * @param {Color} color - The rectangle's color.
 */
Namespace.Shapes3D.Rectangle = function(width, height, center, rowDir, colDir, color) 
{
    // Build the vertex buffer
    var vbuf = [];
    center = center || [0,0,0];
    rowDir = rowDir || [1,0,0];
    colDir = colDir || [0,1,0];
    vec3.normalize(rowDir, rowDir);
    vec3.normalize(colDir, colDir);
    var hw = width/2;
    var hh = height/2;
    var corner = [0,0,0];

    vec3.scaleAndAdd(corner, vec3.scaleAndAdd(corner, center, rowDir, -hw), colDir, -hh);
    vbuf = vbuf.concat(corner);
    vec3.scaleAndAdd(corner, vec3.scaleAndAdd(corner, center, rowDir,  hw), colDir, -hh);
    vbuf = vbuf.concat(corner);
    vec3.scaleAndAdd(corner, vec3.scaleAndAdd(corner, center, rowDir,  hw), colDir,  hh);
    vbuf = vbuf.concat(corner);
    vec3.scaleAndAdd(corner, vec3.scaleAndAdd(corner, center, rowDir, -hw), colDir, -hh);
    vbuf = vbuf.concat(corner);
    vec3.scaleAndAdd(corner, vec3.scaleAndAdd(corner, center, rowDir,  hw), colDir,  hh);
    vbuf = vbuf.concat(corner);
    vec3.scaleAndAdd(corner, vec3.scaleAndAdd(corner, center, rowDir, -hw), colDir,  hh);
    vbuf = vbuf.concat(corner);

    if ( !color ) { return vbuf; }

    // Build the color buffer
    var cbuf = [];
    if (typeof ccolorol == 'string') { color = Namespace.Color.FromName(color, true); }    
    for (var j=0; j<18; j++) { cbuf.push(color[j%3]); } 
    
    return {vertices:vbuf, colors:cbuf};
};


})( window.BigLime = window.BigLime || {} );









;(function(Namespace, undefined) {
    "use strict";
    var vec3 = glMatrix.vec3;
    var mat4 = glMatrix.mat4;
    

/**
 * @category 3D
 * @classdesc
 * This class represents a rectangular clipping box, that can be used to mask-out a portion of a volume.
 * 
 * @constructor
 * @param {VolumeT2|VolumeT3} [vol] - The volume that the slab is associated with.
 * @param {vec3} [center=vol.shape/2] - The slab center. (In cubic-voxel coordinates with origin at 
 *   the upper-left-front corner, so a slab that just fits the entire volume has center = vol.shape/2 
 *   and dimensions = vol.shape.)
 * @param {vec3} [dimensions=vol.shape] - The lengths of the slab sides, cubic-voxel units
 * @param {mat4} [orientation=Identity matrix] - The slab orientation, as a rotation matrix.
 */
Namespace.Slab = function (vol, center, dimensions, orientation) 
{ 
    // Initialize members
    this.vol    = vol;
    this.center = center ? vec3.clone(center) : vec3.scale(vec3.create(), vol.shape, 0.5);
    this.shape  = dimensions ? vec3.clone(dimensions) : vec3.clone(vol.shape);
    this.orient = orientation ? mat4.clone(orientation) : mat4.create();
};


/**  
 * Creates a copy of the slab.
 * 
 */
Namespace.Slab.prototype.clone = function () 
{
    return new Namespace.Slab(this.vol, this.center, this.shape, this.orient);
};


/**  
 * Copies settings from another slab
 * 
 */
Namespace.Slab.prototype.updateFrom = function (src) 
{
    vec3.copy(this.center, src.center);
    vec3.copy(this.shape, src.shape);
    mat4.copy(this.orient, src.orient);
};


/**
 * Resets the slab to its default state.
 * 
 */
Namespace.Slab.prototype.reset = function () 
{
    vec3.scale(this.center, this.vol.shape, 0.5);
    vec3.copy(this.shape, this.vol.shape);
    mat4.identity(this.orient);
};


/**
 * Returns the slab corners, in texture coordinates.
 *
 */
Namespace.Slab.prototype.getVerticesTx = function() 
{ 
    var [w, h, d] = this.shape; 
    var middle = [w/2, h/2, d/2];   

    // Compute the corner points
    var vertices = [ [0,0,0], [w,0,0], [0,h,0], [w,h,0], [0,0,d], [w,0,d], [0,h,d], [w,h,d] ].map( 
        function(v) { 
            var corner = vec3.subtract(vec3.create(), v, middle); // Shift middle of slab to origin 
            vec3.transformMat4(corner, corner, this.orient); // Rotate
            vec3.add(corner, corner, this.center); // Shift middle of slab to slab.center
            return vec3.divide(corner, corner, this.vol.shape); // Scale by the volume shape
        }.bind(this)
    );

    return vertices;
};


})( window.BigLime = window.BigLime || {} );








;(function(Namespace, undefined) {
    "use strict";
    var Sev = Namespace.Logger.Severity;
  
    
/**
 * @category 3D
 * @classdesc
 * The Texture2D class is a wrapper around a WebGL TEXTURE_2D object.
 * 
 * @constructor
 * @param {GLContext} context - A rendering context.
 * @param {Number} txIndex - The WebGL texture index. Must be in the range [0, gl.MAX_TEXTURE_IMAGE_UNITS-1].
 * @param {Number} width - The desired width of the texture.
 * @param {Number} height - The desired height of the texture.
 * @param {GLenum} pixeltype - The pixel type (gl.RGB, gl.RGBA, gl.ALPHA, etc).
 * @param {GLenum} interpType - The interpolation type (gl.LINEAR or gl.NEAREST)
 */
Namespace.Texture2D = function(context, txIndex, width, height, pixelType, interpType) 
{ 
    // Initialize members    
    this.context    = context;      
    this.txIndex    = txIndex;
    this.width      = Math.round(width);
    this.height     = Math.round(height);
    this.pixelType  = pixelType;
    this.interpType = interpType;
    this.glTexture  = null;    
    this.is3D       = false;

    // Check the input
    var gl = this.context.gl;
    if ( (txIndex < 0) || (txIndex >= gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS)) ) {
        Namespace.Logger.Report("Texture2D.ctor: Invalid texture index.", Sev.Error); 
        return;        
    }
    
    if ( (this.width <= 0) || (this.height <= 0) ) {
        Namespace.Logger.Report("Texture2D.ctor: Texture size cannot be zero.", Sev.Error); 
        return;        
    }

    var maxSize = this.context.GlMaxTextureSize;
    if ( (this.width > maxSize) || (this.height > maxSize) ) {
        Namespace.Logger.Report('Texture2D.ctor: The requested texture size is too large.', Sev.Error);
        return;
    }   

    // Create the GL texture object
    this.glTexture = gl.createTexture();
    this.bind(); 
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, this.interpType);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, this.interpType);    
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);       
    gl.texImage2D(gl.TEXTURE_2D, 0, this.pixelType, this.width, this.height, 0, this.pixelType, gl.UNSIGNED_BYTE, null);
};


/**
 * Destructor.
 * 
 */
Namespace.Texture2D.prototype.destroy = function() 
{ 
    // Check if we are already destroyed
    if (!this.context) { return; } 

    var gl = this.context.gl;
    this.bind();
    gl.texImage2D(gl.TEXTURE_2D, 0, this.pixelType, 1, 1, 0, this.pixelType, gl.UNSIGNED_BYTE, null);

    this.unbind();
    gl.deleteTexture(this.glTexture);
    this.glTexture = null;
    this.context = null;
};


/**
 * Binds the texture to its attachment point in WebGL.
 * 
 */
Namespace.Texture2D.prototype.bind = function() 
{ 
    this.context.bindTexture(this);
};


/**
 * Un-binds the texture from its attachment point in WebGL.
 * 
 */
Namespace.Texture2D.prototype.unbind = function() 
{ 
    this.context.unbindTexture(this);
};


/**
 * Sets the texture's interpolation type.
 * 
 * @param {GLenum} interpType - The interpolation type to set.
 */
Namespace.Texture2D.prototype.setInterpType = function(interpType) 
{ 
    if (this.interpType == interpType) { return; }
    
    this.bind();
    var gl = this.context.gl;
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, interpType);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, interpType);  
    this.interpType = interpType;
};


/**
 * Checks the Texture's size.
 * 
 * @param {Number} width - The width value to compare with.
 * @param {Number} height - The height value to compare with.
 * @return {Boolean} True if the texture's dimensions are equal to (width, height), otherwise false.
 */
Namespace.Texture2D.prototype.sizeEquals = function(width, height) 
{ 
    return ( (this.width == width) && (this.height == height) );
};


/**
 * Resizes the Texture.
 * 
 * @param {Number} newWidth - The desired new width of the texture.
 * @param {Number} newHeight - The desired new height of the texture.
 */
Namespace.Texture2D.prototype.resize = function(newWidth, newHeight) 
{ 
    // Check the input
    newWidth  = Math.round(newWidth);
    newHeight = Math.round(newHeight);
    if ( (newWidth <= 0) || (newHeight <= 0) ) {
        Namespace.Logger.Report("Texture2D.resize: Texture size cannot be zero.", Sev.Error); 
        return;        
    }

    var maxSize = this.context.GlMaxTextureSize;
    if ( (newWidth > maxSize) || (newHeight > maxSize) ) {
        Namespace.Logger.Report('Texture2D.resize: Requested texture size is not supported on this device.', Sev.Error);
        return;
    }  

    var gl = this.context.gl;
    this.bind();
    gl.texImage2D(gl.TEXTURE_2D, 0, this.pixelType, newWidth, newHeight, 0, this.pixelType, gl.UNSIGNED_BYTE, null);
    this.width  = newWidth;
    this.height = newHeight;
};


})( window.BigLime = window.BigLime || {} );







;(function(Namespace, undefined) {
    "use strict";
    var Sev = Namespace.Logger.Severity;
    
    
/**
 * @category 3D
 * @classdesc
 * The Texture3D class is a wrapper around a WebGL TEXTURE_3D object.
 * 
 * @constructor
 * @param {GLContext} context - A rendering context.
 * @param {Number} txIndex - The WebGL texture index. Must be in the range [0, gl.MAX_TEXTURE_IMAGE_UNITS-1].
 * @param {Number} width - The desired width of the texture.
 * @param {Number} height - The desired height of the texture.
 * @param {Number} depth - The desired depth of the texture.
 * @param {GLenum} pixeltype - The pixel type (gl.R8, gl.RG8, gl.RGB8, gl.RGBA8, etc).
 * @param {GLenum} interpType - The interpolation type (gl.LINEAR or gl.NEAREST)
 */
Namespace.Texture3D = function(context, txIndex, width, height, depth, pixelType, interpType) 
{ 
    this.context    = context;  
    this.txIndex    = txIndex;
    this.width      = Math.round(width);
    this.height     = Math.round(height);
    this.depth      = Math.round(depth);
    this.pixelType  = pixelType;
    this.interpType = interpType;
    this.glTexture  = null;
    this.is3D       = true;

    // Check the input
    if ( (this.width <= 0) || (this.height <= 0) || (this.depth <= 0) ) {
        Namespace.Logger.Report("Texture3D.ctor: Invalid dimensions.", Sev.Error);
        return;        
    }
    var gl = this.context.gl;
    if ( (txIndex < 0) || (txIndex >= gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS)) ) {
        Namespace.Logger.Report("Texture3D.ctor: Invalid texture index.", Sev.Error);
        return;        
    }
    
    // Create the GL texture object
    this.glTexture = gl.createTexture();
    this.bind(); 
    gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MIN_FILTER, this.interpType);
    gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MAG_FILTER, this.interpType);    
    gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_R, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);       
    gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);       
    gl.texStorage3D(gl.TEXTURE_3D, 1, this.pixelType, this.width, this.height, this.depth);
};


/**
 * Destructor.
 * 
 */
Namespace.Texture3D.prototype.destroy = function() 
{ 
    // Check if we are already destroyed
    if (!this.context) { 
        return; 
    } 

    var gl = this.context.gl;
    this.unbind();
    gl.deleteTexture(this.glTexture);
    this.glTexture = null;
    this.context = null;
};


/**
 * Binds the texture to its attachment point in WebGL.
 * 
 */
Namespace.Texture3D.prototype.bind = function() 
{ 
    this.context.bindTexture(this);
};


/**
 * Un-binds the texture from its attachment point in WebGL.
 * 
 */
Namespace.Texture3D.prototype.unbind = function() 
{ 
    this.context.unbindTexture(this);
};


/**
 * Sets the texture's interpolation type.
 * 
 * @param {GLenum} interpType - The interpolation type to set.
 */
Namespace.Texture3D.prototype.setInterpType = function(interpType) 
{ 
    if (this.interpType == interpType) { return; }
    
    this.bind();
    var gl = this.context.gl;
    gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MIN_FILTER, interpType);
    gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MAG_FILTER, interpType);
    this.interpType = interpType;
};


/**
 * Checks the Texture's size.
 * 
 * @param {Number} width - The width value to compare with.
 * @param {Number} height - The height value to compare with.
 * @param {Number} depth - The depth value to compare with.
 * @return {Boolean} True if the texture's dimensions are equal to (width, height, depth), otherwise false.
 */
Namespace.Texture3D.prototype.sizeEquals = function(width, height, depth) 
{ 
    return ( (this.width == width) && (this.height == height) && (this.depth == depth) );
};


})( window.BigLime = window.BigLime || {} );







;(function(Namespace, undefined) {
    "use strict";


/**
 * @category 3D
 * @classdesc
 * This class implements a dialog for adjusting 3D rendering parameters.
 * 
 * @constructor
 * @param {HTMLElement} parent - A parent html element for the dialog.
 * @param {GLContext} ctx - The 3D rendering context.
 * @param {Object} [options] - Optional parameters.
 * 
 */
Namespace.ThreeDControls = function(parent, ctx, options) 
{
    this.options = options || {};
    this.tabs = [];
    this.pages = [];
    this.renderParams = new Namespace.RenderParams();

    // Inherit from Dialog
    this.contentWidth = this.options.width ||640;
    this.contentHeight = this.options.minimal ? 440 : 585;
    var dlgWidth = this.contentWidth + 'px';
    var dlgHeight = this.contentHeight + 32 + 'px';
    Namespace.Dialog.call(this, {parent:parent, title:this.options.title || "3D Controls", 
        width:dlgWidth, height:dlgHeight, bkgndColor:'#cdb79a', titleBarColor:'#cdb79a',
        borderWidth:options.borderWidth, borderColor:options.borderColor});

    // Set our content in the dialog
    this.setContent(this._createContentDiv(ctx))
};
Namespace.ThreeDControls.prototype = Object.create(Namespace.Dialog.prototype);
Namespace.ThreeDControls.prototype.constructor = Namespace.ThreeDControls;  


/**
 * Sets the RenderParams that the controls will manage.
 * 
 * @param {RenderParam} rp - The rendering parameters.
 * 
 */
Namespace.ThreeDControls.prototype.setRenderParams = function(rp)
{
    this.renderParams = rp;
    this.syncWith(rp);
};


/**
 * Sets the control's screen location.
 * 
 * @param {Number} x - The horizontal screen location.
 * @param {Number} y - The vertical screen location .
 * 
 */
Namespace.ThreeDControls.prototype.setPosition = function(x,y)
{
    Namespace.Ui.StyleElement(this.mainDiv, {left:x, top:y});
};


/**
 * Builds the user interface.
 * @param {GLContext} ctx - The 3D rendering context.
 * 
 * @private
 * 
 */
Namespace.ThreeDControls.prototype._createContentDiv = function(ctx)
{
    // Layout params
    var width      = this.contentWidth;
    var height     = this.contentHeight;
    var tabWidth   = 100;
    var tabHeight  = 40;
    var lineWidth  = 2;
    var pageHeight = height - tabHeight - lineWidth;

    // Create a content div to hold everything
    var Ui = Namespace.Ui;
    var contentDiv = Ui.CreateElement('div', '3dcon_contentdiv', null, {width:width, height:height, userSelect:'none'});

    // Create the tab pages
    var pageNames = this.options.minimal ? ['Opacity', 'Lights'] : ["Main", "Lights", "Misc"];
    var tabList = Ui.CreateElement('ul', '3dcon_tablist', contentDiv, {width:width, height:height, listStyle:'none'} );
    for (var i=0; i<pageNames.length; i++) 
    {
        var is = i.toString();
        var lw = lineWidth.toString() + 'px ';
        var tab = Ui.CreateElement('li', 'tablistitem', tabList, null, {dataTab:is});
        Ui.StyleElement(tab, {width:tabWidth, height:tabHeight, left:(tabWidth+lineWidth)*i, top:0, textAlign:'center', 
            verticalAlign:'middle', lineHeight:tabHeight, borderColor:'gray', borderStyle:'solid', borderWidth:lw + lw + '0px 0px',
            backgroundColor:(i === 0 ? '#e5cfb2' : '#cdb79a')}); 
        tab.innerHTML = pageNames[i];
        this.tabs.push(tab);

        var tabPage = Ui.CreateElement('div', '3dcon_tabpage' + is, contentDiv, {width:width, height:pageHeight, left:0, 
            top:height-pageHeight, display:(i === 0 ? 'inherit': 'none'), backgroundColor:'#e5cfb2'});
        this.pages.push(tabPage);
    }

    // Add tab-click callbacks
    var self = this;
    var onTabClick = function() {
        var clickedTabId = parseInt( this.dataTab );
        for (var j=0; j<pageNames.length; j++) {
            if (j === clickedTabId) {
                Ui.StyleElement( self.pages[j], {display:'inherit'} );
                Ui.StyleElement( self.tabs[j], {backgroundColor:'#e5cfb2'} );
            } else {
                Ui.StyleElement( self.pages[j], {display:'none'} );
                Ui.StyleElement( self.tabs[j], {backgroundColor:'#cdb79a'} );
            }
        }
    };
    for (var j=0; j<pageNames.length; j++) { this.tabs[j].addEventListener('click', onTabClick); }

    // Layout the individual pages
    this._createMainPage( this.pages[0] );
    if (pageNames.length > 1) { this._createLightingPage( this.pages[1], width, pageHeight); }
    if (pageNames.length > 2) { this._createMiscPage( this.pages[2], width, pageHeight, ctx ); }

    return contentDiv;
};


/**
 * Builds the Main controls page.
 * 
 * @param {HTMLElement} parent - The parent element for the page.
 * @private
 */
Namespace.ThreeDControls.prototype._createMainPage = function(parent)
{
    // Layout params
    var width  = parseFloat(parent.style.width);
    var height = parseFloat(parent.style.height);
    var opHeight = this.options.minimal ? 350 : 300;
    var btnSize  = 26;
    var fontSize = 16;
    var gPadding = 24;

    // Create a main div to hold everything
    var Ui = Namespace.Ui;
    var mainDiv = Ui.CreateElement('div', '3dcon_mainpage_div', parent, {width:width, height:height, fontSize:fontSize} );
     
    // Create and configure an opacity control
    this.opacityControl = new Namespace.OpacityControl(width-2*gPadding, opHeight);
    Ui.StyleElement(this.opacityControl.mainDiv, {left:gPadding, top:gPadding});
    mainDiv.append(this.opacityControl.mainDiv);
    this.opacityControl.addEventListener('opacity-change-start opacity-change opacity-change-end', 
        function(event) { this.trigger(event.type, event.detail); }.bind(this));

    if (!this.options.minimal)
    {
        // Mode selector
        var hideSlabGroup = this.options && this.options.hideSlabGroup;
        var top = opHeight + 2*gPadding;
        var modeSelWidth = hideSlabGroup ? 180 : 120;
        var btnInfo = Ui.CreateButtonGroup("3dcon_mode", mainDiv,
            {width:modeSelWidth, height:170, left:gPadding, top:top, fontSize:fontSize}, 
            [ 
                {label:'MIP', value:'mip', checked:true},
                {label:'VR', value:'vr'}
            ],
            function(e){ this.trigger('mode-change', {mode:e.target.value}); }.bind(this),
            {btnSize:btnSize, btnLeft:(hideSlabGroup ? 50 : 0)}
        );
        this.mipModeBtn = btnInfo.btns[0];
        this.vrModeBtn = btnInfo.btns[1];

        // Slab options
        var slabGroup = Ui.CreateButtonGroup( "3dcon_slab", mainDiv,
            {width:170, height:170, left:gPadding+140, top:top, fontSize:fontSize}, 
            [   
                {label:'Show Marker', value:'show-marker-change', checked:true},
                {label:'Show slab', value:'show-slab-change'}, 
                {label:'Clip to slab', value:'clip-to-slab-change'}
            ],
            function(e){ this.trigger(e.target.value, {val:e.target.checked}); }.bind(this),
            {btnSize:btnSize, independent:true}
        );
        this.showMarkerBtn = slabGroup.btns[0];
        this.showSlabBtn = slabGroup.btns[1];
        this.clipToSlabBtn = slabGroup.btns[2];
        slabGroup.btns[1].addEventListener('dblclick', function(){ this.trigger('reset-slab-request'); }.bind(this));
        if (hideSlabGroup) { slabGroup.div.style.display = 'none'; }

        // Perspective control
        var div3Width = hideSlabGroup ? 300 : 180;
        var ctrlLeft = hideSlabGroup ? 43 : 15;
        var div3 = Ui.CreateElement('div', '3dcon_persp', mainDiv, {width:div3Width, height:170, top:top, right:gPadding, border:'1px solid #606060'} );


        var perspInput = this.perspInput = Ui.CreateElement('select', '3dcon_perspsel', div3, {top:21, left:ctrlLeft, height:30, width:100, fontSize:fontSize} );  
        Ui.CreateElement('option', '3dcon_perspsel_0', perspInput, {}, {value:0, text:'Off'});
        Ui.CreateElement('option', '3dcon_perspsel_0', perspInput, {}, {value:1, text:'Low'}); 
        Ui.CreateElement('option', '3dcon_perspsel_2', perspInput, {}, {value:3, text:'Medium'}); 
        Ui.CreateElement('option', '3dcon_perspsel_3', perspInput, {}, {value:8, text:'High'}); 
        perspInput.value = 0;    
        perspInput.addEventListener('change', function(){this.trigger('persp-change', {val:parseInt(perspInput.value)}); }.bind(this));
        Ui.CreateElement('label', '3dcon_persp_label', div3, {left:ctrlLeft+110, top:25}, {innerHTML:'Perspective'} );  

        this.saveSettingsBtn = Ui.CreateSaveFileButton({id:'3dcon_savesettings_btn', parent:div3, text:'Save Settings', flatStyle:false, 
            dbTag:'threedControlsSaveSettings', suggestedName:"Settings.txt", callback:this._onSaveSettings.bind(this),
            styles:{width:210, height:30, top:72, left:ctrlLeft, fontSize:fontSize-2}} );  

        this.loadSettingsBtn = Ui.CreateLoadFileButton({id:'3dcon_loadsettings_btn', parent:div3, text:'Load Settings', flatStyle:false, 
            dbTag:'threedControlsLoadSettings', multiple:false, callback:this._onLoadSettings.bind(this), 
            styles:{width:210, height:30, top:122, left:ctrlLeft, fontSize:fontSize-2}} );
    }       
};


/**
 * Builds the Lighting controls page.
 * 
 * @param {HTMLElement} parent - The parent element for the page.
 * @param {*} width 
 * @param {*} height
 * @private 
 */
Namespace.ThreeDControls.prototype._createLightingPage = function(parent, width, height)
{
    // Layout params
    var fontSize = 16;
    var hMargin = 32;

    // Create a main div to hold everything
    var Ui = Namespace.Ui;
    var mainDiv = Ui.CreateElement('div', '3dcon_page_div', parent, {width:width, height:height-30, top:30, fontSize:fontSize} );

    // Create a slider for adjusting the ambient-light strength
    this.ambientSlider = Ui.CreateHSlider( "3dcon_ambient", mainDiv,
        {styles:{width:width-2*hMargin, height:50, left:hMargin, top:0}, props:{}}, // Container div
        {styles:{}, props:{min:0, max:200, value:50, valueScale:0.01}}, // Slider
        {styles:{width:80}, props:{innerHTML:'Ambient'}}, // Label
        {styles:{width:60}, props:{}}, // Value text
        function(val) { this.renderParams.lightSet.ambientLight = val; this.trigger('change'); }.bind(this),
        function()  { this.trigger('change-start'); }.bind(this),
        function() { this.trigger('change-end'); }.bind(this)
    );

    // Create a dropdown for selecting which light to edit 
    Ui.CreateElement( 'label', '3dcon_lightsel_label', mainDiv, {left:hMargin, top:115}, {innerHTML:'Light #'} );
    var lightSel = this.lightSel = Ui.CreateElement( 'select', '3dcon_lightsel_inp', mainDiv, {top:110, left:hMargin+80, height:30, width:70} );  
    Ui.CreateElement('option', '3dcon_lightsel_1', lightSel, {}, {value:0, text:'1'});
    Ui.CreateElement('option', '3dcon_lightsel_2', lightSel, {}, {value:1, text:'2'}); 
    lightSel.value = 0;    
    lightSel.addEventListener('change', function(){
        var light = this.renderParams.lightSet.dirLights[this.lightSel.value];
        this.diffuseSlider.value = Math.round( 100 * light.diffuse );
        this.shadowsSlider.value = Math.round( 100 * light.shadowDarkness );
        this.specExpSlider.value = Math.round( 100 * Math.log2(light.specExp) ); 
        this.specStrengthSlider.value = Math.round( 100 * light.specStrength );
        this.shadowsSlider.value = Math.round( 100 * light.shadowDarkness );
    }.bind(this));

    // Create a slider for the diffuse-light strength
    this.diffuseSlider = Ui.CreateHSlider( "3dcon_diffuse", mainDiv,
        {styles:{width:width-300, height:50, left:hMargin, top:150}, props:{}}, // Container div
        {styles:{}, props:{min:0, max:100, value:50, valueScale:0.01}}, // Slider
        {styles:{width:80}, props:{innerHTML:'Diffuse'}}, // Label
        {styles:{width:50}, props:{}}, // Value text
        function(val) { this.renderParams.lightSet.dirLights[lightSel.value].diffuse = val; this.trigger('change'); }.bind(this),
        function()  { this.trigger('change-start'); }.bind(this),
        function() { this.trigger('change-end'); }.bind(this)
    );

    // Create a slider for the specular strength
    this.specStrengthSlider = Ui.CreateHSlider( "3dcon_specstr", mainDiv,
        {styles:{width:width-300, height:50, left:hMargin, top:200}, props:{}}, // Container div
        {styles:{}, props:{min:0, max:100, value:50, valueScale:0.01}}, // Slider
        {styles:{width:80}, props:{innerHTML:'Specular'}}, // Label
        {styles:{width:50}, props:{}}, // Value text
        function(val) { this.renderParams.lightSet.dirLights[lightSel.value].specStrength = val; this.trigger('change'); }.bind(this),
        function()  { this.trigger('change-start'); }.bind(this),
        function() { this.trigger('change-end'); }.bind(this)
    );

    // Create a slider for the specular exponent
    this.specExpSlider = Ui.CreateHSlider( "3dcon_specstr", mainDiv,
        {styles:{width:width-300, height:50, left:hMargin, top:250}, props:{}}, // Container div
        {styles:{}, props:{min:0, max:1000, value:700, decimals: 0, xfrm:function(v){return Math.round(Math.pow(2,v/100));}}}, // Slider
        {styles:{width:80}, props:{innerHTML:'Spec Exp'}}, // Label
        {styles:{width:50}, props:{}}, // Value text
        function(val) { this.renderParams.lightSet.dirLights[lightSel.value].specExp = val; this.trigger('change'); }.bind(this),
        function()  { this.trigger('change-start'); }.bind(this),
        function() { this.trigger('change-end'); }.bind(this)
    );

    // Create a slider for the shadow darkness
    this.shadowsSlider = Ui.CreateHSlider( "3dcon_specstr", mainDiv,
        {styles:{width:width-300, height:50, left:hMargin, top:300}, props:{}}, // Container div
        {styles:{}, props:{min:0, max:150, value:50, valueScale:0.01}}, // Slider
        {styles:{width:80}, props:{innerHTML:'Shadows'}}, // Label
        {styles:{width:50}, props:{}}, // Value text
        function(val) { this.renderParams.lightSet.dirLights[lightSel.value].shadowDarkness = val; this.trigger('change'); }.bind(this),
        function()  { this.trigger('change-start'); }.bind(this),
        function() { this.trigger('change-end'); }.bind(this)
    );

    // Create a light-positioner control
    Ui.CreateElement( 'label', '3dcon_lightpos_label', mainDiv, {right:90, top:95}, {innerHTML:'Light Position'});
    var lpDiv = Ui.CreateElement( 'div', '3dcon_lightpos', mainDiv, {width:240, height:240, top:110, right:15} );
    var lp = this.lightPositioner = new Namespace.LightPositioner(lpDiv);
    lp.addEventListener('change',  function() { this.renderParams.lightSet.dirLights[lightSel.value].dir = lp.getLightDirection(); }.bind(this) );
    lp.addEventListener('changeStart', function(){ this.trigger('change-start')}.bind(this) );
    lp.addEventListener('changeEnd',  function(){ this.trigger('change-end')}.bind(this) );
};



/**
 * Builds the miscellaneous-controls page.
 * 
 * @param {HTMLElement} parent - The parent element for the page.
 * @param {*} width 
 * @param {*} height
 * @param {*} ctx - The rendering context
 * @private 
 */
Namespace.ThreeDControls.prototype._createMiscPage = function(parent, width, height, ctx)
{
    // Create a main div to hold everything
    var Ui = Namespace.Ui;
    var mainDiv = Ui.CreateElement('div', '3dcon_page_div', parent, {width:width, height:height-20, top:20, left:0, fontSize:16} );
    
    // Anti-alias toggle
    var btnInfo = Ui.CreateButtonGroup('3dcon_antialias', mainDiv,
        {width:230, height:80, left:32, top:10, fontSize:16}, 
        [
            {label:'Anti-alias', value:'', checked:true} 
        ],
        function(e){ this.trigger('antialias-change', {val:e.target.checked}); }.bind(this),
        {btnSize: 26, independent:true}
    );
    this.antiAliasBtn = btnInfo.btns[0];

    // Create the interactive-performance selector
    Ui.CreateElement('label', '3dcon_respon_title', mainDiv, 
        {width:200, height:40, top:125, left:32, fontSize:16}, {innerHTML:'Interactive quality'} );
    var btnInfo2 = Ui.CreateButtonGroup( "3dcon_respon", mainDiv,
        {width:230, height:200, left:32, top:150, fontSize:16}, 
        [   
            {label:'1  Highest', value:1}, 
            {label:'2  Medium',  value:0.5, checked:true},
            {label:'3  Lower',   value:0.25},
            {label:'4  Lowest',  value:0.125}
        ],
        function(e){ this.trigger('iqual-change', {val:e.target.value}); }.bind(this),
        {btnSize: 26}
    );
    this.iQualBtns = btnInfo2.btns;

    // Create the speed-test controls
    Ui.CreateElement('label', '3dcon_speedtest_title', mainDiv, {width:160, height:40, bottom:95, left:32, fontSize:16}, {innerHTML:'Speed test'} );
    var stDiv = Ui.CreateElement('div', '3dcon_speedtest', mainDiv, {width:230, height:80, bottom:25, left:32, border:'1px solid #606060'} );
    var fpsLabel = Ui.CreateElement('label', '3dcon_speedtest_fps', stDiv, {width:80, height:40, top:30, left:125, fontSize:16}, {innerHTML:'FPS: 0'} );
    var st_btn = Ui.CreateElement('button', '3dcon_speedtest_btn', stDiv, {width:80, height:40, top:20, left:30, fontSize:16} );
    st_btn.innerHTML = 'Run';
    st_btn.addEventListener('click', function(){ this.trigger('speedtest-toggle', {
        stateChangeCb: function(state) { st_btn.innerHTML = (state == 'started') ? 'Stop' : 'Run'; }.bind(this),
        fpsChangeCb: function(fps) { fpsLabel.innerHTML = 'FPS: ' + (fps ? fps.toFixed(0) : '--'); }.bind(this)
    }); }.bind(this));


    // Info box
    var infoDiv = Ui.CreateElement('div', '3dcon_infobox', mainDiv, 
        {top:10, bottom:25, left:300, right:32, padding:10, border:'1px solid #606060', fontSize:16} ); 
    infoDiv.innerHTML = 
        'GL version: ' + ctx.GlVersionInfo + '<br/><br/>' +
        'Renderer: ' + ctx.RendererInfo  + '<br/><br/>' +
        'App build: ' + Namespace.Utils.getBuildInfo();
};


/**
 * Syncs the UI with the given settings.
 * 
 * @param {RenderParams|Settings} pars - The RenderParams or Settings object to synchronize with.
 * 
 */
Namespace.ThreeDControls.prototype.syncWith = function(pars)
{
    // Rendering mode
    var isVr = (pars.renderType === Namespace.RenderType.VR);

    // Opacity curve
    var opCurve = pars.opacityCurve || Namespace.OpacityCurve.FromString(pars.opacityCurveStr);
    this.opacityControl.setOpacityCurve(opCurve, true);

    // Lights
    var light = pars.lightSet.dirLights[this.lightSel.value];
    this.ambientSlider.value = Math.round( 100 * pars.lightSet.ambientLight );
    this.diffuseSlider.value = Math.round( 100 * light.diffuse );
    this.shadowsSlider.value = Math.round( 100 * light.shadowDarkness );
    this.specExpSlider.value = Math.round( 100 * Math.log2(light.specExp) ); 
    this.specStrengthSlider.value = Math.round( 100 * light.specStrength );
    this.shadowsSlider.value = Math.round( 100 * light.shadowDarkness );

    this.ambientSlider.valLabel.innerHTML = pars.lightSet.ambientLight.toFixed(2);
    this.diffuseSlider.valLabel.innerHTML = light.diffuse.toFixed(2);
    this.specExpSlider.valLabel.innerHTML = light.specExp.toFixed(0);
    this.shadowsSlider.valLabel.innerHTML = light.shadowDarkness.toFixed(2);
    this.specStrengthSlider.valLabel.innerHTML = light.specStrength.toFixed(2);

    this.lightPositioner.setLightDirection(light.dir);

    // Non-minimal controls
    if (!this.options.minimal) {
        this.vrModeBtn.checked = isVr;
        this.mipModeBtn.checked = !isVr;

        // Marker and slab
        if (pars instanceof Namespace.RenderParam) {   
            this.showMarkerBtn.checked = pars.showMarker;
            this.showSlabBtn.checked = pars.showSlab;
            this.clipToSlabBtn.checked = pars.clipToSlab;
        }

        // Perspective
        this.perspInput.value = pars.persp;

        // Misc
        this.antiAliasBtn.checked = pars.antiAlias;
        this.iQualBtns[1].checked = true;
        for (var btn of this.iQualBtns) { 
            if (parseFloat(btn.value) === engine.fastDrawFactor) { 
                btn.checked = true; 
            }
        }
    }
};


/**
 * Save-settings handler. 
 * @private
 *
 */
Namespace.ThreeDControls.prototype._onSaveSettings = function(fileHandle)
{
    this.trigger('save-settings-request', {fileHandle:fileHandle});
};


/**
 * Load-settings handler. 
 * @private
 *
 */
Namespace.ThreeDControls.prototype._onLoadSettings = function(fileHandles)
{
    if (!fileHandles || !fileHandles.length) {
        this.loadSettingsBtn.disabled = false;
        return; 
    }

    // Try to read the settings file
    var fileReader = new FileReader();

    fileReader.onload = function(e){
        this.loadSettingsBtn.disabled = false;
        try {
            var settings = new Namespace.Settings(JSON.parse(e.target.result));
            this.trigger('settings-file-loaded', {val:settings});
        }
        catch (ex) {  
            Namespace.Logger.Report('Failed to read settings file', Namespace.Logger.Severity.Warn, true);
        }
    }.bind(this);

    fileReader.onerror = function() { 
        Namespace.Logger.Report('Failed to read settings file', Namespace.Logger.Severity.Warn, true);
        this.loadSettingsBtn.disabled = false;
    };

    fileHandles[0].getFile()
    .then(
        function(file) { 
            fileReader.readAsText(file); })
    .catch(
        function() {
            this.loadSettingsBtn.disabled = false}.bind(this)
    );
};


/**
 * Attaches an event handler.
 * 
 * @param {String} name - The name of the event.
 * @param {Function} fn - The function to call when the event occurs.
 * 
 */
Namespace.ThreeDControls.prototype.addEventListener = function(eventName, fn)
{
	Namespace.Notifier.prototype.addEventListener.call(this, eventName, fn);
};


/**
 * Removes an event handler.
 * 
 * @param {String} name - The name of the event.
 * @param {Function} fn - The handler function to remove.
 * 
 */
Namespace.ThreeDControls.prototype.removeEventListener = function(eventName, fn)
{
	Namespace.Notifier.prototype.removeEventListener.call(this, eventName, fn);
};


/**
 * Fires a specified event.
 * 
 * @param {String} name - The name of the event to fire.
 * 
 */
Namespace.ThreeDControls.prototype.trigger = function(eventName, args)
{
	Namespace.Notifier.prototype.trigger.call(this, eventName, args);
};


})( window.BigLime = window.BigLime || {} );







;(function(Namespace, undefined) {
    "use strict";
    var vec2 = glMatrix.vec2;
    var vec3 = glMatrix.vec3;
    var mat4 = glMatrix.mat4;


/**
 * @category 3D
 * @classdesc
 * This class implements a VR/MIP viewer.
 * 
 * @constructor
 * @param {HTMLElement} site - The html element that will host the viewer.
 * @param {RenderEngine} [renderEngine] - A rendering engine. If not supplied, one will be created.
 * @param {ThreeDControls} [controller] - A ui object for setting the rendering parameters.
 * @param {Object} [engineOptions] - Options for the created render engine. See RenderEngine docs.
 * @param {Boolean} [autoResize=true] - Whether to resize the raster when the window size changes.
 * @param {Boolean} [omitInteractor=false] - Whether to omit the pose/lighting interactor.
 *
 */
Namespace.ThreeDViewer = function(args = {}) 
{ 
    // Cache the inputs
    this.site = args.site;    
    this.controller = args.controller;

    // Create our (2D) canvas
    this.canvas = Namespace.Ui.CreateElement('canvas', 'threedviewer_canvas', this.site, {width:'100%', height:'100%', backgroundColor:'#000000'} );
    this.canvas.addEventListener('contextmenu', function(e) {e.preventDefault();} ); // Disable right-click context menu

    // Cache or create the render engine
    this.renderEngine = args.renderEngine ? args.renderEngine : new Namespace.RenderEngine({options:args.engineOptions});
    this.ownsEngine = !args.renderEngine;

    // Instance properties
    this.renderParams = new Namespace.RenderParams();
    this.renderParams.slab = new Namespace.Slab(this.renderEngine.volume);
    this.renderParams.persp = 2.0;
    this.defaultOrient = Namespace.Utils.GetRotMatrix([1,0,0], [0,0,-1]);
    this.fastDrawDownsamp = 0.5;
    this.renderCallbacks = [];
    this.resizeTimerId = null;

    var ctx = this.renderEngine.ctx;
    this.slabLinesInfo = {
        vertexBuffer: ctx.createAttrBuffer( new Float32Array(48*3), 3, {drawMode: ctx.gl.DYNAMIC_DRAW} ),  
        attrBuffer:   ctx.createAttrBuffer( new Float32Array(48*4), 4, {drawMode: ctx.gl.STATIC_DRAW} ),
        numLines: 0
    }
    this.slabLinesInfo.attrBuffer.setData( 
        Array.from({length: 96}, (_, i) => {return (i%2) == 0 ? 0 : 1}) ); // 24 greens (0,1,0,1)

    if (this.controller) {
        this.controllerListener = this._onControllerEvent.bind(this);
        this.controller.addEventListener('AllEvents', this.controllerListener);
    }

    // Maybe create an interactor
    if (!args.omitInteractor) { 
        this.interactor = new Namespace.MultiInteractor(this.canvas);   
        this.interactor.addEventListener('start move end', this._onInteractorEvent.bind(this));
    }

    // Maybe listen for resize events
    if (args.autoResize !== false) {
        this.resizeListener = this.onResize().bind(this);
        window.addEventListener('resize', this.resizeListener);
    } 
    this.onResize();
};


/**
 * Deletes the viewer, and any resources that it owns.
 * 
 */
Namespace.ThreeDViewer.prototype.destroy = function() 
{ 
    // Check if we are already destroyed
    if (!this.renderEngine) { return; }

    clearTimeout(this.resizeTimerId);
    if (this.resizeListener) { window.removeEventListener('resize', this.resizeListener); }
    Namespace.Utils.cancelAnimFrame(this.rafId);

    if (this.interactor) { this.interactor.stopListening(); }
    if (this.controllerListener) { this.controller.removeEventListener('AllEvents', this.controllerListener); }

    // Destroy sub-objects
    if (this.ownsEngine) { this.renderEngine.destroy(); }
    this.renderEngine = null;

    this.canvas.remove();
};


/**
 * Handler for resize events.
 * 
 */
Namespace.ThreeDViewer.prototype.onResize = function(omitEcho)
{    
    var canvasClientRect = this.canvas.getBoundingClientRect(); 
    this.canvas.width = Math.round(canvasClientRect.width);
    this.canvas.height = Math.round(canvasClientRect.height);
    this.rafId = Namespace.Utils.requestAnimFrame( this.render.bind(this) );

    // Workaround for the fact that getBoundingClientRect() may not have the latest values.
    if (!omitEcho) {
        if (this.resizeTimerId) { clearTimeout(this.resizeTimerId); }
        this.resizeTimerId = setTimeout( function(){this.onResize(true);}.bind(this), 300);
    } else {
        this.resizeTimerId = null;
    }
};


/**
 * Clears the viewport.
 * 
 */
Namespace.ThreeDViewer.prototype.clear = function()
{
    this.canvas.getContext('2d').clearRect(0, 0, this.canvas.width, this.canvas.height);   
};


/**
 * Loads image data into the viewer.
 * 
 * @param {FileList|File} imgFiles - The image File object(s) to load.
 * @param {Loader3D} loader - A 3D volume loader.
 * @param {Function} [completionCb] - Callback to be invoked when loading is complete.
 * @param {Function} [progressCb] - Progress callback.
 */
Namespace.ThreeDViewer.prototype.loadVolume = function(imgFiles, loader, completionCb, progressCb)
{
    var loadCb = function(errMsg, warnings) {
        if (!errMsg) { this.onNewVolumeLoaded(); }
        if (completionCb) { completionCb(errMsg, warnings, this); }
    }.bind(this);

    this.renderEngine.loadVolume(
        {imgFiles:imgFiles, loader:loader, completionCb:loadCb, progressCb:progressCb, omitRender:true, omitResetView:true});
};


/**
 * Cancels any in-progress loading.
 * Client callbacks will not be invoked.
 * 
 */
Namespace.ThreeDViewer.prototype.cancelLoading = function()
{
    this.renderEngine.cancelLoading();
};


/**
 * Updates internals when a new volume is loaded.
 * 
 */
Namespace.ThreeDViewer.prototype.onNewVolumeLoaded = function()
{
    // Nothing to do here.
};


/**
 *  Renders the MIP or VR image.
 * 
 */
Namespace.ThreeDViewer.prototype.render = function()
{
    const engine = this.renderEngine;
    if ( !engine.hasImageData() ) { return; }

    // Match the engine's raster size to the client size of our display canvas
    engine.setRenderParams(this.renderParams);
    var downsamp = (engine.isAnimating() ? this.fastDrawDownsamp : 1);
    engine.sizeRasterToMatch(this.canvas, downsamp);

    engine.render(this.calcSlabLines.bind(this));

    // Copy the rendered image from the engine canvas to our 2d canvas
    var ctx = this.canvas.getContext('2d');
    ctx.clearRect(0,0, this.canvas.width, this.canvas.height);
    ctx.drawImage(engine.canvas, 0, 0, this.canvas.width, this.canvas.height);

    this.renderCallbacks.forEach( cb => { cb(this); } );
};


/**
 * Handler for events from the interactor.
 * @private
 * 
 */
Namespace.ThreeDViewer.prototype._onInteractorEvent = function(event)
{
    var engine = this.renderEngine;
    var rp = this.renderParams;
    var intr = this.interactor;

    if (event.type == 'start')
    {
        intr.setInitialValues({zoom: rp.zoom, pan: rp.pan, rot: rp.rotMatrix,
            lighting: {ambient:rp.lightSet.ambientLight, shadow:rp.lightSet.dirLights[0].shadowDarkness}});

        // Start an animation
        engine.animate(15, this.render.bind(this));
    }

    else if (event.type == 'move')
    {
        switch (intr.interactMode)
        {
            case 'zoom':
            case 'wheelzoom':
                rp.zoom = intr.currentZoom;
                break;
                
            case 'pan':
                vec2.copy(rp.pan, intr.currentPan);
                break;

            case 'panzoom':
                rp.zoom = intr.currentZoom;
                vec2.copy(rp.pan, intr.currentPan);
                break;

            case 'rotate':
                mat4.copy(rp.rotMatrix, intr.currentRot);
                break;

            case 'light':
                rp.lightSet.ambientLight = intr.ambient;
                rp.lightSet.dirLights[0].shadowDarkness = intr.shadow;
                break;

            default:
                break;
        }
    }
    else if (event.type == 'end')
    {
        // Stop animating
        engine.stopAnimation();
        this.render(); // Render a full resolution image
    }
};


/**
 * Handler for events from the ThreedControls component.
 * @private
 * 
 */
Namespace.ThreeDViewer.prototype._onControllerEvent = function(event)
{
    const rp = this.renderParams;
    const engine = this.renderEngine;

    switch (event.type)
    {
        case 'change-start':
        case 'opacity-change-start':
            ///////////////////////////////this.endMouseWheelInteraction(); TODO
            engine.animate(5, this.render.bind(this));
            break;

        case 'change-end':
        case 'opacity-change-end':
            engine.stopAnimation();
            this.render(); 

        case 'change':
            if (!this.renderEngine.isAnimating()) { this.render(); }
            break;

        case 'opacity-change':
            rp.opacityCurve = event.detail.opCurve;
            if (!this.renderEngine.isAnimating()) { this.render(); }
            break;
    
        case 'antialias-change':
            rp.antiAlias = event.detail.val;
            this.render();
            break;

        case 'iqual-change':
            this.fastDrawDownsamp = parseFloat(event.detail.val);
            break;

        default:
            break;
    }
};


/**
 * Sets the perspective factor, and adjusts the zoom to maintain 
 * apparent image size. 
 * 
 */
Namespace.ThreeDViewer.prototype.setPerspectiveFactor = function(persp)
{
    var rp = this.renderParams;
    var prevPersp = rp.persp;
    rp.persp = persp;
    rp.zoom *= this._calcPerspectiveZoomFactor(rp.persp) / this._calcPerspectiveZoomFactor(prevPersp);

};


/**
 * Sets the default orientation.
 * 
 */
Namespace.ThreeDViewer.prototype.setDefaultOrientation = function(orientMatrix)
{
    mat4.copy(this.defaultOrient, orientMatrix);
};


/**
 * Resets the image orientation.
 * 
 */
Namespace.ThreeDViewer.prototype.resetOrientation = function()
{
    mat4.copy(this.renderParams.rotMatrix, this.defaultOrient);  
};


/**
 * Resets the zoom to its default value.
 * 
 */
Namespace.ThreeDViewer.prototype.resetZoom = function()
{
    var rp = this.renderParams;
    rp.zoom = this.calcDefaultOrthoZoom() * this._calcPerspectiveZoomFactor(rp.persp);
};


/**
 * Resets the pan to its default value.
 * 
 */
Namespace.ThreeDViewer.prototype.resetPan = function()
{
    vec2.copy(this.renderParams.pan, [0,0]);     
};


/**
 * Resets the window width and level.
 * 
 */
Namespace.ThreeDViewer.prototype.resetWindowWidthAndLevel = function()
{
    [this.renderParams.winWidth, this.renderParams.winLevel] = this.renderEngine.volume.getAutoWinLevel();
}


/**
 * Calculate the zoom factor that will just fit an orthographic projection into the viewport.
 * 
 */
Namespace.ThreeDViewer.prototype.calcDefaultOrthoZoom = function()
{
    var defaultOrthoZoom = 1;
    
    if (this.renderEngine.hasImageData()) {
        var vol = this.renderEngine.volume;
        var rowVec = [this.defaultOrient[0], this.defaultOrient[4], this.defaultOrient[8]];
        var colVec = [this.defaultOrient[1], this.defaultOrient[5], this.defaultOrient[9]];
        var wIndex = rowVec.reduce((iMax, u, i, vec) => Math.abs(u) > Math.abs(vec[iMax]) ? i : iMax, 0);
        var hIndex = colVec.reduce((iMax, u, i, vec) => Math.abs(u) > Math.abs(vec[iMax]) ? i : iMax, 0);
        var imgAspect = vol.shape[wIndex] / vol.shape[hIndex];
        var canvAspect = this.canvas.width / this.canvas.height;

        if (imgAspect > canvAspect) {
            defaultOrthoZoom = (vol.diagSize/vol.shape[wIndex]) * Math.max(1, canvAspect);
        } else {
            defaultOrthoZoom = (vol.diagSize/vol.shape[hIndex]) * Math.max(1, 1/canvAspect);
        }
    }

    return defaultOrthoZoom;
}


/**
 * Calculates the factor by which to scale the zoom when the 
 * perspective value changes.
 * 
 */
Namespace.ThreeDViewer.prototype._calcPerspectiveZoomFactor = function(persp)
{
    const xfrms = this.renderEngine.calcTransforms(this.renderParams, this.canvas, {omitLights:true})
    var c = vec3.fromValues(0.5, 0.5, 0.5);
    vec3.transformMat4(c, c, xfrms.mvp);
    var f = Math.max(0.0, 1.0 - Math.abs(c[2]))
    return 1 + f*persp;
}


/**
 * Gets the slab edges that are visible after hidden line removal.
 * 
 */
Namespace.ThreeDViewer.prototype.calcSlabLines = function(transforms)
{ 
    var slab = this.renderParams.slab;
    if (!slab) { return null; }

    // Nested function that determines whether a slab face is visible
    var visibleLines = new Float32Array(48*3);
    var visibleLineIds = [];
    var vbIndex = 0;
    function processFace(cornersC, cornersM, p,q,r,s) 
    {
        var edgeA = vec3.subtract(vec3.create(), cornersC[q], cornersC[p]);  vec3.normalize(edgeA, edgeA);
        var edgeB = vec3.subtract(vec3.create(), cornersC[r], cornersC[p]);  vec3.normalize(edgeB, edgeB);
        var perpZ = edgeA[0]*edgeB[1] - edgeA[1]*edgeB[0];
    
        if (perpZ > 0.0001) { // The face is forward-facing, so its edges are visible 
            var verts = [p,q, p,r, s,q, s,r];
            for (var i=0; i<8; i+=2) {
                var [iA, iB] = [verts[i], verts[i+1]];
                var lineId = (iA < iB) ? 10*iA + iB : 10*iB + iA;
                if (!visibleLineIds.includes(lineId)) {
                    visibleLineIds.push(lineId);
                    visibleLines.set(cornersM[iA], vbIndex);
                    visibleLines.set(cornersM[iB], vbIndex+3);
                    vbIndex += 6;
                }
            }
        }
    };

    // Get the slab corners in model space
    var cornersM = slab.getVerticesTx().map(v => vec3.subtract(vec3.create(), v, [0.5, 0.5, 0.5]));

    // Transform them to clip-space,  
    const rp = this.renderParams;
    var cornersC = cornersM.map(function(cm) { 
        var cc = vec3.transformMat4(vec3.create(), cm, transforms.mvp);
        var pScale = 1 + rp.persp*(cc[2] + 1);
        return vec3.divide(cc, cc, [pScale, pScale, 1]);
    });

    // Determine which slab faces are forward-facing
    [[0,1,2,3], [1,5,3,7], [2,3,6,7], [4,0,6,2], [4,5,0,1], [5,4,7,6]].forEach(function(face) {
        processFace(cornersC, cornersM, ...face);
    });

    this.slabLinesInfo.vertexBuffer.setData(visibleLines);
    this.slabLinesInfo.numLines = (vbIndex/6);

    return this.slabLinesInfo;
};


/**
 * Maps a 3D texture coordinate to a 2D viewport coordinate.
 * 
 */
Namespace.ThreeDViewer.prototype.txToViewport = function(txCoord) 
{
    var rp = this.renderParams;
    var xfrms = this.renderEngine.calcTransforms(rp, this.canvas, {omitLights:true})

    // Texture space to clip-space
    var mdl = vec3.subtract(vec3.create(), txCoord, [0.5, 0.5, 0.5]);
    var cs = vec3.transformMat4(vec3.create(), mdl, xfrms.mvp);

    // Apply perspective
    var pScale = 1 + rp.persp*(cs[2] + 1);
    vec3.divide(cs, cs, [pScale, pScale, 1]);

    // Transform from clip space coordinates to viewport coordinates
    var vp = [(1 + cs[0])*this.canvas.width/2, (1 - cs[1])*this.canvas.height/2];

    return vp;
};


/**
 * Maps a 2D viewport coordinate to a 3D texture coordinate.
 * 
 * @param {vec2} vpCoord - The 2D viewport coordinate. 
 * @param {Number} [csz=0] - The clip-space z coordinate.
 * 
 */
Namespace.ThreeDViewer.prototype.viewportToTx = function(vpCoord, csz=0) 
{
    // Viewport space to clip-space
    var cs = [2*vpCoord[0]/this.canvas.width - 1, 1 - 2*vpCoord[1]/this.canvas.height, csz];

    // Invert perspective
    var rp = this.renderParams;
    var pScale = 1 + rp.persp*(csz + 1);
    vec3.multiply(cs, cs, [pScale, pScale, 1]);

    // Clip-space to model space
    var xfrms = this.renderEngine.calcTransforms(rp, this.canvas, {omitLights:true})
    var mdl = vec3.transformMat4(vec3.create(), cs, xfrms.mvpInv);

    // Model space to texture space
    return vec3.add(vec3.create(), mdl, [0.5, 0.5, 0.5]);
};



})( window.BigLime = window.BigLime || {} );







;(function(Namespace, undefined) {
    "use strict";
    var vec3 = glMatrix.vec3;   

/**
 * @category 3D
 * @classdesc
 * This class is responsible for loading tiff files into a volume.
 * It requires the UTIF library.
 * 
 * @constructor
 * @param {Array} extraAttrs - (TiffTag, attrName) pairs to try loading from the tiff header.
 */
Namespace.TiffLoader3D = function(extraAttrs) 
{
    // Inherit from Loader3D
    Namespace.Loader3D.call(this);

    this.imgBufferArray = null;
    this.fileList = [];
    this.extraAttrs = extraAttrs;
};
Namespace.TiffLoader3D.prototype = Object.create(Namespace.Loader3D.prototype);
Namespace.TiffLoader3D.prototype.constructor = Namespace.TiffLoader3D;  


/**
 * Reads the dimensions of a given file from its header.
 * 
 * @param {File|FileHandle} imgFile - The image file to read.
 * 
 * @returns {Array} - the [width, height] of the volume.
 *
 */
Namespace.TiffLoader3D.prototype.getImageDims = async function (imgFile) 
{
    return new Promise((resolve, reject) => 
    {
        try
        {
            var fileReader = new FileReader();  
            fileReader.onload = () => {
                try {
                    var ifds = UTIF.decode(fileReader.result);
                    resolve([ifds[0]['t256'][0], ifds[0]['t257'][0]]);
                }
                catch (ex) {
                    reject(ex);
                }
            };
            fileReader.onerror = (err) => { 
                reject(err); 
            };

            if (imgFile instanceof FileSystemFileHandle) {
                imgFile.getFile().then(function(f) { 
                    fileReader.readAsArrayBuffer(f);
                })
                .catch (function(ex) {
                    reject(ex);
                });
            }
            else {
                fileReader.readAsArrayBuffer(imgFile);
            }
        }
        catch (ex) {
            reject(ex);
        }
    });
};


/**
 * Starts loading files into a volume object.
 * 
 * @param {FileList|File} imgFiles - The image File object(s) to load.
 * @param {VolumeT2|VolumeT3} volume - The volume object that will receive the data.
 * @param {function} [completionCb] - A callback to invoke when loading is complete.
 * @param {function} [progressCb] - A callback to invoke when each image is loaded.
 */
Namespace.TiffLoader3D.prototype.loadImagesIntoVolume = function (imgFiles, volume, completionCb, progressCb) 
{
    this.fileList = [];
    Array.prototype.push.apply(this.fileList, imgFiles); // Take a copy of the file list, since it may be transient

    this.vol = volume;
    this.errors = null;
    this.warnings = null;
    this.done = false;
    this.loadCompleteCb = completionCb;
    this.loadProgressCb = progressCb;

    // Handle a trivial case
    if (!this.fileList || !this.fileList.length) {
        this.done = true;
        this.warnings = "TiffLoader3D: No files were loaded, because the supplied file list was empty.";
        if (this.loadCompleteCb) { this.loadCompleteCb(this); }  
        return;
    }

    // Check that all items in the file list are valid
    if (this.fileList.some(f => {return !(f instanceof FileSystemFileHandle) && !(f instanceof File)})) {
        this.done = true;
        this.errors = "TiffLoader3D: Invalid item in file list.";
        if (this.loadCompleteCb) { this.loadCompleteCb(this); }  
        return;
    }

    // Load an image, just so we can read its tiff tags
    var fileReader = new FileReader();  
    fileReader.onload = function() { this._onInitialImageLoaded(fileReader); }.bind(this);
    fileReader.onerror = function() { this._onImageLoadingError(fileReader); }.bind(this);  

    var fileItem = this.fileList.find(f => !f.name.toLowerCase().startsWith("slicegap") );
    if (!fileItem) {
        if (!this.done) {
            this.done = true;        
            this.errors = "No tiff files were specified.";
            if (this.loadCompleteCb) { this.loadCompleteCb(this); }
            return;
        }          
    }
    else 
    {
        if (this.loadProgressCb) { this.loadProgressCb(0, this.fileList.length); }

        if (fileItem instanceof FileSystemFileHandle) {
            fileItem.getFile().then(function(file) { 
                fileReader.readAsArrayBuffer(file); 
            })
            .catch (function(ex) {
                this._onImageLoadingError(fileReader)}.bind(this)
            );
        }
        else {
            fileReader.readAsArrayBuffer(fileItem);
        }
    }
};


/**
 * Callback invoked when the initial image file has been loaded.
 * @private
 * 
 */
Namespace.TiffLoader3D.prototype._onInitialImageLoaded = function(fileReader) 
{    
    if (this.cancelled) { return; } 

    try
    {
        var ifds = UTIF.decode(fileReader.result);

        if (ifds.length > 1) {
            this._handleMultiImageTiff(fileReader.result, ifds);
            return;
        }

        UTIF.decodeImage(fileReader.result, ifds[0]);
        var endian = ifds[0].isLE ? "little" : "big";
        var imgWidth = ifds[0].width;
        var imgHeight = ifds[0].height;
        var bpp = ifds[0].t258[0];
        var gap = 1;
        var flipStack = false;

        // Check for a slicegap file
        var slicegapFile = this.fileList.find(f => f.name.toLowerCase().startsWith("slicegap"));
        if (slicegapFile) {
            try {
                gap = parseFloat(slicegapFile.name.substring(8));
                if (gap < 0) { flipStack = true; }
                gap = Math.abs(gap);
            }
            catch (ex) {
                Namespace.Logger.Report("Failed to read slice gap. Defaulting to 1.0.", Namespace.Logger.Severity.Warn);
            }
        }

        // Sort the image files
        // Note that we sort in *decreasing* order, effectively flipping the stack, 
        // to compensate for WebGL's left-handed clip-space coordinate system.    
        this.fileList = this.fileList.filter(f => !f.name.toLowerCase().startsWith("slicegap")); 
        this.fileList = flipStack ? this.fileList.sort((a,b) => a.name.localeCompare(b.name)) : 
                                    this.fileList.sort((a,b) => b.name.localeCompare(a.name));

        // Initialize the volume object
        var dims = [imgWidth, imgHeight, this.fileList.length];     
        this.errors = this.vol.loadBegin(dims, bpp, endian);   
        if (this.errors) {
            this.done = true;
            if (this.loadCompleteCb) { this.loadCompleteCb(this); }
            return;       
        } 

        // Set some additional attributes
        this.vol.setAttr("modality", "Tiff");
        this.vol.setAttr("rescaleSlope", 1);
        this.vol.setAttr("rescaleIntercept", 0);
        this.vol.setAttr("dataOffset", 0);
        this.vol.setAttr("sliceGap", gap);
        this.vol.setAttr("rowDir", vec3.fromValues(1,0,0));
        this.vol.setAttr("colDir", vec3.fromValues(0,1,0));
        this.vol.calcNearLphAxes();

        try {
            if (this.extraAttrs){
                for (var attr of this.extraAttrs) {
                    var attrVal = ifds[0]['t' + attr[0].toString()];
                    if (Array.isArray(attrVal)) { attrVal = attrVal[0]; }
                    if (!attrVal && attrVal !== 0) { attrVal = ""; }
                    this.vol.setAttr(attr[1], attrVal.toString());
                }
            }
        } catch (ex) {}

        // Start loading the pixel data into the textures.
        this.imgBufferArray = new Array(4);    
        this._loadNextBatch(0);
    }
    catch (ex) {
        this._onImageLoadingError(fileReader);
    }
};


/**
 * Loads the next batch of images.
 * @private
 * 
 */
Namespace.TiffLoader3D.prototype._loadNextBatch = function (startIndex) 
{
    var batchSize = (this.vol.bpp == 8) ? 4 : 2;
    batchSize = Math.min(batchSize, this.vol.dims[2] - startIndex);
    var batchInfo = { startIndex:startIndex, endIndex:startIndex+batchSize, numLeftToLoad:batchSize, imgBuffers:this.imgBufferArray };

    for (var i = 0; i < batchSize; i++) {
        this._loadSingleImage(startIndex+i, batchInfo);
    }
};


/**
 * Helper function that loads a single image.
 * @private 
 * 
 */
Namespace.TiffLoader3D.prototype._loadSingleImage = function(indx, batchInfo) 
{
    // Load the image File
    var fileReader = new FileReader();
    fileReader.fileName = this.fileList[indx].name;
    fileReader.batchInfo = batchInfo;    
    fileReader.onload = function() { this._onImageLoaded(indx, fileReader); }.bind(this);
    fileReader.onerror = function() { this._onImageLoadingError(fileReader); }.bind(this);  

    var fileItem = this.fileList[indx]
    if (fileItem instanceof FileSystemFileHandle) {
        try {
            fileItem.getFile().then(function(file) { fileReader.readAsArrayBuffer(file); });
        } 
        catch (ex) {
            this._onImageLoadingError(fileReader);
        }
    }
    else {
        fileReader.readAsArrayBuffer(fileItem);
    }
};


/**
 * Callback invoked when an error occurs during image loading.
 * @private
 * 
 */
Namespace.TiffLoader3D.prototype._onImageLoadingError = function (fileReader) 
{
    if (this.cancelled) { return; } 

    if (!this.done) {
        this.done = true;
        this.errors = "Error loading image " + (fileReader.fileName || "");
        if (this.loadCompleteCb) { this.loadCompleteCb(this); }
    }
};


/**
 * Callback indicating that an image has been loaded.
 * @private
 * 
 */
Namespace.TiffLoader3D.prototype._onImageLoaded = function (imgIndex, fileReader) 
{
    // Bounce out if this is a late callback 
    if (this.done) { return; }

    // Check if we've been cancelled
    if (this.cancelled) { return; } 

    try
    {
        var ifds = UTIF.decode(fileReader.result);
        UTIF.decodeImage(fileReader.result, ifds[0]);

        // Cache the pixel data in the batchInfo struct
        var batchInfo = fileReader.batchInfo;
        batchInfo.imgBuffers[imgIndex - batchInfo.startIndex] = this.vol.bpp == 16 ? 
            new Uint16Array(ifds[0].data.buffer) : new Uint8Array(ifds[0].data.buffer); 

        // Update progress
        batchInfo.numLeftToLoad--;
        if (this.loadProgressCb) {
            this.loadProgressCb(batchInfo.endIndex-batchInfo.numLeftToLoad, this.vol.dims[2]);
        }

        // Are we expecting more?
        if (batchInfo.numLeftToLoad === 0) 
        {
            // Copy the image data to the webgl texture
            this._copyImagesToTexture(batchInfo);
            
            if (batchInfo.endIndex < this.vol.dims[2]) {
                this._loadNextBatch(batchInfo.endIndex);
            }
            else {
                // All images have been loaded
                if (!this.done) {
                    this.vol.loadEnd();
                    this.done = true;            
                    if (this.loadCompleteCb) { this.loadCompleteCb(this); }
                }
            }
        }
    }
    catch (ex) {
        this._onImageLoadingError(fileReader);
    }
};


/**
 * Loads a multi-image tiff file.
 * @private
 * 
 */
Namespace.TiffLoader3D.prototype._handleMultiImageTiff = async function(fileBytes, ifds) 
{
    try
        {
        UTIF.decodeImage(fileBytes, ifds[0]);
        var endian = ifds[0].isLE ? "little" : "big";
        var imgWidth = ifds[0].width;
        var imgHeight = ifds[0].height;
        var numImgs = ifds.length;
        var bpp = ifds[0].t258[0];
        var gap = 1;

        // Check for a slicegap file
        var slicegapFile = this.fileList.find(f => f.name.toLowerCase().startsWith("slicegap"));
        if (slicegapFile) {
            try {
                gap = parseFloat(slicegapFile.name.substring(8));
            } catch (ex) {
                Lib3D.MiscUtils.reportMessage('Failed to read slice gap. Defaulting to 1.0');
            }
        }

        // Initialize the volume object
        var dims = [imgWidth, imgHeight, numImgs];     
        this.errors = this.vol.loadBegin(dims, bpp, endian);   
        if (this.errors) {
            this.done = true;
            if (this.loadCompleteCb) { this.loadCompleteCb(this); }
            return;       
        } 

        // Set some additional attributes
        this.vol.setAttr("modality", "Tiff");
        this.vol.setAttr("rescaleSlope", 1);
        this.vol.setAttr("rescaleIntercept", 0);
        this.vol.setAttr("dataOffset", 0);
        this.vol.setAttr("sliceGap", gap);
        this.vol.setAttr("rowDir", vec3.fromValues(1,0,0));
        this.vol.setAttr("colDir", vec3.fromValues(0,1,0));
        this.vol.calcNearLphAxes();

        try {
            if (this.extraAttrs){
                for (var attr of this.extraAttrs) {
                    var attrVal = ifds[0]['t' + attr[0].toString()];
                    if (Array.isArray(attrVal)) { attrVal = attrVal[0]; }
                    if (!attrVal && attrVal !== 0) { attrVal = ""; }
                    this.vol.setAttr(attr[1], attrVal.toString());
                }
            }
        } catch (ex) {}

        // Start loading the pixel data into the textures.
        this.imgBufferArray = new Array(4);    
        var batchSize = (this.vol.bpp == 8) ? 4 : 2;

        // Sort the images in *decreasing* order, effectively flipping the stack, 
        // to compensate for WebGL's left-handed clip-space coordinate system.
        ifds = ifds.slice().reverse();

        for (var batchStartIndex = 0; batchStartIndex < numImgs; ) {
            batchSize = Math.min(batchSize, numImgs - batchStartIndex);
            var batchInfo = { startIndex:batchStartIndex, endIndex:batchStartIndex+batchSize, numLeftToLoad:batchSize, imgBuffers:this.imgBufferArray };

            for (var i = 0; i < batchSize; i++) {
                var imgIndx = batchInfo.startIndex + i;
                if (imgIndx > 0) { ifds[imgIndx-1].data = null; }
                UTIF.decodeImage(fileBytes, ifds[imgIndx]);
                batchInfo.imgBuffers[i] = this.vol.bpp == 16 ? 
                    new Uint16Array(ifds[imgIndx].data.buffer) : new Uint8Array(ifds[imgIndx].data.buffer); 

                batchInfo.numLeftToLoad--;
                if (batchInfo.numLeftToLoad === 0) {
                    // Copy the image data to the webgl texture
                    this._copyImagesToTexture(batchInfo);
                    
                    if (batchInfo.endIndex == numImgs) {
                        if (!this.done) {
                            this.vol.loadEnd();
                            this.done = true;            
                            if (this.loadCompleteCb) { this.loadCompleteCb(this); }
                            return;
                        }
                    }
                }            
            }
            // Maybe report progress
            if (this.loadProgressCb) {
                this.loadProgressCb(batchInfo.endIndex-batchInfo.numLeftToLoad, this.vol.dims[2]);
                await new Promise(r => setTimeout(r, 5));
                if (this.cancelled) { return; } 
            }
            batchStartIndex += batchSize;
        }
    }
    catch (ex) {
        this._onImageLoadingError(fileReader);
    }
};


})( window.BigLime = window.BigLime || {} );











;(function(Namespace, undefined) {
    "use strict";
    

/**
 * @category 3D
 * @classdesc
 * The VolumeT2 class encapsulates volume data stored in a set of 2D textures.
 * 
 * @constructor
 * @param {GLContext} context - The rendering context. 
 * @param {Number} maxNumTextures - The WebGL texture index. Must be in the range [0, gl.MAX_TEXTURE_IMAGE_UNITS-1].
 */
Namespace.VolumeT2 = function(context, maxNumTextures) 
{ 
    this.context        = context;
    this.dims           = [1, 1, 1];
    this.sliceGap       = 1;
    this.bpp            = 0;
    this.bigEndian      = false;
    this.sizeInBytes    = 0;  
    this.shape          = [1, 1, 1];  
    this.diagSize       = Math.sqrt(3);   
    this.aspect         = [1, 1, 1];
    this.attrs          = {};
    this.textures       = [];
    this.txInfo         = null;
    this.maxNumTextures = maxNumTextures;
    this.interpType     = Namespace.Interp3D.TriLinear;
    this.histogram      = new Namespace.Histogram3D(65536);
    this.loaded         = false;    
    this.opacityRange   = null;
    this.autoWinLevel   = null;
    this.meshManager    = new Namespace.MeshManager(this);

    this.calcNearLphAxes();
};


/**
 * Deletes the Volume.
 * 
 */
Namespace.VolumeT2.prototype.destroy = function() 
{ 
    // Check if we are already destroyed
    if (!this.context) { 
        return; 
    } 

    // Delete the textures
    for (var i = 0; i < this.textures.length; i++) {
        this.textures[i].destroy();
    }
    this.textures = [];
    this.dims = null;
    this.attrs = null;
    this.nearLphAxes = null;
    this.context = null;
};


/**
 * Sets the interpolation type.
 * 
 * @param {Interp3D} interpType - The interpolation type to set.
 */
Namespace.VolumeT2.prototype.setInterpType = function(interpType) 
{
    if (this.interpType = interpType) { return; }

    this.interpType = interpType;

    var gl = this.context.gl;
    var glInterpEnum = (interpType == Namespace.Interp3D.NN) ? gl.NEAREST : gl.LINEAR;
    for (var i=0; i<this.textures.length; i++) {
        this.textures[i].setInterpType(glInterpEnum);
    }     
};


/**
 * Gets the number of texture objects used by the volume.
 * 
 * @return {Number} The number of texture objects used by the volume.
 */
Namespace.VolumeT2.prototype.numTextures = function() 
{
    return this.textures.length;     
};


/**
 * Adds a mesh to the volume.
 * 
 * @param {Mesh} mesh - The mesh to add.
 * 
 */
Namespace.VolumeT2.prototype.addMesh = function(mesh)
{
    this.meshManager.addMesh(mesh);
};


/**
 * Removes a mesh from the volume.
 * 
 * @param {String} mesh - The name of the mesh to remove.
 * 
 */
Namespace.VolumeT2.prototype.removeMesh = function(name)
{
    return this.meshManager.removeMesh(name);
};


/**
 * Removes all meshes from the volume.
 * 
 */
Namespace.VolumeT2.prototype.removeAllMeshes = function()
{
    return this.meshManager.removeAllMeshes();
};


/**
 * Indicates whether a given mesh is contained in the Volume.
 * 
 * @param {Mesh} mesh - The mesh to test for.
 */
Namespace.VolumeT2.prototype.containsMesh = function(mesh)
{
    return this.meshManager.contains(mesh);
};


/**
 * Tells the Volume that it is about to receive new data.
 * 
 * @param {Array} dims - A 3-component array specifying the number of voxels along each dimension.
 * @param {Number} bpp - The number of bytes per pixel.
 * @param {String} endian - The endian-ness of the pixel data (allowed values are 'big' and 'little').
 * @return {String} An error message if a problem is detected, otherwise nothing.
 * 
 */
Namespace.VolumeT2.prototype.loadBegin = function(dims, bpp, endian) 
{
    // Reset state
    this.loaded = false;
    this.histogram.clear();
    this.opacityRange = null;
    this.autoWinLevel = null;
    this.sliceGap = 1;
    this.meshManager.removeAllMeshes();

    // Check the bits-per-pixel value
    if ((bpp != 8) && (bpp != 16)) {
        return "Unsupported bits-per-pixel.";
    }

    // Does the current device support enough textures?
    var txInfo = Namespace.VolumeT2._calcMosaicTextureParams(dims, bpp, this.context);
    if (txInfo.count > this.maxNumTextures) {
        return "Volume is too large for this device.";
    }
    
    try 
    {
        // Cache the volume and texture info
        this.dims = [ dims[0], dims[1], dims[2] ];
        this.bpp = bpp;
        this.bigEndian = endian.toLowerCase().startsWith("b");
        this.txInfo = txInfo;
        this.sizeInBytes = dims[0] * dims[1] * dims[2] * (bpp/8);

        // Clear any previous textures that won't be re-used
        var newNumTextures = txInfo.count;
        var prevTextures = this.textures;
        this.textures = [];    
        var i;
        for (i = newNumTextures; i < prevTextures.length; i++) {
            prevTextures[i].destroy();
        }

        // Create new textures, or re-use existing ones if possible
        var gl = this.context.gl;
        for (i = 0; i < newNumTextures; i++) 
        {
            var newTxWidth  = txInfo.dims[(i < newNumTextures-1) ? 0: 2];
            var newTxHeight = txInfo.dims[(i < newNumTextures-1) ? 1: 3];
            if ( (i < prevTextures.length) && prevTextures[i].sizeEquals(newTxWidth,newTxHeight) ) {
                this.textures.push( prevTextures[i] );
            }
            else {
                if (i < prevTextures.length) { prevTextures[i].destroy(); }
                var tx = new Namespace.Texture2D(this.context, i, newTxWidth, newTxHeight, gl.RGBA, gl.LINEAR);
                tx.setInterpType( (this.interpType == Namespace.Interp3D.NN) ? gl.NEAREST : gl.LINEAR );
                this.textures.push(tx);
            }
        }
    }   
    catch (e) {
        return "Error configuring volume\n\n" + e.message;
    }
};


/**
 * Calculates the number of textures needed and their sizes.
 * @private
 * 
 */
Namespace.VolumeT2._calcMosaicTextureParams = function(volDims, bpp, ctx)
{
    var imgWidth  = volDims[0];
    var imgHeight = volDims[1];
    var numImgs   = volDims[2];

    var maxTextureSize = ctx.GlMaxTextureSize;   
    var imgsPerTile = 32/bpp;
    var NTxMax = Math.floor(maxTextureSize/imgWidth); 
    var NTx    = Math.min(NTxMax, Math.ceil(Math.sqrt(numImgs/imgsPerTile)));  // Number of tiles along x
    var NTyMax = Math.floor(maxTextureSize/imgHeight); 
    var NTy    = Math.min(NTyMax, Math.ceil(numImgs/(NTx*imgsPerTile)) );  // Number of tiles along y
    var imgsPerTexture = NTx*NTy*imgsPerTile;
    var numTexturesRequired = Math.ceil( numImgs/imgsPerTexture );

    var numImgsInFinalTexture = numImgs - (numTexturesRequired-1)*imgsPerTexture;
    var NTyFinal = Math.ceil(numImgsInFinalTexture/(NTx*imgsPerTile)); // Number of tiles along y in the final texture

    return {
        count           : numTexturesRequired, 
        dims            : [NTx*imgWidth, NTy*imgHeight, NTx*imgWidth, NTyFinal*imgHeight],
        mosaicDims      : [NTx, NTy, NTx, NTyFinal],
        NTx             : NTx,
        NTy             : NTy, 
        imgsPerTile     : imgsPerTile,
        imgsPerTexture  : imgsPerTexture,
        tilesPerTexture : NTx*NTy
    };
};


/**
 * Tells the Volume that data loading is complete.
 * 
 */
Namespace.VolumeT2.prototype.loadEnd = function() 
{
    this.loaded = true;
    this.shape = [this.dims[0], this.dims[1], this.dims[2]*this.sliceGap];
    this.diagSize = glMatrix.vec3.length(this.shape);
    glMatrix.vec3.scale(this.aspect, this.shape, 1.0/Math.max(...this.shape));
};


/**
 * Sets an attribute value.
 * 
 * @param {String} name - The attribute name.
 * @param {Object} value - The attribute value.
 * 
 */
Namespace.VolumeT2.prototype.setAttr = function(name, value) 
{
    var lcName = name.toLowerCase();
    this.attrs[lcName] = value;
    if (lcName == "slicegap") {
        this.sliceGap = Number(value);
    }
};


/**
 * Gets an attribute value.
 * 
 * @param {String} name - The attribute name.
 * @param {Object} defaultVal - The value to return if the attribute doesn't exist.
 * @return {Object} value - The attribute value.
 * 
 */
Namespace.VolumeT2.prototype.getAttr = function(name, defaultVal) 
{
    var val = this.attrs[name.toLowerCase()];
    if ( (typeof(val) === 'undefined') || (val === null) ) { 
        val = defaultVal; 
    }
    return val;
};


/**
 * Gets the data modality.
 * 
 */
Namespace.VolumeT2.prototype.modality = function() 
{
    return this.getAttr("modality","").toUpperCase();
};


/**
 * Computes the pixel value range to be used for mapping the opacity curve.
 * 
 */
Namespace.VolumeT2.prototype.getOpacityRange = function() 
{
    if (this.opacityRange) {
        return this.opacityRange;
    }

    var rangeStart, rangeSize;
    if (this.modality() == "CT") {
        var slope = this.getAttr("rescaleSlope",1);
        rangeStart = (-1024.0 - this.getAttr("rescaleIntercept",0))/slope - this.getAttr("dataOffset",0);
        rangeSize = 4096.0/slope;
    }
    else {
        var tRange = this.histogram.getThreshedMinMax(0.5);            
        rangeStart = tRange[0];
        rangeSize = Math.max(tRange[1]-tRange[0], 0.0001);
    }

    this.opacityRange = [rangeStart, rangeSize]; 
    return this.opacityRange;
};   


/**
 * Computes an appropriate window/level for the volume's data range.
 * 
 */
Namespace.VolumeT2.prototype.getAutoWinLevel = function() 
{
    if (this.autoWinLevel) {
        return this.autoWinLevel;
    }
    
    if (!this.loaded) {
        return [2048, 1024];
    }
    
    var rangeStart, rangeSize;
    if (this.modality() == "CT") {
        var slope = this.getAttr("rescaleSlope",1);
        rangeStart = (-1024.0 - this.getAttr("rescaleIntercept",0) + 640)/slope - this.getAttr("dataOffset",0);
        rangeSize = 1024.0/slope;
    }
    else {
        var tRange = this.histogram.getThreshedMinMax(0.5);            
        rangeStart = tRange[0];
        rangeSize = Math.max(tRange[1]-tRange[0], 0.0001);
    }

    this.autoWinLevel = [rangeSize, rangeStart+rangeSize/2]; 
    return this.autoWinLevel;
}; 


/**
 * Computes the stack axes that are closest to the L,P,H axes.
 * 
 */
Namespace.VolumeT2.prototype.calcNearLphAxes = function( )
{
    var vec3 = glMatrix.vec3;
    this.nearLphAxes = {};

    var rowDirLPH = this.getAttr("rowDir");
    var colDirLPH = this.getAttr("colDir");
    if (!rowDirLPH || !colDirLPH)
    {
        this.nearLphAxes.L = [1,0,0];    this.nearLphAxes.R = [-1,0,0];
        this.nearLphAxes.P = [0,1,0];    this.nearLphAxes.A = [0,-1,0];
        this.nearLphAxes.H = [0,0,1];    this.nearLphAxes.F = [0,0,-1];
    }
    else
    {     
        var i, proj;   
        var perpDirLPH = [0,0,0];  vec3.cross(perpDirLPH, rowDirLPH, colDirLPH);    
        var stackAxesLPH = [rowDirLPH, colDirLPH, perpDirLPH];
            
        // Determine which stack axis is closest to the L-axis
        var iL = -1;
        var bestProj = 0;
        for (i=0; i<3; i++)
        {
            proj = stackAxesLPH[i][0];  // L-component of the stack axis
            if ( Math.abs(proj) > Math.abs(bestProj) ) { bestProj = proj; iL = i; }
        }
        this.nearLphAxes.L = [0,0,0];  this.nearLphAxes.L[iL] = Math.sign(bestProj);
        this.nearLphAxes.R = [0,0,0];  vec3.negate(this.nearLphAxes.R, this.nearLphAxes.L);
        
        // Determine which stack axis is closest to the P-axis
        var iP = -1;
        bestProj = 0;
        for (i=0; i<3; i++)
        {
            if (i == iL) { continue; }
            proj = stackAxesLPH[i][1];  // P-component of the stack axis
            if ( Math.abs(proj) > Math.abs(bestProj) ) { bestProj = proj; iP = i; }
        }
        this.nearLphAxes.P = [0,0,0];  this.nearLphAxes.P[iP] = Math.sign(bestProj);
        this.nearLphAxes.A = [0,0,0];  vec3.negate(this.nearLphAxes.A, this.nearLphAxes.P);

        // Determine which stack axis is closest to the H-axis
        this.nearLphAxes.H = [0,0,0];  vec3.cross(this.nearLphAxes.H, this.nearLphAxes.L, this.nearLphAxes.P);
        this.nearLphAxes.F = [0,0,0];  vec3.negate(this.nearLphAxes.F, this.nearLphAxes.H);

        return this.nearLphAxes;
    }
};


})( window.BigLime = window.BigLime || {} );







;(function(Namespace, undefined) {
    "use strict";
    
    
/**
 * @category 3D
 * @classdesc
 * The VolumeT3 class encapsulates volume data stored in a 3D texture.
 * 
 * @constructor
 * @param {GLContext} context - The rendering context. 
 * @param {Number} txIndex - The WebGL texture index. Must be in the range [0, gl.MAX_TEXTURE_IMAGE_UNITS-1].
 */
Namespace.VolumeT3 = function(context, txIndex) 
{ 
    this.context      = context;
    this.txIndex      = txIndex;
    this.dims         = [1, 1, 1];
    this.sliceGap     = 1;
    this.bpp          = 0;
    this.bigEndian    = false;
    this.sizeInBytes  = 0;  
    this.shape        = [1, 1, 1];  
    this.diagSize     = Math.sqrt(3);
    this.aspect       = [1, 1, 1];
    this.attrs        = {};
    this.texture      = null;
    this.interpType   = Namespace.Interp3D.TriLinear;
    this.histogram    = new Namespace.Histogram3D(65536);    
    this.loaded       = false;
    this.opacityRange = null;
    this.autoWinLevel = null;
    this.meshManager  = new Namespace.MeshManager(this);

    this.calcNearLphAxes();
};


/**
 * Deletes the Volume.
 * 
 */
Namespace.VolumeT3.prototype.destroy = function() 
{ 
    // Check if we are already destroyed
    if (!this.context) { 
        return; 
    } 

    // Delete the texture
    if (this.texture) { 
        this.texture.destroy(); 
        this.texture = null;
    }
    this.dims = null;
    this.attrs = null;
    this.nearLphAxes = null;
    this.context = null;
};


/**
 * Sets the interpolation type.
 * 
 * @param {Interp3D} interpType - The interpolation type to set.
 */
Namespace.VolumeT3.prototype.setInterpType = function(interpType) 
{
    if (this.interpType == interpType) { return; }
    
    var gl = this.context.gl;
    var glInterpEnum = (interpType == Namespace.Interp3D.NN) ? gl.NEAREST : gl.LINEAR;
    if (this.texture) { 
        this.texture.setInterpType(glInterpEnum); 
    }
};


/**
 * Gets the number of texture objects used by the volume.
 * 
 * @return {Number} The number of texture objects used by the volume.
 */
Namespace.VolumeT3.prototype.numTextures = function() 
{
    return 1;     
};


/**
 * Adds a mesh to the volume.
 * 
 * @param {Mesh} mesh - The mesh to add.
 * 
 */
Namespace.VolumeT3.prototype.addMesh = function(mesh)
{
    this.meshManager.addMesh(mesh);
};


/**
 * Removes a mesh from the volume.
 * 
 * @param {String} mesh - The name of the mesh to remove.
 * 
 */
Namespace.VolumeT3.prototype.removeMesh = function(name)
{
    return this.meshManager.removeMesh(name);
};


/**
 * Removes all meshes from the volume.
 * 
 */
Namespace.VolumeT3.prototype.removeAllMeshes = function()
{
    return this.meshManager.removeAllMeshes();
};


/**
 * Indicates whether a given mesh is contained in the Volume.
 * 
 * @param {Mesh} mesh - The mesh to test for.
 */
Namespace.VolumeT3.prototype.containsMesh = function(mesh)
{
    return this.meshManager.contains(mesh);
};


/**
 * Tells the Volume that it is about to receive new data.
 * 
 * @param {Array} dims - A 3-component array specifying the number of voxels along each dimension.
 * @param {Number} bpp - The number of bytes per pixel.
 * @param {String} endian - The endian-ness of the pixel data (allowed values are 'big' and 'little').
 * @return {String} An error message if a problem is detected, otherwise nothing.
 * 
 */
Namespace.VolumeT3.prototype.loadBegin = function(dims, bpp, endian) 
{
    // Reset state
    this.loaded = false;
    this.histogram.clear();
    this.opacityRange = null;
    this.autoWinLevel = null;
    this.sliceGap = 1;
    this.meshManager.removeAllMeshes();
    
    // Check the bits-per-pixel value
    if ((bpp != 8) && (bpp != 16)) {
        return "Unsupported bits-per-pixel.";
    }

    // Create a new data texture, or re-use the existing one if possible
    try 
    {
        var gl = this.context.gl;
        if ( this.texture && (!this.texture.sizeEquals(dims[0], dims[1], dims[2]) || (bpp != this.bpp)) ) {
            this.texture.destroy();
            this.texture = null;
        }
        if ( !this.texture ) {
            var pixelType = (bpp == 8) ? gl.R8 : gl.RG8;
            this.texture = new Namespace.Texture3D(this.context, this.txIndex, dims[0], dims[1], dims[2], pixelType, gl.LINEAR);
            this.setInterpType(this.interpType);
        }

        // Cache the volume info
        this.dims = [ dims[0], dims[1], dims[2] ];
        this.bpp = bpp;
        this.bigEndian = endian.toLowerCase().startsWith("b");
        this.sizeInBytes = dims[0] * dims[1] * dims[2] * (bpp/8);
    }   
    catch (e) {
        return "Error configuring volume\n\n" + e.message;
    }
};


/**
 * Tells the Volume that data loading is complete.
 * 
 */
Namespace.VolumeT3.prototype.loadEnd = function() 
{
    this.loaded = true;
    this.shape = [this.dims[0], this.dims[1], this.dims[2]*this.sliceGap];
    this.diagSize = glMatrix.vec3.length(this.shape);
    glMatrix.vec3.scale(this.aspect, this.shape, 1.0/Math.max(...this.shape));
};


/**
 * Sets an attribute value.
 * 
 * @param {String} name - The attribute name.
 * @param {Object} value - The attribute value.
 * 
 */
Namespace.VolumeT3.prototype.setAttr = function(name, value) 
{
    var lcName = name.toLowerCase();
    this.attrs[lcName] = value;
    if (lcName == "slicegap") {
        this.sliceGap = Number(value);
    }  
};


/**
 * Gets an attribute value.
 * 
 * @param {String} name - The attribute name.
 * @param {Object} defaultVal - The value to return if the attribute doesn't exist.
 * @return {Object} value - The attribute value.
 * 
 */
Namespace.VolumeT3.prototype.getAttr = function(name, defaultVal) 
{
    var val = this.attrs[name.toLowerCase()];
    if ( (typeof(val) === 'undefined') || (val === null) ) { 
        val = defaultVal; 
    }
    return val;
};


/**
 * Gets the data modality.
 * 
 */
Namespace.VolumeT3.prototype.modality = function() 
{
    return this.getAttr("modality","").toUpperCase();
};


/**
 * Computes the pixel value range to be used for mapping the opacity curve.
 * 
 */
Namespace.VolumeT3.prototype.getOpacityRange = function() 
{
    return Namespace.VolumeT2.prototype.getOpacityRange.call(this);
};


/**
 * Computes an appropriate window/level for the volume's data range.
 * 
 */
Namespace.VolumeT3.prototype.getAutoWinLevel = function() 
{
    return Namespace.VolumeT2.prototype.getAutoWinLevel.call(this);
};


/**
 * Computes the stack axes that are closest to the L,P,H axes.
 * 
 */
Namespace.VolumeT3.prototype.calcNearLphAxes = function()
{
    return Namespace.VolumeT2.prototype.calcNearLphAxes.call(this);
};


})( window.BigLime = window.BigLime || {} );







/**
 * This file contains the shader code for graphics (mesh) rendering in WebGL 1.
 * 
 */
;(function(Namespace, undefined) {
	"use strict";
	Namespace.ShaderCode = Namespace.ShaderCode || {};


/**
 * Vertex shader.
 * 
 */
Namespace.ShaderCode.gfx_vert_1 = 
`// gfx_vert_1

//<<SYMBOL_DEFS>>//

precision highp float; 
precision highp int;

attribute vec4 aPosition;
attribute vec3 aNormal;
attribute vec4 aColor;
attribute vec4 aMaterial;

uniform mat4 uMvpTransform;
uniform mat4 uRotMatrix;
uniform float uPersp;

varying vec4 vPosition;
varying vec3 vNormal;
varying vec4 vColor;
varying vec4 vMaterial;


///////////////////////////////////////////////////////////////////////////////
//
// Program entry point.
//
///////////////////////////////////////////////////////////////////////////////
void main()
{
    // Transform the input vertex from world-space to clip-space. (Setting the w-component implements perspective.)
    gl_Position = uMvpTransform * aPosition; 
    gl_Position.w = 1.0 + uPersp*(gl_Position.z + 1.0);

    // Transform the normal as well
    vNormal = mat3(uRotMatrix) * aNormal; 

    // Set varying values
    vPosition = gl_Position;
    vMaterial = aMaterial;
    vColor = aColor;
}
`;



/**
 * Fragment shader.
 * 
 */
Namespace.ShaderCode.gfx_frag_1 = 
`// gfx_frag_1

//<<SYMBOL_DEFS>>//

precision highp float; 
precision highp int;

uniform bool  uRenderDepthMap;
varying vec4  vPosition;
varying vec3  vNormal;
varying vec4  vColor;
varying vec4  vMaterial;


///////////////////////////////////////////////////////////////////////////////
//
// Program entry point.
//
///////////////////////////////////////////////////////////////////////////////
void main()
{
    if (uRenderDepthMap) 
    {
        // Encode the depth in the b and a channels of the output color
        float depth = 65535.0*clamp((vPosition.z+1.0)/2.0, 0.0, 1.0);
        float dHigh = floor(depth/256.0);
        float dLo = (depth - dHigh*256.0);
        gl_FragColor = vec4(0.0, 0.0, dHigh/255.0, dLo/255.0);
    }
    else
    {
        // Apply lighting to the fragment color
        float mAmbient      = vMaterial.r * 2.0;
        float mDiffuse      = vMaterial.g * 2.0;
        float mSpecStrength = vMaterial.b * 2.0;
        float mSpecPower    = vMaterial.a * 255.0;

        vec3 lightDir = vec3(0.0, 0.0, 1.0);
        float cdot = clamp(-dot(normalize(vNormal), lightDir), 0.0, 1.0);
        float diffuse = mDiffuse*(cdot - 0.6);
        float specular = (mSpecStrength == 0.0) ? 0.0 : mSpecStrength * pow(cdot,mSpecPower);
        
        float light = max(0.0, mAmbient + diffuse + specular );   
        gl_FragColor = vec4(vColor.rgb*light, vColor.a);
    }
}
`;


})( window.BigLime = window.BigLime || {} );







/**
 * This file contains the shader code for MIP rendering in WebGL 1.
 * 
 */
;(function(Namespace, undefined) {
	"use strict";
	Namespace.ShaderCode = Namespace.ShaderCode || {};


/**
 * Vertex shader.
 * 
 */
Namespace.ShaderCode.mip_vert_1 =
`// mip_vert_1
//-----------

//<<SYMBOL_DEFS>>//

precision highp float; // We need highp to accurately specify locations in large textures
precision highp int;

uniform mat4   uMvpTransform;
uniform mat4   uMvpInvTransform;
uniform float  uPersp;
attribute vec4 aPosition;
varying vec3   vRayStartT;
varying vec3   vRayDirT;



///////////////////////////////////////////////////////////////////////////////
//
// Program entry point.
//
///////////////////////////////////////////////////////////////////////////////
void main()
{
    // Transform the input vertex from world-space to clip-space. (Setting the w-component implements perspective.)
    gl_Position = uMvpTransform * aPosition;
    float w = gl_Position.w = 1.0 + uPersp*(gl_Position.z + 1.0); 

	// Pass the ray's starting point and direction to the fragment shader (in texture coordinates).
	// Note that scaling of vRayDirT by w is necessary for perspective-correct interpolation.
	vRayStartT = aPosition.xyz + 0.5;
	vRayDirT = w * (uMvpInvTransform * vec4(gl_Position.xy*(uPersp/w), 1.0, 0.0)).xyz;
}
`;




/**
 * Fragment shader.
 * 
 */
Namespace.ShaderCode.mip_frag_1 = 
`// mip_frag_1
//-----------

//<<SYMBOL_DEFS>>//

precision highp float; // We need highp to accurately specify locations in large textures
precision highp int;

// Uniforms and varyings
uniform sampler2D  uSampler;                      // For volumes that fit in a single texture
uniform sampler2D  uSamplers[NUM_IMAGE_TEXTURES]; // For volumes that span multiple textures
uniform sampler2D  uMaskSampler;
uniform bool       uMaskEnabled;
uniform float  uRayStepSize;
uniform vec3   uVolShape;
uniform float  uVolNumImages;
uniform vec4   uMosaicDims;
uniform int    uNumTextures;
uniform float  uSlabInfo[24];
uniform bool   uPickMode;
uniform vec2   uPickPoint;
uniform bool   uShowMarker;
uniform vec3   uMarkerLoc;
uniform float  uMarkerSize;
varying vec3   vRayStartT;
varying vec3   vRayDirT;

// Constants
const float BBoxTol   = 0.002; 
const vec3 BboxMin    = vec3(-BBoxTol);
const vec3 BboxMax    = vec3(1.0 + BBoxTol);
const vec3 Zeros      = vec3(0.0);
const vec3 Ones       = vec3(1.0);
const vec4 ByteMaskRG = vec4(1.0, 256.0, 0.0, 0.0);
const vec4 ByteMaskBA = vec4(0.0, 0.0, 1.0, 256.0);
const vec2 ByteMask   = vec2(1.0, 256.0);
const vec2 ToFloat16  = vec2(256.0, 1.0)/257.0; // For converting a pair of bytes to a float 

// Globals
float NzM1, MxInv, MyInv;
int NumMosaicsM1;
vec2 MinvFirst, MinvLast;
vec3 VolAspect;
#ifdef CLIP_TO_SLAB
vec3 SlabRadii;
mat4 SlabXfrm;
#endif

// Function prototypes
bool calcMipValue(vec3);
bool calcPickLocation(vec3);
float getPixVal(vec3);
vec4 sampleTexture(vec2, int);
vec4 encodeVec3(vec3);
bool isMasked(vec3 pos);
#ifdef CLIP_TO_SLAB
void  initializeSlabInfo(vec3, vec3, out float);
#endif



///////////////////////////////////////////////////////////////////////////////
//
// Program entry point.
//
///////////////////////////////////////////////////////////////////////////////
void main()
{
    // Perform ray casting
	vec3 rayDir = normalize(vRayDirT);	
	bool stat = calcPickLocation(rayDir) || calcMipValue(rayDir);
}


///////////////////////////////////////////////////////////////////////////////
//
// Computes the maximum intensity along a ray.
//
///////////////////////////////////////////////////////////////////////////////
bool calcMipValue(vec3 rayDir)
{
	// Initialize some globals needed by the getPixVal() routines
	NumMosaicsM1 = uNumTextures - 1;	
	NzM1 = uVolNumImages - 1.0;
	MxInv = 1.0/uMosaicDims[0];
	MyInv = 1.0/uMosaicDims[1];    
	MinvFirst = vec2(1.0/uMosaicDims[0], 1.0/uMosaicDims[1]);
	MinvLast  = vec2(1.0/uMosaicDims[2], 1.0/uMosaicDims[3]);
	VolAspect = uVolShape/max(max(uVolShape.x, uVolShape.y), uVolShape.z);
	
	// Initialize the ray
	vec3 pos = vRayStartT;
	vec3 rayStep = rayDir*uRayStepSize;
	float rayToMarkerDist = 10.0;
	bool enteredSlab = false;
	
	// Initialize slab variables
	#ifdef CLIP_TO_SLAB
	float slabOffset;
	initializeSlabInfo(rayDir, pos, slabOffset);
	if (slabOffset - 0.05 > 0.0) { pos += (slabOffset - 0.05)*rayDir; }
	#endif	

	// Walk along the ray
	float maxPixVal = 0.0;
	for (int i = 0; i < 32768; i++)
	{		
		// Check whether the ray has exited the volume
		if ( any(lessThan(pos,BboxMin)) || any(greaterThan(pos,BboxMax)) ) { break; }		

		// Honor any slab constraints
		#ifdef CLIP_TO_SLAB
		vec3 pos_s = (SlabXfrm * vec4(pos, 1.0)).xyz;
		if ( any(greaterThan(abs(pos_s), SlabRadii)) ) {
			if ( enteredSlab ) { break; }
			pos += rayStep;
			continue;
		}
		enteredSlab = true;
		#endif
		
		// Get the current pixel value and compare it with the maximum
		if (!uMaskEnabled || !isMasked(pos)) { 
			maxPixVal = max( maxPixVal, getPixVal(pos) );	
		}	
			
		// Check whether to display a marker
		rayToMarkerDist = min(rayToMarkerDist, length((pos-uMarkerLoc)*VolAspect));	

		pos += rayStep;
	}

	// Encode the 16-bit pixel value in two 8-bit color channels	
	maxPixVal *= 255.0;
	maxPixVal = max(maxPixVal, 1.0); // Don't allow zero, as we use zero to indicate background
	float highByte = floor(maxPixVal/256.0);
	float lowByte = maxPixVal - 256.0*highByte;
	float b = float(uShowMarker) * max(0.0, 1.0-rayToMarkerDist/uMarkerSize);
    gl_FragColor = vec4(lowByte/255.0, highByte/255.0, b, 1.0);
	return true;
}


///////////////////////////////////////////////////////////////////////////////
//
// Computes the location of the maximum intensity point along a ray.
//
///////////////////////////////////////////////////////////////////////////////
bool calcPickLocation(vec3 rayDir)
{
    if (!uPickMode) { return false; }

	float tol = 1.0; // NB: Units here are pixels, not fractional texture coordinates
	if ( (abs(gl_FragCoord.x - uPickPoint.x) > tol) ||  (abs(gl_FragCoord.y - uPickPoint.y) > tol) ) 
	{
		// Skip the computation if this is not the target fragment
		gl_FragColor = vec4(0.0);
	}
	else
	{
        // Initialize some globals
        NumMosaicsM1 = uNumTextures - 1;	
        NzM1 = uVolNumImages - 1.0;
        MxInv = 1.0/uMosaicDims[0];
        MyInv = 1.0/uMosaicDims[1];    
        MinvFirst = vec2(1.0/uMosaicDims[0], 1.0/uMosaicDims[1]);
        MinvLast  = vec2(1.0/uMosaicDims[2], 1.0/uMosaicDims[3]);
		VolAspect = uVolShape/max(max(uVolShape.x, uVolShape.y), uVolShape.z);

		// Initialize the ray
		vec3 pos = vRayStartT;
		vec3 rayStep = rayDir*uRayStepSize;
		bool enteredSlab = false;
		
		// Initialize slab variables
		#ifdef CLIP_TO_SLAB
		float slabOffset;
		initializeSlabInfo(rayDir, pos, slabOffset);
		if (slabOffset - 0.05 > 0.0) { pos += (slabOffset - 0.05)*rayDir; }
		#endif
	
		// Initialize max info
		float maxPixVal = 0.0;
		vec3 maxLoc = vec3(-1.0);

		// Walk along the ray
		for (int i = 0; i < 32768; i++)
		{	
			// Check whether the ray has exited the volume			
			if ( any(lessThan(pos,BboxMin)) || any(greaterThan(pos,BboxMax)) ) { break; }		

			// Honor any slab constraints
			#ifdef CLIP_TO_SLAB
			vec3 pos_s = (SlabXfrm * vec4(pos, 1.0)).xyz;
			if ( any(greaterThan(abs(pos_s), SlabRadii)) ) {
				if ( enteredSlab ) { break; }
				pos += rayStep;
				continue;
			}
			enteredSlab = true;
			#endif
			
			if (!uMaskEnabled || !isMasked(pos)) { 
				float pixVal = getPixVal(pos);
				if (pixVal > maxPixVal) {
					maxPixVal = pixVal;
					maxLoc = pos;	
				}
			}
			pos += rayStep;
		}

		// Encode the max location in the output color	
		gl_FragColor = encodeVec3(maxLoc);
	}
	return true;
}


#ifdef CLIP_TO_SLAB
///////////////////////////////////////////////////////////////////////////////
//
// Initializes slab-related variables.
//
///////////////////////////////////////////////////////////////////////////////
void initializeSlabInfo(vec3 rayDir, vec3 rayStart, out float slabOffset)
{
	// Get the corner points in volume coordinates
	vec3 p0 = vec3(uSlabInfo[0],  uSlabInfo[1],  uSlabInfo[2] );
	vec3 p1 = vec3(uSlabInfo[3],  uSlabInfo[4],  uSlabInfo[5] );
	vec3 p2 = vec3(uSlabInfo[6],  uSlabInfo[7],  uSlabInfo[8] );
	vec3 p3 = vec3(uSlabInfo[9],  uSlabInfo[10], uSlabInfo[11]);
	vec3 p4 = vec3(uSlabInfo[12], uSlabInfo[13], uSlabInfo[14]);
	vec3 p5 = vec3(uSlabInfo[15], uSlabInfo[16], uSlabInfo[17]);
	vec3 p6 = vec3(uSlabInfo[18], uSlabInfo[19], uSlabInfo[20]);
	vec3 p7 = vec3(uSlabInfo[21], uSlabInfo[22], uSlabInfo[23]);

	slabOffset = min( 
		min( min(dot(rayDir, p0), dot(rayDir, p1)), min(dot(rayDir, p2), dot(rayDir, p3)) ),
		min( min(dot(rayDir, p4), dot(rayDir, p5)), min(dot(rayDir, p6), dot(rayDir, p7)) ) 
	);
	slabOffset -= dot(rayStart, rayDir);

	// Get the slab axes and center
	p0 *= VolAspect;
	p1 *= VolAspect;
	p2 *= VolAspect;
	p4 *= VolAspect;
	p7 *= VolAspect;
	vec3 slabAxis0 = normalize(p1 - p0);
	vec3 slabAxis1 = normalize(p2 - p0);
	vec3 slabAxis2 = normalize(p4 - p0);
	vec3 slabCtr = (p0 + p7) / 2.0;

	SlabRadii = vec3(length(p1-p0)/2.0, length(p2-p0)/2.0, length(p4-p0)/2.0);

	// Construct the transformation matrix from texture coordinates to slab coordinates
	SlabXfrm = mat4(
		VolAspect.x*slabAxis0.x,  VolAspect.x*slabAxis1.x,  VolAspect.x*slabAxis2.x,  0.0,
		VolAspect.y*slabAxis0.y,  VolAspect.y*slabAxis1.y,  VolAspect.y*slabAxis2.y,  0.0,
		VolAspect.z*slabAxis0.z,  VolAspect.z*slabAxis1.z,  VolAspect.z*slabAxis2.z,  0.0,
       -dot(slabCtr, slabAxis0), -dot(slabCtr, slabAxis1), -dot(slabCtr, slabAxis2),  1.0
	);
}
#endif


///////////////////////////////////////////////////////////////////////////////
//
// Encodes the components of a vec3 in an rgba color.
//
///////////////////////////////////////////////////////////////////////////////
vec4 encodeVec3(vec3 loc)
{
	if ( any(lessThan(loc,Zeros)) || any(greaterThan(loc,Ones)) ) 
	{
		// We indicate an invalid value by setting the rightmost bit
		return vec4(0.0, 0.0, 0.0, 1.0);
	}	

	// Use 10 bits for each coordinate
	highp int xi = int( min(1023.0, (loc.x*1023.0 + 0.5)) );
	highp int yi = int( min(1023.0, (loc.y*1023.0 + 0.5)) );
	highp int zi = int( min(1023.0, (loc.z*1023.0 + 0.5)) );

	int zLo = zi - (zi/128) * 128;
	int zHi = (zi - zLo)/128;

	int yLo = yi - (yi/32) * 32;
	int yHi = (yi - yLo)/32;

	int xLo = xi - (xi/8) * 8;
	int xHi = (xi - xLo)/8;

	float a = float(zLo*2)/255.0;
	float b = float(zHi + 8*yLo)/255.0;
	float g = float(yHi + 32*xLo)/255.0;
	float r = float(xHi)/255.0;

	return vec4(r, g, b, a);
}



#ifdef PIXEL_LAYOUT_16BIT_NN_ST
///////////////////////////////////////////////////////////////////////////////
//
// Gets the pixel value at a given volume point. 
//
///////////////////////////////////////////////////////////////////////////////
float getPixVal(vec3 pos)
{
	// Return zero if pos is outside the volume
	if ( any(greaterThan(pos,Ones)) || any(lessThan(pos,Zeros)) ) { return 0.0; }

	// Determine the nearby slice
	float z = pos.z * NzM1;	
	float slice = floor(z);

	// Calculate the texture coordinate factors
	float temp = floor(slice*0.5) * MxInv;
	float yOffset = floor(temp);
	float xOffset = temp - yOffset;	
	if (xOffset > 0.9999) { xOffset = 0.0;  yOffset += 1.0; } // Fix for occasional round-off problems
	
	// Sample the texture
	vec2 tc = vec2( xOffset + pos.x*MxInv, (yOffset + pos.y)*MyInv );	
	vec4 samp = texture2D(uSampler, tc);

	// Recombine the appropriate (r,g,b,a) components to get the 16-bit pixel value
	vec4 byteMask = mix( ByteMaskRG, ByteMaskBA, mod(slice,2.0) );
	return dot(samp, byteMask);
}
#endif




#ifdef PIXEL_LAYOUT_16BIT_LIN_ST
///////////////////////////////////////////////////////////////////////////////
//
// Gets the pixel value at a given volume point.
//
///////////////////////////////////////////////////////////////////////////////
float getPixVal(vec3 pos)
{
	// Return zero if pos is outside the volume
	if ( any(greaterThan(pos,Ones)) || any(lessThan(pos,Zeros)) ) { return 0.0; }

	// Determine the nearby slice
	float z = pos.z * NzM1;	
	float sliceBelow = floor(z);

	// Calculate the texture coordinate factors
	float temp = floor(sliceBelow*0.5) * MxInv;
	float yOffsetB = floor(temp);
	float xOffsetB = temp - yOffsetB;	
	if (xOffsetB > 0.9999) { xOffsetB = 0.0;  yOffsetB += 1.0; } // Fix for occasional round-off problems

	// Sample the texture
	vec2 tcB = vec2( xOffsetB + pos.x*MxInv, (yOffsetB + pos.y)*MyInv );	
	vec4 sampB = texture2D(uSampler, tcB);

	// Recombine the appropriate (r,g,b,a) components to get the 16-bit pixel values
	float pixValA, pixValB;
	bool sliceBelowIsEven = ( mod(sliceBelow, 2.0) < 0.5 );
	if ( sliceBelowIsEven ) 
	{
		pixValB = dot(sampB.rg, ByteMask);
		pixValA = dot(sampB.ba, ByteMask);
	} 
	else // The bracketing slices are in different tiles, so we have more work to do
	{	
		float sliceAbove = min(sliceBelow + 1.0, NzM1);
		temp = floor(sliceAbove*0.5) * MxInv;
		float yOffsetA = floor(temp);		
		float xOffsetA = temp - yOffsetA;
		if (xOffsetA > 0.9999) { xOffsetA = 0.0;  yOffsetA += 1.0; } // Fix for occasional round-off problems

		vec2 tcA = vec2( xOffsetA + pos.x*MxInv, (yOffsetA + pos.y)*MyInv );
		vec4 sampA = texture2D(uSampler, tcA);
		
		pixValB = dot(sampB.ba, ByteMask);
		pixValA = dot(sampA.rg, ByteMask); 
	} 		
	
	return mix( pixValB, pixValA, z-sliceBelow );
}
#endif




#ifdef PIXEL_LAYOUT_8BIT_NN_ST
///////////////////////////////////////////////////////////////////////////////
//
// Gets the pixel value at a given volume point.
//
///////////////////////////////////////////////////////////////////////////////
float getPixVal(vec3 pos)
{
	// Return zero if pos is outside the volume
	if ( any(greaterThan(pos,Ones)) || any(lessThan(pos,Zeros)) ) { return 0.0; }

	// Determine the nearby slice
	float z = pos.z * NzM1;	
	float slice = floor(z);

	// Calculate the texture coordinate factors
	float temp = floor(slice*0.25) * MxInv;
	float yOffset = floor(temp);
	float xOffset = temp - yOffset;	
	if (xOffset > 0.9999) { xOffset = 0.0;  yOffset += 1.0; } // Fix for occasional round-off problems
	
	// Sample the texture
	vec2 tc = vec2( xOffset + pos.x*MxInv, (yOffset + pos.y)*MyInv );	
	vec4 samp = texture2D(uSampler, tc);

	// Pick out the appropriate (r,g,b,a) component
	int c = int( mod(slice, 4.0) );
	vec4 byteMask = vec4( float(c==0), float(c==1), float(c==2), float(c==3) );
	return dot(samp, byteMask);
}
#endif




#ifdef PIXEL_LAYOUT_8BIT_LIN_ST
///////////////////////////////////////////////////////////////////////////////
//
// Gets the pixel value at a given volume point.
//
///////////////////////////////////////////////////////////////////////////////
float getPixVal(vec3 pos)
{
	// Return zero if pos is outside the volume
	if ( any(greaterThan(pos,Ones)) || any(lessThan(pos,Zeros)) ) { return 0.0; }

	// Determine the nearby slice
	float z = pos.z * NzM1;	
	float sliceBelow = floor(z);

	// Calculate the texture coordinate factors
	float temp = floor(sliceBelow*0.25) * MxInv;
	float yOffsetB = floor(temp);
	float xOffsetB = temp - yOffsetB;	
	if (xOffsetB > 0.9999) { xOffsetB = 0.0;  yOffsetB += 1.0; } // Fix for occasional round-off problems

	// Sample the texture
	vec2 tcB = vec2( xOffsetB + pos.x*MxInv, (yOffsetB + pos.y)*MyInv );	
	vec4 sampB = texture2D(uSampler, tcB);

	// Pick out the appropriate (r,g,b,a) component
	float pixValA, pixValB;
	int colorChannel = int( mod(sliceBelow, 4.0) );
	if (colorChannel < 3) 
	{
		vec3 byteMask = vec3( float(colorChannel==0), float(colorChannel==1), float(colorChannel==2) );
		pixValB = dot(sampB.rgb, byteMask); 
		pixValA = dot(sampB.gba, byteMask); 
	} 
	else // The bracketing slices are in different tiles, so we have more work to do
	{	
		float sliceAbove = min(sliceBelow + 1.0, NzM1);
		temp = floor(sliceAbove*0.25) * MxInv;
		float yOffsetA = floor(temp);		
		float xOffsetA = temp - yOffsetA;
		if (xOffsetA > 0.9999) { xOffsetA = 0.0;  yOffsetA += 1.0; } // Fix for occasional round-off problems

		vec2 tcA = vec2( xOffsetA + pos.x*MxInv, (yOffsetA + pos.y)*MyInv );
		vec4 sampA = texture2D(uSampler, tcA);

		pixValB = sampB.a;
		pixValA = sampA.r;
	} 		
	
	return mix( pixValB, pixValA, z-sliceBelow );
}
#endif
 


#ifdef PIXEL_LAYOUT_16BIT_NN_MT
///////////////////////////////////////////////////////////////////////////////
//
// Gets the pixel value at a given volume point.
//
///////////////////////////////////////////////////////////////////////////////
float getPixVal(vec3 pos)
{
	// Return zero if pos is outside the volume
	if ( any(greaterThan(pos,Ones)) || any(lessThan(pos,Zeros)) ) { return 0.0; }

	// Determine the nearby slice
	float z = pos.z * NzM1;	
	float slice = floor(z);
	
	// Determine the tile and mosaic indices
    float NumSlicesInFirstMosaic = 2.0*uMosaicDims[0]*uMosaicDims[1];
	int mosaicIndex = int( floor(slice/NumSlicesInFirstMosaic) );
	float sliceWithinMosaic = mod(slice, NumSlicesInFirstMosaic);

	// Compute the texture coordinates
	vec2 mInv = (mosaicIndex == NumMosaicsM1) ? MinvLast : MinvFirst;
	float temp = floor(sliceWithinMosaic*0.5) * mInv.x;
	float yOffset = floor(temp);
	float xOffset = temp - yOffset;
	if (xOffset > 0.9999) { xOffset = 0.0;  yOffset += 1.0; } // Fix for occasional round-off problems
	vec2 tc = vec2( xOffset + pos.x*mInv.x,  (yOffset + pos.y)*mInv.y );	

	// Sample the texture
	vec4 samp = sampleTexture(tc, mosaicIndex);

	// Recombine the appropriate (r,g,b,a) components to get the 16-bit pixel value
	vec4 byteMask = mix( ByteMaskRG, ByteMaskBA, mod(slice,2.0) );
	return dot(samp, byteMask);
}
#endif




#ifdef PIXEL_LAYOUT_16BIT_LIN_MT
///////////////////////////////////////////////////////////////////////////////
//
// Gets the pixel value at a given volume point.
//
///////////////////////////////////////////////////////////////////////////////
float getPixVal(vec3 pos)
{
	// Return zero if pos is outside the volume
	if ( any(greaterThan(pos,Ones)) || any(lessThan(pos,Zeros)) ) { return 0.0; }

	// Determine the nearby slice
	float z = pos.z * NzM1;	
	float sliceBelow = floor(z);

	// Determine the tile and mosaic indices	
    float NumSlicesInFirstMosaic = 2.0*uMosaicDims[0]*uMosaicDims[1];
	int mosaicIndexBelow = int( floor(sliceBelow/NumSlicesInFirstMosaic) );
	float sliceBelowWithinMosaic = mod(sliceBelow, NumSlicesInFirstMosaic);
	
	// Compute the texture coordinates
	vec2 mBInv = (mosaicIndexBelow == NumMosaicsM1) ? MinvLast : MinvFirst;
	float temp = floor(sliceBelowWithinMosaic*0.5) * mBInv.x;
	float yOffsetB = floor(temp);
	float xOffsetB = temp - yOffsetB;
	if (xOffsetB > 0.9999) { xOffsetB = 0.0;  yOffsetB += 1.0; } // Fix for occasional round-off problems
	vec2 tcB = vec2( xOffsetB + pos.x*mBInv.x,  (yOffsetB + pos.y)*mBInv.y );	

	// Sample the texture
	vec4 sampB = sampleTexture(tcB, mosaicIndexBelow);

	// Pick out the appropriate (r,g,b,a) component
	float pixValA, pixValB;
	bool sliceBelowIsEven = ( mod(sliceBelow, 2.0) < 0.5 );
	if (sliceBelowIsEven) 
	{
		pixValB = dot(sampB, ByteMaskRG); 
		pixValA = dot(sampB, ByteMaskBA); 
	} 
	else // The bracketing slices are in different tiles, so we have more work to do
	{	
		float sliceAbove = min(sliceBelow + 1.0, NzM1);		
		int mosaicIndexAbove = int( floor(sliceAbove/NumSlicesInFirstMosaic) );	
	    float sliceAboveWithinMosaic = mod(sliceAbove, NumSlicesInFirstMosaic);
		vec2 mAInv = (mosaicIndexAbove == NumMosaicsM1) ? MinvLast : MinvFirst;

		float temp = ( floor(sliceAboveWithinMosaic*0.5) * mAInv.x );
		float yOffsetA = floor(temp);		
		float xOffsetA = temp - yOffsetA;
		if (xOffsetA > 0.9999) { xOffsetA = 0.0;  yOffsetA += 1.0; } // Fix for occasional round-off problems
		vec2 tcA = vec2( xOffsetA + pos.x*mAInv.x,   (yOffsetA + pos.y)*mAInv.y );

		vec4 sampA = sampleTexture(tcA, mosaicIndexAbove);
		pixValB = dot(sampB, ByteMaskBA);
		pixValA = dot(sampA, ByteMaskRG);
	} 		
	
	return mix( pixValB, pixValA, z-sliceBelow );
}
#endif




#ifdef PIXEL_LAYOUT_8BIT_NN_MT
///////////////////////////////////////////////////////////////////////////////
//
// Gets the pixel value at a given volume point.
//
///////////////////////////////////////////////////////////////////////////////
float getPixVal(vec3 pos)
{
	// Return zero if pos is outside the volume
	if ( any(greaterThan(pos,Ones)) || any(lessThan(pos,Zeros)) ) { return 0.0; }

	// Determine the nearby slice
	float z = pos.z * NzM1;	
	float slice = floor(z);
	
	// Determine the tile and mosaic indices	
    float NumSlicesInFirstMosaic = 4.0*uMosaicDims[0]*uMosaicDims[1];
	int mosaicIndex = int( floor(slice/NumSlicesInFirstMosaic) );
	float sliceWithinMosaic = mod(slice, NumSlicesInFirstMosaic);

	// Compute the texture coordinates
	vec2 mInv = (mosaicIndex == NumMosaicsM1) ? MinvLast : MinvFirst;
	float temp = floor(sliceWithinMosaic*0.25) * mInv.x;
	float yOffset = floor(temp);
	float xOffset = temp - yOffset;
	if (xOffset > 0.9999) { xOffset = 0.0;  yOffset += 1.0; } // Fix for occasional round-off problems
	vec2 tc = vec2( xOffset + pos.x*mInv.x,  (yOffset + pos.y)*mInv.y );	

	// Sample the texture
	vec4 samp = sampleTexture(tc, mosaicIndex);

	// Pick out the appropriate (r,g,b,a) component
	int c = int( mod(slice, 4.0) );
	vec4 byteMask = vec4( float(c==0), float(c==1), float(c==2), float(c==3) );
	return dot(samp, byteMask);
}
#endif




#ifdef PIXEL_LAYOUT_8BIT_LIN_MT
///////////////////////////////////////////////////////////////////////////////
//
// Gets the pixel value at a given volume point.
//
///////////////////////////////////////////////////////////////////////////////
float getPixVal(vec3 pos)
{
	// Return zero if pos is outside the volume
	if ( any(greaterThan(pos,Ones)) || any(lessThan(pos,Zeros)) ) { return 0.0; }

	// Determine the nearby slice
	float z = pos.z * NzM1;	
	float sliceBelow = floor(z);

	// Determine the tile and mosaic indices	
    float NumSlicesInFirstMosaic = 4.0*uMosaicDims[0]*uMosaicDims[1];
	int mosaicIndexBelow = int( floor(sliceBelow/NumSlicesInFirstMosaic) );
	float sliceBelowWithinMosaic = mod(sliceBelow, NumSlicesInFirstMosaic);
	
	// Compute the texture coordinates
	vec2 mBInv = (mosaicIndexBelow == NumMosaicsM1) ? MinvLast : MinvFirst;
	float temp = floor(sliceBelowWithinMosaic*0.25) * mBInv.x;
	float yOffsetB = floor(temp);
	float xOffsetB = temp - yOffsetB;
	if (xOffsetB > 0.9999) { xOffsetB = 0.0;  yOffsetB += 1.0; } // Fix for occasional round-off problems
	vec2 tcB = vec2( xOffsetB + pos.x*mBInv.x,  (yOffsetB + pos.y)*mBInv.y );	

	// Sample the texture
	vec4 sampB = sampleTexture(tcB, mosaicIndexBelow);

	// Pick out the appropriate (r,g,b,a) components
	float pixValA, pixValB;
	int colorChannel = int( mod(sliceBelow, 4.0) );
	if (colorChannel < 3) 
	{
		vec3 byteMask = vec3( float(colorChannel==0), float(colorChannel==1), float(colorChannel==2) );
		pixValB = dot(sampB.rgb, byteMask); 
		pixValA = dot(sampB.gba, byteMask); 
	} 
	else // The bracketing slices are in different tiles, so we have more work to do
	{	
		float sliceAbove = min(sliceBelow + 1.0, NzM1);		
		int mosaicIndexAbove = int( floor(sliceAbove/NumSlicesInFirstMosaic) );	
	    float sliceAboveWithinMosaic = mod(sliceAbove, NumSlicesInFirstMosaic);
		vec2 mAInv = (mosaicIndexAbove == NumMosaicsM1) ? MinvLast : MinvFirst;

		float temp = ( floor(sliceAboveWithinMosaic*0.25) * mAInv.x );
		float yOffsetA = floor(temp);		
		float xOffsetA = temp - yOffsetA;
		if (xOffsetA > 0.9999) { xOffsetA = 0.0;  yOffsetA += 1.0; } // Fix for occasional round-off problems
		vec2 tcA = vec2( xOffsetA + pos.x*mAInv.x,   (yOffsetA + pos.y)*mAInv.y );

		vec4 sampA = sampleTexture(tcA, mosaicIndexAbove);
		pixValB = sampB.a;
		pixValA = sampA.r;
	} 		
	
	return mix( pixValB, pixValA, z-sliceBelow );
}
#endif



///////////////////////////////////////////////////////////////////////////////
//
// Samples a given texture at a given texture coordinate.
//
///////////////////////////////////////////////////////////////////////////////
vec4 sampleTexture(vec2 tc, int textureIndex)
{
	// Performance seems to be better if we unroll the first few terms:
	if (textureIndex == 0) {
		return texture2D(uSamplers[0], tc);
	}
	#if NUM_IMAGE_TEXTURES >= 2
	else if (textureIndex == 1) {
		return texture2D(uSamplers[1], tc);
	} 
	#if NUM_IMAGE_TEXTURES >= 3
	else if (textureIndex == 2) {
		return texture2D(uSamplers[2], tc);
	} 
	#if NUM_IMAGE_TEXTURES >= 4
	else if (textureIndex == 3) {
		return texture2D(uSamplers[3], tc);
	} 
	#endif
	#endif
	#endif
	else 
	{
		for (int i=4; i<NUM_IMAGE_TEXTURES; i++) 
		{
			if (i == textureIndex) { return texture2D(uSamplers[i], tc);}
		}
	}
} 


///////////////////////////////////////////////////////////////////////////////
//
// Determines whether a given volume point is masked.
//
///////////////////////////////////////////////////////////////////////////////
bool isMasked(vec3 pos)
{
	vec2 ToFloat16le = vec2(1.0, 256.0)/257.0;
	vec4 maskSamp = texture2D(uMaskSampler, pos.xy);
	return (pos.z < dot(maskSamp.rg, ToFloat16le)) || (1.0 - pos.z < dot(maskSamp.ba, ToFloat16le));
}
`;


})( window.BigLime = window.BigLime || {} );







/**
 * This file contains the WebGL1 shader code for rendering shadow maps. 
 * 
 */
;(function(Namespace, undefined) {
	"use strict";
	Namespace.ShaderCode = Namespace.ShaderCode || {};



/**
 * Vertex shader.
 * 
 */
Namespace.ShaderCode.shadows_vert_1 = 
`// shadows_vert_1

//<<SYMBOL_DEFS>>//

precision highp float; // We need highp to accurately specify locations in large textures
precision highp int;

uniform mat4   uShadowMvpTransform;
uniform mat4   uShadowMvpInvTransform;
attribute vec4 aPosition;
varying vec3   vRayStartT;
varying vec3   vRayDirT;


///////////////////////////////////////////////////////////////////////////////
//
// Program entry point.
//
///////////////////////////////////////////////////////////////////////////////
void main()
{
    // Transform the input vertex from world-space to clip-space
    gl_Position = uShadowMvpTransform * aPosition; 

    // Pass the ray's starting point and direction, in texture coordinates, to the fragment shader
    vRayStartT = aPosition.xyz + 0.5;
	vRayDirT = (uShadowMvpInvTransform * vec4(0.0, 0.0, 1.0, 0.0)).xyz;
}
`;



/**
 * Fragment shader.
 * 
 */
Namespace.ShaderCode.shadows_frag_1 = 
`// shadows_frag_1

//<<SYMBOL_DEFS>>//

precision highp float; // We need highp to accurately specify locations in large textures
precision highp int;
precision highp sampler2D;

// Uniforms and varyings
uniform sampler2D  uSampler;                      // For volumes that fit in a single texture
uniform sampler2D  uSamplers[NUM_IMAGE_TEXTURES]; // For volumes that are split across multiple textures
uniform sampler2D  uLutSampler;
uniform sampler2D  uMaskSampler;
uniform bool       uMaskEnabled;
uniform vec3   uVolShape;
uniform float  uVolNumImages;
uniform vec4   uMosaicDims;
uniform int    uNumTextures;
uniform float  uRayStepSize;
uniform float  uOpacityRange[2];
uniform float  uSlabInfo[24];
uniform mat4   uShadowMvpTransform;

varying  vec3  vRayStartT;
varying  vec3  vRayDirT;

// Constants
const vec3 Ones             = vec3(1.0);
const vec3 Zeros            = vec3(0.0);
const float BBoxTol         = 0.002; 
const vec3 BboxMin          = vec3(-BBoxTol);
const vec3 BboxMax          = vec3(1.0+BBoxTol);
const float TransparencySat = 0.02; // Saturation value
const vec2 ToFloat16        = vec2(256.0, 1.0)/257.0; // For converting a pair of bytes to a float 
const vec4 ByteMaskRG       = vec4(1.0, 256.0, 0.0, 0.0);
const vec4 ByteMaskBA       = vec4(0.0, 0.0, 1.0, 256.0);
const vec2 ByteMask         = vec2(1.0, 256.0);

// Globals
float PixScale, PixOffset;
float NzM1, MxInv, MyInv;
int NumMosaicsM1;
vec2 MinvFirst, MinvLast; 
vec3 VolAspect;
#ifdef CLIP_TO_SLAB
vec3 SlabRadii, SlabAxes[3];
mat4 SlabXfrm;
#endif

// Function prototypes
vec4 renderShadowMap(vec3);
float getNormalizedPixVal(vec3);
vec4  sampleTexture(vec2, int);
vec4  encodeFloat(float);
bool isMasked(vec3 pos);
#ifdef CLIP_TO_SLAB
void  initializeSlabInfo(vec3, vec3, out float);
#endif


///////////////////////////////////////////////////////////////////////////////
//
// Program entry point.
//
///////////////////////////////////////////////////////////////////////////////
void main()
{
	// Initialize globals
	PixScale  = 255.0 * uOpacityRange[1];
	PixOffset = uOpacityRange[0] * uOpacityRange[1];

	// Compute the shadow map
    gl_FragColor = renderShadowMap( normalize(vRayDirT) );
}


///////////////////////////////////////////////////////////////////////////////
//
// Computes the shadow map.
//
///////////////////////////////////////////////////////////////////////////////
vec4 renderShadowMap(vec3 rayDir)
{
	// Initialize some globals
	NumMosaicsM1 = uNumTextures - 1;	
	NzM1 = uVolNumImages - 1.0;
	MxInv = 1.0/uMosaicDims[0];
	MyInv = 1.0/uMosaicDims[1];
	MinvFirst = vec2(1.0/uMosaicDims[0], 1.0/uMosaicDims[1]);
	MinvLast  = vec2(1.0/uMosaicDims[2], 1.0/uMosaicDims[3]);
	VolAspect = uVolShape/max(max(uVolShape.x, uVolShape.y), uVolShape.z);
	
	// Initialize locals
	float stepSize   = uRayStepSize;
	vec3  rayStep    = stepSize * rayDir;
	float opacityExp = stepSize * 128.0;
	float bestDelta  = -1.0; 
	float bestDepth  =  1.0;
	vec4 shadowMvp   = vec4(uShadowMvpTransform[0][2], uShadowMvpTransform[1][2], uShadowMvpTransform[2][2], uShadowMvpTransform[3][2]);

	// Initialize the ray
	vec3 pos        = vRayStartT;
	float tTot      = 1.0;
	float tBase     = 1.0;
	bool climbing   = false;
	bool enteredSlab = false;
	
	// Initialize slab variables
	#ifdef CLIP_TO_SLAB
	float slabOffset;
	initializeSlabInfo(rayDir, pos, slabOffset);
	if (slabOffset - 0.05 > 0.0) { pos += (slabOffset - 0.05)*rayDir; }
	#endif

	// Walk along the ray, looking for the largest jump in opacity
	for (int i = 0; i < 32768; i++)
	{		
		// Honor any slab constraints
		#ifdef CLIP_TO_SLAB
		vec3 pos_s = (SlabXfrm * vec4(pos, 1.0)).xyz;
		if ( any(greaterThan(abs(pos_s), SlabRadii)) ) {
			if ( enteredSlab ) { break; }
			stepSize = 2.0*uRayStepSize;
			rayStep = stepSize*rayDir;			
			pos += rayStep; 
			continue;
		}
		enteredSlab = true;
		#endif

		if (uMaskEnabled && isMasked(pos)) { 
			pos += rayStep; 
			continue; 
		}
			
		// Get the cuurent voxel's opacity 
		float opac = texture2D( uLutSampler, vec2(getNormalizedPixVal(pos), LUT_TX_YOFFSET)).a;
		if (opac == 0.0)
		{
			// We have entered an empty-space region, so increase the stepsize
			stepSize = 2.0*uRayStepSize;
			rayStep = stepSize*rayDir;
		}
		else if (stepSize > 1.5*uRayStepSize) 
		{
			// Revert to normal-size steps, and back-up a bit
			stepSize = uRayStepSize;
			rayStep = stepSize*rayDir;
			pos -= rayStep;
			opac = texture2D( uLutSampler, vec2(getNormalizedPixVal(pos), LUT_TX_YOFFSET)).a;
		}

		// Update the accumulated transparency
		float t = pow(max(0.0, 1.0-opac), opacityExp);
		tBase = mix(tBase, tTot, float(!climbing));
		tTot *= t;
		climbing = climbing || (t < 0.99);

		// Check whether we are ending a climb, or maybe even the whole ray
		vec3 nextPos = pos + rayStep;
		bool terminateRay = (tTot < TransparencySat) || any(lessThan(nextPos, BboxMin)) || any(greaterThan(nextPos, BboxMax));
		if ( climbing && ((t >= 0.99) || terminateRay) ) // We are ending a climb
		{
			climbing = false;
			float delta = tBase - tTot; 
			float improved = float(delta > bestDelta);
			bestDelta = mix(bestDelta, delta, improved);
			bestDepth = mix(bestDepth, dot(shadowMvp, vec4(pos-0.5, 1.0)), improved);
			terminateRay = terminateRay || (bestDelta >= tTot);  				
		}
		if (terminateRay) { break; }

		pos = nextPos;
	}
	
	// Return the best depth estimate
	float d = (bestDepth + 1.0)/2.0; // Ranges between 0.0 and 1.0
	return encodeFloat(d);
}


#ifdef CLIP_TO_SLAB
///////////////////////////////////////////////////////////////////////////////
//
// Initializes slab-related variables.
//
///////////////////////////////////////////////////////////////////////////////
void initializeSlabInfo(vec3 rayDir, vec3 rayStart, out float slabOffset)
{
	// Get the corner points in volume coordinates
	vec3 p0 = vec3(uSlabInfo[0],  uSlabInfo[1],  uSlabInfo[2] );
	vec3 p1 = vec3(uSlabInfo[3],  uSlabInfo[4],  uSlabInfo[5] );
	vec3 p2 = vec3(uSlabInfo[6],  uSlabInfo[7],  uSlabInfo[8] );
	vec3 p3 = vec3(uSlabInfo[9],  uSlabInfo[10], uSlabInfo[11]);
	vec3 p4 = vec3(uSlabInfo[12], uSlabInfo[13], uSlabInfo[14]);
	vec3 p5 = vec3(uSlabInfo[15], uSlabInfo[16], uSlabInfo[17]);
	vec3 p6 = vec3(uSlabInfo[18], uSlabInfo[19], uSlabInfo[20]);
	vec3 p7 = vec3(uSlabInfo[21], uSlabInfo[22], uSlabInfo[23]);

	slabOffset = min( 
		min( min(dot(rayDir, p0), dot(rayDir, p1)), min(dot(rayDir, p2), dot(rayDir, p3)) ),
		min( min(dot(rayDir, p4), dot(rayDir, p5)), min(dot(rayDir, p6), dot(rayDir, p7)) ) 
	);
	slabOffset -= dot(rayStart, rayDir);

	// Get the slab axes and center
	p0 *= VolAspect;
	p1 *= VolAspect;
	p2 *= VolAspect;
	p4 *= VolAspect;
	p7 *= VolAspect;
	SlabAxes[0] = normalize(p1 - p0);
	SlabAxes[1] = normalize(p2 - p0);
	SlabAxes[2] = normalize(p4 - p0);
	vec3 slabCtr = (p0 + p7) / 2.0;

	SlabRadii = vec3(length(p1-p0)/2.0, length(p2-p0)/2.0, length(p4-p0)/2.0);

	// Construct the transformation matrix from texture coordinates to slab coordinates
	SlabXfrm = mat4(
		VolAspect.x*SlabAxes[0].x,  VolAspect.x*SlabAxes[1].x,  VolAspect.x*SlabAxes[2].x,  0.0,
		VolAspect.y*SlabAxes[0].y,  VolAspect.y*SlabAxes[1].y,  VolAspect.y*SlabAxes[2].y,  0.0,
		VolAspect.z*SlabAxes[0].z,  VolAspect.z*SlabAxes[1].z,  VolAspect.z*SlabAxes[2].z,  0.0,
       -dot(slabCtr, SlabAxes[0]), -dot(slabCtr, SlabAxes[1]), -dot(slabCtr, SlabAxes[2]),  1.0
	);
}
#endif

///////////////////////////////////////////////////////////////////////////////
//
// Encodes a float value in the first two components of a vec4.
//
///////////////////////////////////////////////////////////////////////////////
vec4 encodeFloat(float val)
{
	float cVal = 65535.0 * clamp(val, 0.0, 1.0);
	float dHi = floor(cVal/256.0);
	float dLo = cVal - dHi*256.0;
	return vec4(dHi/255.0, dLo/255.0, 0.0, 1.0);
}



///////////////////////////////////////////////////////////////////////////////
//
// Samples a given texture at a given texture coordinate.
//
///////////////////////////////////////////////////////////////////////////////
vec4 sampleTexture(vec2 tc, int textureIndex)
{
	// Performance seems to be better if we unroll the first few terms:
	if (textureIndex == 0) {
		return texture2D(uSamplers[0], tc);
	}
	#if NUM_IMAGE_TEXTURES >= 2
	else if (textureIndex == 1) {
		return texture2D(uSamplers[1], tc);
	} 
	#if NUM_IMAGE_TEXTURES >= 3
	else if (textureIndex == 2) {
		return texture2D(uSamplers[2], tc);
	} 
	#if NUM_IMAGE_TEXTURES >= 4
	else if (textureIndex == 3) {
		return texture2D(uSamplers[3], tc);
	} 
	#endif
	#endif
	#endif
	else 
	{
		for (int i=4; i<NUM_IMAGE_TEXTURES; i++) 
		{
			if (i == textureIndex) { return texture2D(uSamplers[i], tc);}
		}
	}
} 



#ifdef PIXEL_LAYOUT_16BIT_NN_ST
///////////////////////////////////////////////////////////////////////////////
//
// Gets the pixel value at a given volume point. 
//
///////////////////////////////////////////////////////////////////////////////
float getNormalizedPixVal(vec3 pos)
{
	// Return zero if pos is outside the volume
	if ( any(greaterThan(pos,Ones)) || any(lessThan(pos,Zeros)) ) { return 0.0; }

	// Determine the nearby slice
	float z = pos.z * NzM1;	
	float slice = floor(z);

	// Calculate the texture coordinate factors
	float temp = floor(slice*0.5) * MxInv;
	float yOffset = floor(temp);
	float xOffset = temp - yOffset;	
	if (xOffset > 0.9999) { xOffset = 0.0;  yOffset += 1.0; } // Fix for occasional round-off problems
	
	// Sample the texture
	vec2 tc = vec2( xOffset + pos.x*MxInv, (yOffset + pos.y)*MyInv );	
	vec4 samp = texture2D(uSampler, tc);

	// Recombine the appropriate (r,g,b,a) components to get the 16-bit pixel value
	vec4 byteMask = mix( ByteMaskRG, ByteMaskBA, mod(slice,2.0) );
	float pixVal = dot(samp, byteMask);
	return clamp(pixVal*PixScale - PixOffset, 0.0, 1.0);		
}
#endif




#ifdef PIXEL_LAYOUT_16BIT_LIN_ST
///////////////////////////////////////////////////////////////////////////////
//
// Gets the pixel value at a given volume point.
//
///////////////////////////////////////////////////////////////////////////////
float getNormalizedPixVal(vec3 pos)
{
	// Return zero if pos is outside the volume
	if ( any(greaterThan(pos,Ones)) || any(lessThan(pos,Zeros)) ) { return 0.0; }

	// Determine the nearby slice
	float z = pos.z * NzM1;	
	float sliceBelow = floor(z);

	// Calculate the texture coordinate factors
	float temp = floor(sliceBelow*0.5) * MxInv;
	float yOffsetB = floor(temp);
	float xOffsetB = temp - yOffsetB;	
	if (xOffsetB > 0.9999) { xOffsetB = 0.0;  yOffsetB += 1.0; } // Fix for occasional round-off problems

	// Sample the texture
	vec2 tcB = vec2( xOffsetB + pos.x*MxInv, (yOffsetB + pos.y)*MyInv );	
	vec4 sampB = texture2D(uSampler, tcB);

	// Recombine the appropriate (r,g,b,a) components to get the 16-bit pixel values
	float pixValA, pixValB;
	bool sliceBelowIsEven = ( mod(sliceBelow, 2.0) < 0.5 );
	if ( sliceBelowIsEven ) 
	{
		pixValB = dot(sampB.rg, ByteMask);
		pixValA = dot(sampB.ba, ByteMask);
	} 
	else // The bracketing slices are in different tiles, so we have more work to do
	{	
		float sliceAbove = min(sliceBelow + 1.0, NzM1);
		temp = floor(sliceAbove*0.5) * MxInv;
		float yOffsetA = floor(temp);		
		float xOffsetA = temp - yOffsetA;
		if (xOffsetA > 0.9999) { xOffsetA = 0.0;  yOffsetA += 1.0; } // Fix for occasional round-off problems

		vec2 tcA = vec2( xOffsetA + pos.x*MxInv, (yOffsetA + pos.y)*MyInv );
		vec4 sampA = texture2D(uSampler, tcA);
		
		pixValB = dot(sampB.ba, ByteMask);
		pixValA = dot(sampA.rg, ByteMask); 
	} 		
	
	float pixVal = mix( pixValB, pixValA, z-sliceBelow );
	return clamp(pixVal*PixScale - PixOffset, 0.0, 1.0);		
}
#endif




#ifdef PIXEL_LAYOUT_8BIT_NN_ST
///////////////////////////////////////////////////////////////////////////////
//
// Gets the pixel value at a given volume point.
//
///////////////////////////////////////////////////////////////////////////////
float getNormalizedPixVal(vec3 pos)
{
	// Return zero if pos is outside the volume
	if ( any(greaterThan(pos,Ones)) || any(lessThan(pos,Zeros)) ) { return 0.0; }

	// Determine the nearby slice
	float z = pos.z * NzM1;	
	float slice = floor(z);

	// Calculate the texture coordinate factors
	float temp = floor(slice*0.25) * MxInv;
	float yOffset = floor(temp);
	float xOffset = temp - yOffset;	
	if (xOffset > 0.9999) { xOffset = 0.0;  yOffset += 1.0; } // Fix for occasional round-off problems
	
	// Sample the texture
	vec2 tc = vec2( xOffset + pos.x*MxInv, (yOffset + pos.y)*MyInv );	
	vec4 samp = texture2D(uSampler, tc);

	// Pick out the appropriate (r,g,b,a) component
	int c = int( mod(slice, 4.0) );
	vec4 byteMask = vec4( float(c==0), float(c==1), float(c==2), float(c==3) );

	float pixVal = dot(samp, byteMask);
	return clamp(pixVal*PixScale - PixOffset, 0.0, 1.0);			
}
#endif




#ifdef PIXEL_LAYOUT_8BIT_LIN_ST
///////////////////////////////////////////////////////////////////////////////
//
// Gets the pixel value at a given volume point.
//
///////////////////////////////////////////////////////////////////////////////
float getNormalizedPixVal(vec3 pos)
{
	// Return zero if pos is outside the volume
	if ( any(greaterThan(pos,Ones)) || any(lessThan(pos,Zeros)) ) { return 0.0; }

	// Determine the nearby slice
	float z = pos.z * NzM1;	
	float sliceBelow = floor(z);

	// Calculate the texture coordinate factors
	float temp = floor(sliceBelow*0.25) * MxInv;
	float yOffsetB = floor(temp);
	float xOffsetB = temp - yOffsetB;	
	if (xOffsetB > 0.9999) { xOffsetB = 0.0;  yOffsetB += 1.0; } // Fix for occasional round-off problems

	// Sample the texture
	vec2 tcB = vec2( xOffsetB + pos.x*MxInv, (yOffsetB + pos.y)*MyInv );	
	vec4 sampB = texture2D(uSampler, tcB);

	// Pick out the appropriate (r,g,b,a) component
	float pixValA, pixValB;
	int colorChannel = int( mod(sliceBelow, 4.0) );
	if (colorChannel < 3) 
	{
		vec3 byteMask = vec3( float(colorChannel==0), float(colorChannel==1), float(colorChannel==2) );
		pixValB = dot(sampB.rgb, byteMask); 
		pixValA = dot(sampB.gba, byteMask); 
	} 
	else // The bracketing slices are in different tiles, so we have more work to do
	{	
		float sliceAbove = min(sliceBelow + 1.0, NzM1);
		temp = floor(sliceAbove*0.25) * MxInv;
		float yOffsetA = floor(temp);		
		float xOffsetA = temp - yOffsetA;
		if (xOffsetA > 0.9999) { xOffsetA = 0.0;  yOffsetA += 1.0; } // Fix for occasional round-off problems

		vec2 tcA = vec2( xOffsetA + pos.x*MxInv, (yOffsetA + pos.y)*MyInv );
		vec4 sampA = texture2D(uSampler, tcA);

		pixValB = sampB.a;
		pixValA = sampA.r;
	} 		
	
	float pixVal = mix( pixValB, pixValA, z-sliceBelow );
	return clamp(pixVal*PixScale - PixOffset, 0.0, 1.0);		
}
#endif



#ifdef PIXEL_LAYOUT_16BIT_NN_MT
///////////////////////////////////////////////////////////////////////////////
//
// Gets the pixel value at a given volume point.
//
///////////////////////////////////////////////////////////////////////////////
float getNormalizedPixVal(vec3 pos)
{
	// Return zero if pos is outside the volume
	if ( any(greaterThan(pos,Ones)) || any(lessThan(pos,Zeros)) ) { return 0.0; }

	// Determine the nearby slice
	float z = pos.z * NzM1;	
	float slice = floor(z);
	
	// Determine the tile and mosaic indices
    float NumSlicesInFirstMosaic = 2.0*uMosaicDims[0]*uMosaicDims[1];
	int mosaicIndex = int( floor(slice/NumSlicesInFirstMosaic) );
	float sliceWithinMosaic = mod(slice, NumSlicesInFirstMosaic);

	// Compute the texture coordinates
	vec2 mInv = (mosaicIndex == NumMosaicsM1) ? MinvLast : MinvFirst;
	float temp = floor(sliceWithinMosaic*0.5) * mInv.x;
	float yOffset = floor(temp);
	float xOffset = temp - yOffset;
	if (xOffset > 0.9999) { xOffset = 0.0;  yOffset += 1.0; } // Fix for occasional round-off problems
	vec2 tc = vec2( xOffset + pos.x*mInv.x,  (yOffset + pos.y)*mInv.y );	

	// Sample the texture
	vec4 samp = sampleTexture(tc, mosaicIndex);

	// Recombine the appropriate (r,g,b,a) components to get the 16-bit pixel value
	vec4 byteMask = mix( ByteMaskRG, ByteMaskBA, mod(slice,2.0) );
	float pixVal = dot(samp, byteMask);
	return clamp(pixVal*PixScale - PixOffset, 0.0, 1.0);		
}
#endif




#ifdef PIXEL_LAYOUT_16BIT_LIN_MT
///////////////////////////////////////////////////////////////////////////////
//
// Gets the pixel value at a given volume point.
//
///////////////////////////////////////////////////////////////////////////////
float getNormalizedPixVal(vec3 pos)
{
	// Return zero if pos is outside the volume
	if ( any(greaterThan(pos,Ones)) || any(lessThan(pos,Zeros)) ) { return 0.0; }

	// Determine the nearby slice
	float z = pos.z * NzM1;	
	float sliceBelow = floor(z);

	// Determine the tile and mosaic indices	
    float NumSlicesInFirstMosaic = 2.0*uMosaicDims[0]*uMosaicDims[1];
	int mosaicIndexBelow = int( floor(sliceBelow/NumSlicesInFirstMosaic) );
	float sliceBelowWithinMosaic = mod(sliceBelow, NumSlicesInFirstMosaic);
	
	// Compute the texture coordinates
	vec2 mBInv = (mosaicIndexBelow == NumMosaicsM1) ? MinvLast : MinvFirst;
	float temp = floor(sliceBelowWithinMosaic*0.5) * mBInv.x;
	float yOffsetB = floor(temp);
	float xOffsetB = temp - yOffsetB;
	if (xOffsetB > 0.9999) { xOffsetB = 0.0;  yOffsetB += 1.0; } // Fix for occasional round-off problems
	vec2 tcB = vec2( xOffsetB + pos.x*mBInv.x,  (yOffsetB + pos.y)*mBInv.y );	

	// Sample the texture
	vec4 sampB = sampleTexture(tcB, mosaicIndexBelow);

	// Pick out the appropriate (r,g,b,a) component
	float pixValA, pixValB;
	bool sliceBelowIsEven = ( mod(sliceBelow, 2.0) < 0.5 );
	if (sliceBelowIsEven) 
	{
		pixValB = dot(sampB, ByteMaskRG); 
		pixValA = dot(sampB, ByteMaskBA); 
	} 
	else // The bracketing slices are in different tiles, so we have more work to do
	{	
		float sliceAbove = min(sliceBelow + 1.0, NzM1);		
		int mosaicIndexAbove = int( floor(sliceAbove/NumSlicesInFirstMosaic) );	
	    float sliceAboveWithinMosaic = mod(sliceAbove, NumSlicesInFirstMosaic);
		vec2 mAInv = (mosaicIndexAbove == NumMosaicsM1) ? MinvLast : MinvFirst;

		float temp = ( floor(sliceAboveWithinMosaic*0.5) * mAInv.x );
		float yOffsetA = floor(temp);		
		float xOffsetA = temp - yOffsetA;
		if (xOffsetA > 0.9999) { xOffsetA = 0.0;  yOffsetA += 1.0; } // Fix for occasional round-off problems
		vec2 tcA = vec2( xOffsetA + pos.x*mAInv.x,   (yOffsetA + pos.y)*mAInv.y );

		vec4 sampA = sampleTexture(tcA, mosaicIndexAbove);
		pixValB = dot(sampB, ByteMaskBA);
		pixValA = dot(sampA, ByteMaskRG);
	} 		
	
	float pixVal = mix( pixValB, pixValA, z-sliceBelow );
	return clamp(pixVal*PixScale - PixOffset, 0.0, 1.0);	
}
#endif




#ifdef PIXEL_LAYOUT_8BIT_NN_MT
///////////////////////////////////////////////////////////////////////////////
//
// Gets the pixel value at a given volume point.
//
///////////////////////////////////////////////////////////////////////////////
float getNormalizedPixVal(vec3 pos)
{
	// Return zero if pos is outside the volume
	if ( any(greaterThan(pos,Ones)) || any(lessThan(pos,Zeros)) ) { return 0.0; }

	// Determine the nearby slice
	float z = pos.z * NzM1;	
	float slice = floor(z);
	
	// Determine the tile and mosaic indices	
    float NumSlicesInFirstMosaic = 4.0*uMosaicDims[0]*uMosaicDims[1];
	int mosaicIndex = int( floor(slice/NumSlicesInFirstMosaic) );
	float sliceWithinMosaic = mod(slice, NumSlicesInFirstMosaic);

	// Compute the texture coordinates
	vec2 mInv = (mosaicIndex == NumMosaicsM1) ? MinvLast : MinvFirst;
	float temp = floor(sliceWithinMosaic*0.25) * mInv.x;
	float yOffset = floor(temp);
	float xOffset = temp - yOffset;
	if (xOffset > 0.9999) { xOffset = 0.0;  yOffset += 1.0; } // Fix for occasional round-off problems
	vec2 tc = vec2( xOffset + pos.x*mInv.x,  (yOffset + pos.y)*mInv.y );	

	// Sample the texture
	vec4 samp = sampleTexture(tc, mosaicIndex);

	// Pick out the appropriate (r,g,b,a) component
	int c = int( mod(slice, 4.0) );
	vec4 byteMask = vec4( float(c==0), float(c==1), float(c==2), float(c==3) );

	float pixVal = dot(samp, byteMask);
	return clamp(pixVal*PixScale - PixOffset, 0.0, 1.0);		
}
#endif




#ifdef PIXEL_LAYOUT_8BIT_LIN_MT
///////////////////////////////////////////////////////////////////////////////
//
// Gets the pixel value at a given volume point.
//
///////////////////////////////////////////////////////////////////////////////
float getNormalizedPixVal(vec3 pos)
{
	// Return zero if pos is outside the volume
	if ( any(greaterThan(pos,Ones)) || any(lessThan(pos,Zeros)) ) { return 0.0; }

	// Determine the nearby slice
	float z = pos.z * NzM1;	
	float sliceBelow = floor(z);

	// Determine the tile and mosaic indices	
    float NumSlicesInFirstMosaic = 4.0*uMosaicDims[0]*uMosaicDims[1];
	int mosaicIndexBelow = int( floor(sliceBelow/NumSlicesInFirstMosaic) );
	float sliceBelowWithinMosaic = mod(sliceBelow, NumSlicesInFirstMosaic);
	
	// Compute the texture coordinates
	vec2 mBInv = (mosaicIndexBelow == NumMosaicsM1) ? MinvLast : MinvFirst;
	float temp = floor(sliceBelowWithinMosaic*0.25) * mBInv.x;
	float yOffsetB = floor(temp);
	float xOffsetB = temp - yOffsetB;
	if (xOffsetB > 0.9999) { xOffsetB = 0.0;  yOffsetB += 1.0; } // Fix for occasional round-off problems
	vec2 tcB = vec2( xOffsetB + pos.x*mBInv.x,  (yOffsetB + pos.y)*mBInv.y );	

	// Sample the texture
	vec4 sampB = sampleTexture(tcB, mosaicIndexBelow);

	// Pick out the appropriate (r,g,b,a) component
	float pixValA, pixValB;
	int colorChannel = int( mod(sliceBelow, 4.0) );
	if (colorChannel < 3) 
	{
		vec3 byteMask = vec3( float(colorChannel==0), float(colorChannel==1), float(colorChannel==2) );
		pixValB = dot(sampB.rgb, byteMask); 
		pixValA = dot(sampB.gba, byteMask); 
	} 
	else // The bracketing slices are in different tiles, so we have more work to do
	{	
		float sliceAbove = min(sliceBelow + 1.0, NzM1);		
		int mosaicIndexAbove = int( floor(sliceAbove/NumSlicesInFirstMosaic) );	
	    float sliceAboveWithinMosaic = mod(sliceAbove, NumSlicesInFirstMosaic);
		vec2 mAInv = (mosaicIndexAbove == NumMosaicsM1) ? MinvLast : MinvFirst;

		float temp = ( floor(sliceAboveWithinMosaic*0.25) * mAInv.x );
		float yOffsetA = floor(temp);		
		float xOffsetA = temp - yOffsetA;
		if (xOffsetA > 0.9999) { xOffsetA = 0.0;  yOffsetA += 1.0; } // Fix for occasional round-off problems
		vec2 tcA = vec2( xOffsetA + pos.x*mAInv.x,   (yOffsetA + pos.y)*mAInv.y );

		vec4 sampA = sampleTexture(tcA, mosaicIndexAbove);
		pixValB = sampB.a;
		pixValA = sampA.r;
	} 		
	
	float pixVal = mix( pixValB, pixValA, z-sliceBelow );
	return clamp(pixVal*PixScale - PixOffset, 0.0, 1.0);			
}
#endif


///////////////////////////////////////////////////////////////////////////////
//
// Determines whether a given volume point is masked.
//
///////////////////////////////////////////////////////////////////////////////
bool isMasked(vec3 pos)
{
	vec2 ToFloat16le = vec2(1.0, 256.0)/257.0;
	vec4 maskSamp = texture2D(uMaskSampler, pos.xy);
	return (pos.z < dot(maskSamp.rg, ToFloat16le)) || (1.0 - pos.z < dot(maskSamp.ba, ToFloat16le));
}
`;

})( window.BigLime = window.BigLime || {} );







/////////////////////////////////////////////////////////////////////////
//
// ShaderCode.1.Slab.js
//
// This file contains the WebGL1 shader code for drawing a slab wireframe. 
//
/////////////////////////////////////////////////////////////////////////
;(function(Namespace, undefined) {
    "use strict";
	Namespace.ShaderCode = Namespace.ShaderCode || {};



/////////////////////////////////////////////////////////////////////////
//
// Vertex shader.
//
/////////////////////////////////////////////////////////////////////////
Namespace.ShaderCode.slab_vert_1 = 
`// slab_vert_1

//<<SYMBOL_DEFS>>//

precision highp float;
precision highp int;

attribute vec4 aPosition;
attribute vec4 aColor;
varying vec4   vColor;
uniform mat4   uMvpTransform;
uniform float  uPersp;


///////////////////////////////////////////////////////////////////////////////
//
// Program entry point.
//
///////////////////////////////////////////////////////////////////////////////
void main()
{
    gl_Position = uMvpTransform * aPosition;
    gl_Position.w = 1.0 + uPersp*(gl_Position.z + 1.0);
    vColor = aColor;
}
`;




/////////////////////////////////////////////////////////////////////////
//
// Fragment shader.
//
/////////////////////////////////////////////////////////////////////////
Namespace.ShaderCode.slab_frag_1  = 
`// slab_frag_1

//<<SYMBOL_DEFS>>//

precision highp float; 
precision highp int;
varying vec4    vColor;

///////////////////////////////////////////////////////////////////////////////
//
// Program entry point.
//
///////////////////////////////////////////////////////////////////////////////
void main()
{
    gl_FragColor = vColor;
}
`;


})( window.BigLime = window.BigLime || {} );







/**
 * This file contains the shader code for volume rendering in WebGL 1.
 * 
 */
;(function(Namespace, undefined) {
    "use strict";
	Namespace.ShaderCode = Namespace.ShaderCode || {};


/**
 * Vertex shader.
 * 
 */
Namespace.ShaderCode.vr_vert_1 = 
`// vr_vert_1
//-----------

//<<SYMBOL_DEFS>>//

precision highp float; // We need highp to accurately specify locations in large textures
precision highp int;

attribute vec4 aPosition;
uniform mat4   uMvpTransform;
uniform mat4   uMvpInvTransform;
uniform float  uPersp;
varying vec3   vRayStartT;
varying vec3   vRayDirT;


///////////////////////////////////////////////////////////////////////////////
//
// Program entry point.
//
///////////////////////////////////////////////////////////////////////////////
void main()
{
    // Transform the input vertex from world-space to clip-space. (Setting the w-component implements perspective.)
    gl_Position = uMvpTransform * aPosition;
    float w = gl_Position.w = 1.0 + uPersp*(gl_Position.z + 1.0); 

	// Pass the ray's starting point and direction to the fragment shader (in texture coordinates).
	// Note that scaling of vRayDirT by w is necessary for perspective-correct interpolation.
	vRayStartT = aPosition.xyz + 0.5;
	vRayDirT = w * (uMvpInvTransform * vec4(gl_Position.xy*(uPersp/w), 1.0, 0.0)).xyz;
}
`;




/**
 * Fragment shader.
 * 
 */
Namespace.ShaderCode.vr_frag_1 = 
`// vr_frag_1
//-----------

//<<SYMBOL_DEFS>>//

precision highp float; // We need highp to accurately specify locations in large textures
precision highp int;
precision highp sampler2D;

// Uniforms and varyings
uniform sampler2D  uSampler;                      // For volumes that fit in a single texture
uniform sampler2D  uSamplers[NUM_IMAGE_TEXTURES]; // For volumes that span multiple textures
uniform sampler2D  uLutSampler;
uniform sampler2D  uMaskSampler;
uniform bool       uMaskEnabled;
uniform vec3   uVrBackColor;
uniform vec3   uVolShape;
uniform float  uVolNumImages;
uniform vec4   uMosaicDims;
uniform int    uNumTextures;
uniform float  uRayStepSize;
uniform vec2   uOutBufferSize;
uniform float  uOpacityRange[2];
uniform int    uAntiAlias;
uniform float  uSlabInfo[24];
uniform bool   uSealBorders;
uniform bool   uPickMode;
uniform vec2   uPickPoint;
uniform bool   uShowMarker;
uniform vec3   uMarkerLoc;
uniform float  uMarkerSize;
uniform vec4   uMarkerColor;
uniform mat4   uModelTransform;
uniform mat4   uViewTransform;
uniform float  uAmbientLight;
struct Light {
	float diffuse;
	float specStrength;
	float specExp;
	float shadowDarkness;
	float shadowSoftness;
	vec3  dir;
	mat4  shadowMvp;
};
uniform Light uLights[2];

#ifdef RENDER_GRAPHICS
uniform sampler2D uGfxSampler;
uniform float uGfxBlendWeight;
#endif
#ifdef RENDER_SHADOWS
uniform sampler2D uShadowSampler;
#endif

varying vec3 vRayStartT;
varying vec3 vRayDirT;

 
// Constants
vec3 UnitVectors[3];
const vec3 Ones             = vec3(1.0);
const vec3 Zeros            = vec3(0.0);
const float BBoxTol         = 0.002; 
const vec3 BboxMin          = vec3(-BBoxTol);
const vec3 BboxMax          = vec3(1.0 + BBoxTol);
const float TransparencySat = 0.02; // Saturation value
const vec2 ToFloat16        = vec2(256.0, 1.0)/257.0; // For converting a pair of bytes to a float 
const vec4 ByteMaskRG       = vec4(1.0, 256.0, 0.0, 0.0);
const vec4 ByteMaskBA       = vec4(0.0, 0.0, 1.0, 256.0);
const vec2 ByteMask         = vec2(1.0, 256.0);

// Globals
float PixScale, PixOffset;
float NzM1, MxInv, MyInv;
int NumMosaicsM1;
vec2 MinvFirst, MinvLast; 
vec3 VolAspect;
vec3 BorderNormal, GradOffset;
float BorderNormalWeight, BorderReflectanceWeight;
#ifdef CLIP_TO_SLAB
vec3 SlabRadii, SlabAxes[3];
mat4 SlabXfrm;
#endif


// Function prototypes
bool  calcVrValue(vec3);
bool  calcPickLocation(vec3);
float getNormalizedPixVal(vec3);
vec4  sampleTexture(vec2, int);
void  getBorderInfo(vec3, vec3, vec3, float, vec3);
float rand(vec2);
vec4  encodeVec3(vec3);
bool isMasked(vec3 pos);

#ifdef CLIP_TO_SLAB
void  initializeSlabInfo(vec3, vec3, out float);
#endif
#ifdef RENDER_SHADOWS
float calcShadowWeight(vec3, int);
#endif


///////////////////////////////////////////////////////////////////////////////
//
// Program entry point.
//
///////////////////////////////////////////////////////////////////////////////
void main()
{		
	// Initialize globals
	PixScale  = 255.0 * uOpacityRange[1];
	PixOffset = uOpacityRange[0] * uOpacityRange[1];
	
	// Perform ray casting
	vec3 rayDir = normalize(vRayDirT);
	bool stat = calcPickLocation(rayDir) || calcVrValue(rayDir);
}


///////////////////////////////////////////////////////////////////////////////
//
// Computes the integrated color and opacity along a ray.
//
///////////////////////////////////////////////////////////////////////////////
bool calcVrValue(vec3 rayDir)
{
	// Initialize some globals
	NumMosaicsM1 = uNumTextures - 1;	
	NzM1 = uVolNumImages - 1.0;
	MxInv = 1.0/uMosaicDims[0];
	MyInv = 1.0/uMosaicDims[1];
    MinvFirst = vec2(1.0/uMosaicDims[0], 1.0/uMosaicDims[1]);
	MinvLast  = vec2(1.0/uMosaicDims[2], 1.0/uMosaicDims[3]);
	VolAspect = uVolShape/max(max(uVolShape.x, uVolShape.y), uVolShape.z);
	
	// Initialize constants
	UnitVectors[0]      = vec3(1.0, 0.0, 0.0);
	UnitVectors[1]      = vec3(0.0, 1.0, 0.0);
	UnitVectors[2]      = vec3(0.0, 0.0, 1.0);	
	vec3 gdx            = vec3(1.0/uVolShape[0], 0.0, 0.0);      // Offset for computing grad.x
	vec3 gdy            = vec3(0.0, 1.0/uVolShape[1], 0.0);      // Offset for computing grad.y
	vec3 gdz            = vec3(0.0, 0.0, 1.0/uVolShape[2]);      // Offset for computing grad.z
	vec3 gradDelta      = 1.5 * vec3(gdx.x, gdy.y, gdz.z);       // Offsets for computing gradients near borders
	float stepSize      = uRayStepSize;                          // The step-size for raycasting
	vec3 rayStep        = uRayStepSize * rayDir;                 // The ray increment
	float opacityExp    = uRayStepSize * 128.0;                  // For scaling the opacity to the ray step size
	float borderThresh  = uRayStepSize * 5.0;                    // Distance threshold for shading border surfaces
	float random        = rand(gl_FragCoord.xy);                 // For antialiasing
	int randIndex       = int(10.0*random + 1.0);
	float randRayOffset = float(uAntiAlias) * uRayStepSize * (random - 0.5); 

	// Default border values
	BorderNormal = vec3(1.0, 0.0, 0.0);
	BorderNormalWeight = 0.0;
	BorderReflectanceWeight = 1.0;
	GradOffset = vec3(0.0);

	// Initialize the ray
	float tTot            = 1.0;                                 // Accumulated transparency
	vec3 cTot             = vec3(0.0);                           // Accumulated color
	vec3 pos              = vRayStartT;                          // Current ray position
	vec3 pos_s            = vec3(0.0);                           // Current ray position in slab coordinates
	float currPixVal      = getNormalizedPixVal(pos);
	float prevPixVal      = 0.0;
	float nextPixVal      = 0.0;
	vec3 prevGrad         = vec3(0.0);	
	float perpMarkerDist  = length( cross( (pos-uMarkerLoc)*VolAspect, normalize(rayDir*VolAspect) ) );
	bool omitMarkerTest   = !uShowMarker || (perpMarkerDist > uMarkerSize);
	bool enteredSlab      = false;
	
	#ifdef RENDER_GRAPHICS
	vec2 fragCoord = 0.5*gl_FragCoord.xy/uOutBufferSize;
	vec4 gfxColor0 = texture2D(uGfxSampler, vec2(fragCoord.x,       fragCoord.y      ));
	vec4 gfxDepth0 = texture2D(uGfxSampler, vec2(fragCoord.x + 0.5, fragCoord.y      ));
	vec4 gfxColor1 = texture2D(uGfxSampler, vec2(fragCoord.x,       fragCoord.y + 0.5));
	vec4 gfxDepth1 = texture2D(uGfxSampler, vec2(fragCoord.x + 0.5, fragCoord.y + 0.5));
	float depth0 = 2.0* dot(gfxDepth0.ba, ToFloat16) - 1.0;
	float depth1 = 2.0* dot(gfxDepth1.ba, ToFloat16) - 1.0;
	bool omitG0Test = (depth0 > 0.999);
	bool omitG1Test = (depth1 > 0.999);
	mat4 mvTransform = uViewTransform * uModelTransform;
	vec4 mvTransformZ = vec4(mvTransform[0][2], mvTransform[1][2], mvTransform[2][2], mvTransform[3][2]);
	#endif

	float prevShadowWeight0 = -1.0;
	float prevShadowWeight1 = -1.0;
	float sh0 = uLights[0].shadowDarkness;
	float sh1 = uLights[1].shadowDarkness;
	float drel0 = (uLights[0].diffuse == uLights[1].diffuse) ? 0.5 : uLights[0].diffuse/(uLights[0].diffuse + uLights[1].diffuse + 0.0001);
	float drel1 = 1.0 - drel0;

	// Initialize slab variables
	#ifdef CLIP_TO_SLAB
	float slabOffset;
	initializeSlabInfo(rayDir, pos, slabOffset);
	if (slabOffset - 0.05 > 0.0) { pos += (slabOffset - 0.05)*rayDir; }
	#endif

	// Walk along the ray
	for (int i = 0; i < 32768; i++)
	{		
		// We're done if the ray has exited the volume, or if the opacity threshold is exceeded
		if ( (tTot < TransparencySat) || any(lessThan(pos,BboxMin)) || any(greaterThan(pos,BboxMax)) ) { break; }

		// Does the current ray position intersect the marker?
		if (!omitMarkerTest)
		{	
			vec3 pmVec = (pos - uMarkerLoc)*VolAspect;	
			if ( length(pmVec) <= uMarkerSize ) {
				float pmPerpDist = length( cross(pmVec, normalize(rayDir*VolAspect)) );
				float shade = mix(1.0 - pmPerpDist/uMarkerSize, 1.0, 0.4);
				cTot += shade * uMarkerColor.rgb * uMarkerColor.a * tTot;
				tTot *= 1.0 - uMarkerColor.a;
				omitMarkerTest = true;
				continue;
			}
		}
					
		// Apply random ray offset for antialiasing
		pos += (float(i == randIndex) * randRayOffset) * rayDir;

		#ifdef RENDER_GRAPHICS		
		if ( !omitG0Test || !omitG1Test )
		{	
			float gPosZ = dot(mvTransformZ, vec4(pos-0.5, 1.0));
			if ((!omitG1Test) && (gPosZ > depth1)) {
				cTot += gfxColor1.rgb * gfxColor1.a * tTot;
				cTot = mix(cTot, gfxColor1.rgb, uGfxBlendWeight);
				tTot *= 1.0 - gfxColor1.a;
				omitG1Test = true;
				continue;			
			}
			if ((!omitG0Test) && (gPosZ > depth0)) {
				cTot += gfxColor0.rgb * gfxColor0.a * tTot;
				cTot = mix(cTot, gfxColor0.rgb, uGfxBlendWeight);
				tTot *= 1.0 - gfxColor0.a;
				omitG0Test = true;
				continue;			
			}
		}
		#endif		

		// Honor any slab constraints
		#ifdef CLIP_TO_SLAB
		pos_s = (SlabXfrm * vec4(pos, 1.0)).xyz;
		if ( any(greaterThan(abs(pos_s), SlabRadii)) ) {
			if ( enteredSlab ) { break; }
			prevPixVal = 0.0;  currPixVal = 0.0;
			stepSize = 2.0*uRayStepSize;
			rayStep = stepSize*rayDir;			
			pos += rayStep;  
			continue;
		}
		enteredSlab = true;
		#endif

		// Get the pixel value. Use 3-point averaging along the ray
		nextPixVal = getNormalizedPixVal(pos + rayStep);
		float pixVal = 0.25*( prevPixVal + 2.0*currPixVal + nextPixVal );
		prevPixVal = currPixVal;  currPixVal = nextPixVal;

		// Check the opacity value
		vec4 lutVal = (uMaskEnabled && isMasked(pos)) ? vec4(0.0) : texture2D(uLutSampler, vec2(pixVal, LUT_TX_YOFFSET)); 

		if (lutVal.a == 0.0)
		{
			// We have entered an empty-space region, so increase the stepsize
			stepSize = 2.0*uRayStepSize;
			rayStep = stepSize*rayDir;
		}
		else
		{
			if (stepSize > 1.5*uRayStepSize) {
				// Revert to normal-size steps, and back-up
				stepSize    = uRayStepSize;
				rayStep     = stepSize*rayDir;
				pos        -= rayStep;
				currPixVal  = getNormalizedPixVal(pos);
				prevPixVal  = getNormalizedPixVal(pos - rayStep);
				continue;
			}

			// Check whether we are near a border
			if (uSealBorders) {
				getBorderInfo(pos, rayDir, pos_s, borderThresh, gradDelta);
			}

			// Compute the intensity gradient
			vec3 gpos = pos + GradOffset;
			vec3 grad = vec3( 
				getNormalizedPixVal(gpos + gdx) - getNormalizedPixVal(gpos - gdx),
				getNormalizedPixVal(gpos + gdy) - getNormalizedPixVal(gpos - gdy),
				getNormalizedPixVal(gpos + gdz) - getNormalizedPixVal(gpos - gdz) );	

			// Modify the gradient near borders
			grad = mix(grad, BorderNormal, BorderNormalWeight);
			grad = mix(grad, prevGrad, 0.5);
			prevGrad = grad;
			float gradMag = length(grad);

			// Compute the lighting factors
			vec3 N = grad/gradMag;
			vec3 L0 = uLights[0].dir;
			vec3 L1 = uLights[1].dir;
			vec3 R0 = reflect(-1.0*L0, N); // Assumes that L0, L1 are normalized
			vec3 R1 = reflect(-1.0*L1, N);

			float diffuse0 = 2.0 * uLights[0].diffuse * max(0.0, dot(N,L0));
			float diffuse1 = 2.0 * uLights[1].diffuse * max(0.0, dot(N,L1));

			float sdot0 = max(0.0, dot(R0, rayDir));
			float sdot1 = max(0.0, dot(R1, rayDir));
			float specular0 = 2.0 * uLights[0].specStrength * pow(sdot0, uLights[0].specExp);
			float specular1 = 2.0 * uLights[1].specStrength * pow(sdot1, uLights[1].specExp);

			float dsFactor = float(gradMag > 0.001)*BorderReflectanceWeight;
			float light0 = uAmbientLight*drel0 + (diffuse0 + specular0)*dsFactor; 
			float light1 = uAmbientLight*drel1 + (diffuse1 + specular1)*dsFactor; 

			// Maybe draw shadows
			#ifdef RENDER_SHADOWS
			if (sh0 > 0.0) { 
				float shadowWeight0 = ((prevShadowWeight0 < 0.0) || (tTot > 0.10)) ? calcShadowWeight(pos,0) : prevShadowWeight0;
				light0 *= max(0.0, 1.0-sh0*shadowWeight0);
				prevShadowWeight0 = shadowWeight0;
			}
			if (sh1 > 0.0) {
				float shadowWeight1 = ((prevShadowWeight1 < 0.0) || (tTot > 0.10)) ? calcShadowWeight(pos,1) : prevShadowWeight1;
				light1 *= max(0.0, 1.0-sh1*shadowWeight1); 
				prevShadowWeight1 = shadowWeight1;
			}
				#endif // RENDER_SHADOWS

			// Update the total color
			float light = light0 + light1;

			// Update the total color
			float t = pow(max(0.0, 1.0-lutVal.a), opacityExp);
			vec3 c = lutVal.rgb * (1.0 - t) * light;
			cTot += c*tTot;
			tTot *= t;
		}
			
		pos += rayStep;
	}
	
	cTot += uVrBackColor*tTot;
	gl_FragColor = vec4(cTot, 1.0);
	return true;
}



///////////////////////////////////////////////////////////////////////////////
//
// Computes the location of the most salient point along a ray.
//
///////////////////////////////////////////////////////////////////////////////
bool calcPickLocation(vec3 rayDir)
{
    if (!uPickMode) { return false; }

	float tol = 1.0; // NB: Units here are pixels, not fractional texture coordinates
	if ( (abs(gl_FragCoord.x - uPickPoint.x) > tol) ||  (abs(gl_FragCoord.y - uPickPoint.y) > tol) ) 
	{
		// Skip the computation if this is not the target fragment
		gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);
	}
	else
	{
		// Initialize some globals
        NumMosaicsM1 = uNumTextures - 1;	
        NzM1 = uVolNumImages - 1.0;
        MxInv = 1.0/uMosaicDims[0];
        MyInv = 1.0/uMosaicDims[1];
        MinvFirst = vec2(1.0/uMosaicDims[0], 1.0/uMosaicDims[1]);
        MinvLast  = vec2(1.0/uMosaicDims[2], 1.0/uMosaicDims[3]);
		VolAspect = uVolShape/max(max(uVolShape.x, uVolShape.y), uVolShape.z);

		// Initialize locals
		vec3 rayStep         = uRayStepSize * rayDir;
		float opacityExp     = uRayStepSize * 128.0;
		vec3 maxLoc          = vec3(-1.0);
		vec3 runStart        = vec3(-1.0);
		float bestDelta      = -1.0; 

		// Initialize the ray
		vec3 pos = vRayStartT;
		float tTot = 1.0;
		float tBase = -1.0;
		
		// Initialize slab variables
		#ifdef CLIP_TO_SLAB
		float slabOffset;
		initializeSlabInfo(rayDir, pos, slabOffset);
		if (slabOffset - 0.05 > 0.0) { pos += (slabOffset - 0.05)*rayDir; }
		#endif

		// Walk along the ray
		for (int i = 0; i < 32768; i++)
		{		
			// Honor any slab constraints
			#ifdef CLIP_TO_SLAB
			vec3 pos_s = (SlabXfrm * vec4(pos, 1.0)).xyz;
			if ( any(greaterThan(abs(pos_s), SlabRadii)) ) {
				pos += rayStep;
				continue;
			}
			#endif

			// Update the accumulated transparency
			float opac = (uMaskEnabled && isMasked(pos)) ? 0.0 : texture2D(uLutSampler, vec2(getNormalizedPixVal(pos), LUT_TX_YOFFSET)).a;
			float t = pow( max(0.0, 1.0-opac), opacityExp);
			tTot *= t;

			// Check whether the transparency is strictly decreasing
			if ( (t < 0.99) && (runStart.x < 0.0) )  
			{ 
				runStart = pos; // The voxel has some opacity, so we are starting a new run
				tBase = tTot;
			}

			vec3 nextPos = pos + rayStep;
			bool terminateRay = (tTot < TransparencySat) || any(lessThan(nextPos, BboxMin)) || any(greaterThan(nextPos, BboxMax));
			if ( (runStart.x >= 0.0) && ((t >= 0.99) || terminateRay) ) // We are ending a run
			{
				float delta = tBase - tTot; 
				float improved = float(delta > bestDelta);
				bestDelta = mix(bestDelta, delta, improved);
				maxLoc = mix(maxLoc, runStart, improved);
				runStart = vec3(-1.0); 	
				terminateRay = terminateRay || (bestDelta >= tTot);  			
			}
			if (terminateRay) { break; }		

			pos = nextPos;
		}
		
		// Encode the max location in the output color	
		gl_FragColor = encodeVec3(maxLoc);
	}
	return true;
}


#ifdef CLIP_TO_SLAB
///////////////////////////////////////////////////////////////////////////////
//
// Initializes slab-related variables.
//
///////////////////////////////////////////////////////////////////////////////
void initializeSlabInfo(vec3 rayDir, vec3 rayStart, out float slabOffset)
{
	// Get the corner points in volume coordinates
	vec3 p0 = vec3(uSlabInfo[0],  uSlabInfo[1],  uSlabInfo[2] );
	vec3 p1 = vec3(uSlabInfo[3],  uSlabInfo[4],  uSlabInfo[5] );
	vec3 p2 = vec3(uSlabInfo[6],  uSlabInfo[7],  uSlabInfo[8] );
	vec3 p3 = vec3(uSlabInfo[9],  uSlabInfo[10], uSlabInfo[11]);
	vec3 p4 = vec3(uSlabInfo[12], uSlabInfo[13], uSlabInfo[14]);
	vec3 p5 = vec3(uSlabInfo[15], uSlabInfo[16], uSlabInfo[17]);
	vec3 p6 = vec3(uSlabInfo[18], uSlabInfo[19], uSlabInfo[20]);
	vec3 p7 = vec3(uSlabInfo[21], uSlabInfo[22], uSlabInfo[23]);

	slabOffset = min( 
		min( min(dot(rayDir, p0), dot(rayDir, p1)), min(dot(rayDir, p2), dot(rayDir, p3)) ),
		min( min(dot(rayDir, p4), dot(rayDir, p5)), min(dot(rayDir, p6), dot(rayDir, p7)) ) 
	);
	slabOffset -= dot(rayStart, rayDir);

	// Get the slab axes and center
	p0 *= VolAspect;
	p1 *= VolAspect;
	p2 *= VolAspect;
	p4 *= VolAspect;
	p7 *= VolAspect;
	SlabAxes[0] = normalize(p1 - p0);
	SlabAxes[1] = normalize(p2 - p0);
	SlabAxes[2] = normalize(p4 - p0);
	vec3 slabCtr = (p0 + p7) / 2.0;

	SlabRadii = vec3(length(p1-p0)/2.0, length(p2-p0)/2.0, length(p4-p0)/2.0);

	// Construct the transformation matrix from texture coordinates to slab coordinates
	SlabXfrm = mat4(
		VolAspect.x*SlabAxes[0].x,  VolAspect.x*SlabAxes[1].x,  VolAspect.x*SlabAxes[2].x,  0.0,
		VolAspect.y*SlabAxes[0].y,  VolAspect.y*SlabAxes[1].y,  VolAspect.y*SlabAxes[2].y,  0.0,
		VolAspect.z*SlabAxes[0].z,  VolAspect.z*SlabAxes[1].z,  VolAspect.z*SlabAxes[2].z,  0.0,
       -dot(slabCtr, SlabAxes[0]), -dot(slabCtr, SlabAxes[1]), -dot(slabCtr, SlabAxes[2]),  1.0
	);
}
#endif


///////////////////////////////////////////////////////////////////////////////
//
// Gets the distance to the nearest border, and the normal vector of
//   that border.
//
///////////////////////////////////////////////////////////////////////////////
void getBorderInfo(vec3 pos, vec3 rayDir, vec3 pos_s, float borderThresh, vec3 gradDelta)
{
	// Check the volume borders
	float minDist = borderThresh + 1.0;
	bool isSlabBorder = false;
	
	for (int i=0; i<3; i++)
	{
		float p = abs(pos[i]);
		if (p < minDist) { minDist = p;  BorderNormal = UnitVectors[i]; }	

		p = abs(1.0 - pos[i]);
		if (p < minDist) { minDist = p;  BorderNormal = -1.0*UnitVectors[i]; }	

        #ifdef CLIP_TO_SLAB	
		p = abs( SlabRadii[i] + pos_s[i] );
		if ( p < minDist ) { minDist = p;  BorderNormal = SlabAxes[i];  isSlabBorder = true; }

		p = abs( SlabRadii[i] - pos_s[i] );
		if ( p < minDist ) { minDist = p;  BorderNormal = -1.0*SlabAxes[i]; isSlabBorder = true; }	
        #endif							
	}	

	bool doBorderMod    = (minDist < borderThresh);
	float cosFactor     = max( 0.0, dot(normalize(BorderNormal),rayDir) );
	BorderNormalWeight  = doBorderMod ? (1.0 - minDist/borderThresh)*pow(cosFactor,0.25) : 0.0;
	BorderReflectanceWeight = doBorderMod ? 1.0 - 0.75*pow(cosFactor,4.0) : 1.0;
	GradOffset          = (doBorderMod && !isSlabBorder ) ? BorderNormal*gradDelta : Zeros;
}


#ifdef RENDER_SHADOWS
///////////////////////////////////////////////////////////////////////////////
//
// Implements percentage-closer filtering for soft shadow edges.
//
///////////////////////////////////////////////////////////////////////////////
float calcShadowWeight(vec3 pos, int lightIndex)
{
	// Initialize constants
	float step = (lightIndex == 0) ? 0.0054*uLights[0].shadowSoftness : 0.0054*uLights[1].shadowSoftness;
	float dx = step / max(1.0, uOutBufferSize.x/uOutBufferSize.y);
	float dy = step / max(1.0, uOutBufferSize.y/uOutBufferSize.x);

	// Get the shadow-map coordinates of the input point
	mat4 shadowMvp = (lightIndex == 0) ? uLights[0].shadowMvp : uLights[1].shadowMvp;
	vec4 pt = 0.5*(shadowMvp * vec4(pos-0.5, 1.0) + 1.0);

	// Apply a random offset to reduce banding artifacts
	float px0 = pt.x + dx * 0.8*(rand(pos.xz) - 0.5);
	float py0 = pt.y + dy * 0.8*(rand(pos.yz) - 0.5);

	// Apply a small z-offset to prevent self-shadowing	
	float pzd = pt.z - 1.0/uVolShape[0];

	// Tabulate sampling points
	float pxp1 = px0 + dx;
	float pxm1 = px0 - dx;
	float pxp2 = pxp1 + dx;
	float pxm2 = pxm1 - dx;
	float pxp3 = pxp2 + dx;
	float pxm3 = pxm2 - dx;
	float pxp4 = pxp3 + dx;
	float pxm4 = pxm3 - dx;

	float pyp1 = py0 + dy;
	float pym1 = py0 - dy;
	float pyp2 = pyp1 + dy;
	float pym2 = pym1 - dy;
	float pyp3 = pyp2 + dy;
	float pym3 = pym2 - dy;
	float pyp4 = pyp3 + dy;
	float pym4 = pym3 - dy;

	float fL = float(lightIndex);
	py0  = 0.5*(py0 + fL);
	pyp1 = 0.5*(pyp1 + fL);
	pym1 = 0.5*(pym1 + fL);
	pyp2 = 0.5*(pyp2 + fL);
	pym2 = 0.5*(pym2 + fL);
	pyp3 = 0.5*(pyp3 + fL);
	pym3 = 0.5*(pym3 + fL);
	pyp4 = 0.5*(pyp4 + fL);
	pym4 = 0.5*(pym4 + fL);
	 
	// Unrolled loop for better performance:
	vec4 smTexVal = texture2D(uShadowSampler, vec2(px0, py0));
	float smDepth = dot(smTexVal.rg, ToFloat16);
	float wt = float(pzd > smDepth);

	wt += float(pzd > dot( texture2D(uShadowSampler, vec2(pxm1, pym4)).rg, ToFloat16 ));
	wt += float(pzd > dot( texture2D(uShadowSampler, vec2(px0,  pym4)).rg, ToFloat16 ));
	wt += float(pzd > dot( texture2D(uShadowSampler, vec2(pxp1, pym4)).rg, ToFloat16 ));

	wt += float(pzd > dot( texture2D(uShadowSampler, vec2(pxm3, pym3)).rg, ToFloat16 ));
	wt += float(pzd > dot( texture2D(uShadowSampler, vec2(pxm2, pym3)).rg, ToFloat16 ));
	wt += float(pzd > dot( texture2D(uShadowSampler, vec2(pxm1, pym3)).rg, ToFloat16 ));
	wt += float(pzd > dot( texture2D(uShadowSampler, vec2(px0,  pym3)).rg, ToFloat16 ));
	wt += float(pzd > dot( texture2D(uShadowSampler, vec2(pxp1, pym3)).rg, ToFloat16 ));
	wt += float(pzd > dot( texture2D(uShadowSampler, vec2(pxp2, pym3)).rg, ToFloat16 ));
	wt += float(pzd > dot( texture2D(uShadowSampler, vec2(pxp3, pym3)).rg, ToFloat16 ));

	wt += float(pzd > dot( texture2D(uShadowSampler, vec2(pxm3, pym2)).rg, ToFloat16 ));
	wt += float(pzd > dot( texture2D(uShadowSampler, vec2(pxm2, pym2)).rg, ToFloat16 ));
	wt += float(pzd > dot( texture2D(uShadowSampler, vec2(pxm1, pym2)).rg, ToFloat16 ));
	wt += float(pzd > dot( texture2D(uShadowSampler, vec2(px0,  pym2)).rg, ToFloat16 ));
	wt += float(pzd > dot( texture2D(uShadowSampler, vec2(pxp1, pym2)).rg, ToFloat16 ));
	wt += float(pzd > dot( texture2D(uShadowSampler, vec2(pxp2, pym2)).rg, ToFloat16 ));
	wt += float(pzd > dot( texture2D(uShadowSampler, vec2(pxp3, pym2)).rg, ToFloat16 ));	

	wt += float(pzd > dot( texture2D(uShadowSampler, vec2(pxm4, pym1)).rg, ToFloat16 ));
	wt += float(pzd > dot( texture2D(uShadowSampler, vec2(pxm3, pym1)).rg, ToFloat16 ));
	wt += float(pzd > dot( texture2D(uShadowSampler, vec2(pxm2, pym1)).rg, ToFloat16 ));
	wt += float(pzd > dot( texture2D(uShadowSampler, vec2(pxm1, pym1)).rg, ToFloat16 ));
	wt += float(pzd > dot( texture2D(uShadowSampler, vec2(px0,  pym1)).rg, ToFloat16 ));
	wt += float(pzd > dot( texture2D(uShadowSampler, vec2(pxp1, pym1)).rg, ToFloat16 ));
	wt += float(pzd > dot( texture2D(uShadowSampler, vec2(pxp2, pym1)).rg, ToFloat16 ));
	wt += float(pzd > dot( texture2D(uShadowSampler, vec2(pxp3, pym1)).rg, ToFloat16 ));
	wt += float(pzd > dot( texture2D(uShadowSampler, vec2(pxp4, pym1)).rg, ToFloat16 ));
	
	wt += float(pzd > dot( texture2D(uShadowSampler, vec2(pxm4, py0)).rg, ToFloat16 ));
	wt += float(pzd > dot( texture2D(uShadowSampler, vec2(pxm3, py0)).rg, ToFloat16 ));
	wt += float(pzd > dot( texture2D(uShadowSampler, vec2(pxm2, py0)).rg, ToFloat16 ));
	wt += float(pzd > dot( texture2D(uShadowSampler, vec2(pxm1, py0)).rg, ToFloat16 ));
	//-------------------------------------------------------------------------------
	wt += float(pzd > dot( texture2D(uShadowSampler, vec2(pxp1, py0)).rg, ToFloat16 ));
	wt += float(pzd > dot( texture2D(uShadowSampler, vec2(pxp2, py0)).rg, ToFloat16 ));
	wt += float(pzd > dot( texture2D(uShadowSampler, vec2(pxp3, py0)).rg, ToFloat16 ));
	wt += float(pzd > dot( texture2D(uShadowSampler, vec2(pxp4, py0)).rg, ToFloat16 ));

	wt += float(pzd > dot( texture2D(uShadowSampler, vec2(pxm4, pyp1)).rg, ToFloat16 ));
	wt += float(pzd > dot( texture2D(uShadowSampler, vec2(pxm3, pyp1)).rg, ToFloat16 ));
	wt += float(pzd > dot( texture2D(uShadowSampler, vec2(pxm2, pyp1)).rg, ToFloat16 ));
	wt += float(pzd > dot( texture2D(uShadowSampler, vec2(pxm1, pyp1)).rg, ToFloat16 ));
	wt += float(pzd > dot( texture2D(uShadowSampler, vec2(px0,  pyp1)).rg, ToFloat16 ));
	wt += float(pzd > dot( texture2D(uShadowSampler, vec2(pxp1, pyp1)).rg, ToFloat16 ));
	wt += float(pzd > dot( texture2D(uShadowSampler, vec2(pxp2, pyp1)).rg, ToFloat16 ));
	wt += float(pzd > dot( texture2D(uShadowSampler, vec2(pxp3, pyp1)).rg, ToFloat16 ));
	wt += float(pzd > dot( texture2D(uShadowSampler, vec2(pxp4, pyp1)).rg, ToFloat16 ));

	wt += float(pzd > dot( texture2D(uShadowSampler, vec2(pxm3, pyp2)).rg, ToFloat16 ));
	wt += float(pzd > dot( texture2D(uShadowSampler, vec2(pxm2, pyp2)).rg, ToFloat16 ));
	wt += float(pzd > dot( texture2D(uShadowSampler, vec2(pxm1, pyp2)).rg, ToFloat16 ));
	wt += float(pzd > dot( texture2D(uShadowSampler, vec2(px0,  pyp2)).rg, ToFloat16 ));
	wt += float(pzd > dot( texture2D(uShadowSampler, vec2(pxp1, pyp2)).rg, ToFloat16 ));
	wt += float(pzd > dot( texture2D(uShadowSampler, vec2(pxp2, pyp2)).rg, ToFloat16 ));
	wt += float(pzd > dot( texture2D(uShadowSampler, vec2(pxp3, pyp2)).rg, ToFloat16 ));

	wt += float(pzd > dot( texture2D(uShadowSampler, vec2(pxm3, pyp3)).rg, ToFloat16 ));
	wt += float(pzd > dot( texture2D(uShadowSampler, vec2(pxm2, pyp3)).rg, ToFloat16 ));
	wt += float(pzd > dot( texture2D(uShadowSampler, vec2(pxm1, pyp3)).rg, ToFloat16 ));
	wt += float(pzd > dot( texture2D(uShadowSampler, vec2(px0,  pyp3)).rg, ToFloat16 ));
	wt += float(pzd > dot( texture2D(uShadowSampler, vec2(pxp1, pyp3)).rg, ToFloat16 ));
	wt += float(pzd > dot( texture2D(uShadowSampler, vec2(pxp2, pyp3)).rg, ToFloat16 ));
	wt += float(pzd > dot( texture2D(uShadowSampler, vec2(pxp3, pyp3)).rg, ToFloat16 ));

	wt += float(pzd > dot( texture2D(uShadowSampler, vec2(pxm1, pyp4)).rg, ToFloat16 ));
	wt += float(pzd > dot( texture2D(uShadowSampler, vec2(px0,  pyp4)).rg, ToFloat16 ));
	wt += float(pzd > dot( texture2D(uShadowSampler, vec2(pxp1, pyp4)).rg, ToFloat16 ));

	return wt/61.0;		
}
#endif


///////////////////////////////////////////////////////////////////////////////
//
// Gets a random number given a 2-component seed.
//
///////////////////////////////////////////////////////////////////////////////
float rand(vec2 xy)
{
    return fract(sin(dot(xy ,vec2(12.9898,78.233))) * 43758.5453);
}


///////////////////////////////////////////////////////////////////////////////
//
// Encodes the components of a vec3 in an rgba color.
//
///////////////////////////////////////////////////////////////////////////////
vec4 encodeVec3(vec3 loc)
{
	if ( any(lessThan(loc,Zeros)) || any(greaterThan(loc,Ones)) ) 
	{
		// We indicate an invalid value by setting the rightmost bit
		return vec4(0.0, 0.0, 0.0, 1.0);
	}	

	// Use 10 bits for each coordinate
	highp int xi = int( min(1023.0, (loc.x*1023.0 + 0.5)) );
	highp int yi = int( min(1023.0, (loc.y*1023.0 + 0.5)) );
	highp int zi = int( min(1023.0, (loc.z*1023.0 + 0.5)) );

	int zLo = zi - (zi/128) * 128;
	int zHi = (zi - zLo)/128;

	int yLo = yi - (yi/32) * 32;
	int yHi = (yi - yLo)/32;

	int xLo = xi - (xi/8) * 8;
	int xHi = (xi - xLo)/8;

	float a = float(zLo*2)/255.0;
	float b = float(zHi + 8*yLo)/255.0;
	float g = float(yHi + 32*xLo)/255.0;
	float r = float(xHi)/255.0;

	return vec4(r, g, b, a);
}


///////////////////////////////////////////////////////////////////////////////
//
// Samples a given texture at a given texture coordinate.
//
///////////////////////////////////////////////////////////////////////////////
vec4 sampleTexture(vec2 tc, int textureIndex)
{
	// Performance seems to be better if we unroll the first few terms:
	if (textureIndex == 0) {
		return texture2D(uSamplers[0], tc);
	}
	#if NUM_IMAGE_TEXTURES >= 2
	else if (textureIndex == 1) {
		return texture2D(uSamplers[1], tc);
	} 
	#if NUM_IMAGE_TEXTURES >= 3
	else if (textureIndex == 2) {
		return texture2D(uSamplers[2], tc);
	} 
	#if NUM_IMAGE_TEXTURES >= 4
	else if (textureIndex == 3) {
		return texture2D(uSamplers[3], tc);
	} 
	#endif
	#endif
	#endif
	else 
	{
		for (int i=4; i<NUM_IMAGE_TEXTURES; i++) 
		{
			if (i == textureIndex) { return texture2D(uSamplers[i], tc);}
		}
	}
} 



#ifdef PIXEL_LAYOUT_16BIT_NN_ST
///////////////////////////////////////////////////////////////////////////////
//
// Gets the pixel value at a given volume point. 
//
///////////////////////////////////////////////////////////////////////////////
float getNormalizedPixVal(vec3 pos)
{
	// Return zero if pos is outside the volume
	if ( any(greaterThan(pos,Ones)) || any(lessThan(pos,Zeros)) ) { return 0.0; }

	// Determine the nearby slice
	float z = pos.z * NzM1;	
	float slice = floor(z);

	// Calculate the texture coordinate factors
	float temp = floor(slice*0.5) * MxInv;
	float yOffset = floor(temp);
	float xOffset = temp - yOffset;	
	if (xOffset > 0.9999) { xOffset = 0.0;  yOffset += 1.0; } // Fix for occasional round-off problems
	
	// Sample the texture
	vec2 tc = vec2( xOffset + pos.x*MxInv, (yOffset + pos.y)*MyInv );	
	vec4 samp = texture2D(uSampler, tc);

	// Recombine the appropriate (r,g,b,a) components to get the 16-bit pixel value
	vec4 byteMask = mix( ByteMaskRG, ByteMaskBA, mod(slice,2.0) );
	float pixVal = dot(samp, byteMask);
	return clamp(pixVal*PixScale - PixOffset, 0.0, 1.0 );		
}
#endif




#ifdef PIXEL_LAYOUT_16BIT_LIN_ST
///////////////////////////////////////////////////////////////////////////////
//
// Gets the pixel value at a given volume point.
//
///////////////////////////////////////////////////////////////////////////////
float getNormalizedPixVal(vec3 pos)
{
	// Return zero if pos is outside the volume
	if ( any(greaterThan(pos,Ones)) || any(lessThan(pos,Zeros)) ) { return 0.0; }

	// Determine the nearby slice
	float z = pos.z * NzM1;	
	float sliceBelow = floor(z);

	// Calculate the texture coordinate factors
	float temp = floor(sliceBelow*0.5) * MxInv;
	float yOffsetB = floor(temp);
	float xOffsetB = temp - yOffsetB;	
	if (xOffsetB > 0.9999) { xOffsetB = 0.0;  yOffsetB += 1.0; } // Fix for occasional round-off problems

	// Sample the texture
	vec2 tcB = vec2( xOffsetB + pos.x*MxInv, (yOffsetB + pos.y)*MyInv );	
	vec4 sampB = texture2D(uSampler, tcB);

	// Recombine the appropriate (r,g,b,a) components to get the 16-bit pixel values
	float pixValA, pixValB;
	bool sliceBelowIsEven = ( mod(sliceBelow, 2.0) < 0.5 );
	if ( sliceBelowIsEven ) 
	{
		pixValB = dot(sampB.rg, ByteMask);
		pixValA = dot(sampB.ba, ByteMask);
	} 
	else // The bracketing slices are in different tiles, so we have more work to do
	{	
		float sliceAbove = min(sliceBelow + 1.0, NzM1);
		temp = floor(sliceAbove*0.5) * MxInv;
		float yOffsetA = floor(temp);		
		float xOffsetA = temp - yOffsetA;
		if (xOffsetA > 0.9999) { xOffsetA = 0.0;  yOffsetA += 1.0; } // Fix for occasional round-off problems

		vec2 tcA = vec2( xOffsetA + pos.x*MxInv, (yOffsetA + pos.y)*MyInv );
		vec4 sampA = texture2D(uSampler, tcA);
		
		pixValB = dot(sampB.ba, ByteMask);
		pixValA = dot(sampA.rg, ByteMask); 
	} 		
	
	float pixVal = mix( pixValB, pixValA, z-sliceBelow );
	return clamp(pixVal*PixScale - PixOffset, 0.0, 1.0);		
}
#endif




#ifdef PIXEL_LAYOUT_8BIT_NN_ST
///////////////////////////////////////////////////////////////////////////////
//
// Gets the pixel value at a given volume point.
//
///////////////////////////////////////////////////////////////////////////////
float getNormalizedPixVal(vec3 pos)
{
	// Return zero if pos is outside the volume
	if ( any(greaterThan(pos,Ones)) || any(lessThan(pos,Zeros)) ) { return 0.0; }

	// Determine the nearby slice
	float z = pos.z * NzM1;	
	float slice = floor(z);

	// Calculate the texture coordinate factors
	float temp = floor(slice*0.25) * MxInv;
	float yOffset = floor(temp);
	float xOffset = temp - yOffset;	
	if (xOffset > 0.9999) { xOffset = 0.0;  yOffset += 1.0; } // Fix for occasional round-off problems
	
	// Sample the texture
	vec2 tc = vec2( xOffset + pos.x*MxInv, (yOffset + pos.y)*MyInv );	
	vec4 samp = texture2D(uSampler, tc);

	// Pick out the appropriate (r,g,b,a) component
	int c = int( mod(slice, 4.0) );
	vec4 byteMask = vec4( float(c==0), float(c==1), float(c==2), float(c==3) );

	float pixVal = dot(samp, byteMask);
	return clamp(pixVal*PixScale - PixOffset, 0.0, 1.0);			
}
#endif




#ifdef PIXEL_LAYOUT_8BIT_LIN_ST
///////////////////////////////////////////////////////////////////////////////
//
// Gets the pixel value at a given volume point.
//
///////////////////////////////////////////////////////////////////////////////
float getNormalizedPixVal(vec3 pos)
{
	// Return zero if pos is outside the volume
	if ( any(greaterThan(pos,Ones)) || any(lessThan(pos,Zeros)) ) { return 0.0; }

	// Determine the nearby slice
	float z = pos.z * NzM1;	
	float sliceBelow = floor(z);

	// Calculate the texture coordinate factors
	float temp = floor(sliceBelow*0.25) * MxInv;
	float yOffsetB = floor(temp);
	float xOffsetB = temp - yOffsetB;	
	if (xOffsetB > 0.9999) { xOffsetB = 0.0;  yOffsetB += 1.0; } // Fix for occasional round-off problems

	// Sample the texture
	vec2 tcB = vec2( xOffsetB + pos.x*MxInv, (yOffsetB + pos.y)*MyInv );	
	vec4 sampB = texture2D(uSampler, tcB);

	// Pick out the appropriate (r,g,b,a) component
	float pixValA, pixValB;
	int colorChannel = int( mod(sliceBelow, 4.0) );
	if (colorChannel < 3) 
	{
		vec3 byteMask = vec3( float(colorChannel==0), float(colorChannel==1), float(colorChannel==2) );
		pixValB = dot(sampB.rgb, byteMask); 
		pixValA = dot(sampB.gba, byteMask); 
	} 
	else // The bracketing slices are in different tiles, so we have more work to do
	{	
		float sliceAbove = min(sliceBelow + 1.0, NzM1);
		temp = floor(sliceAbove*0.25) * MxInv;
		float yOffsetA = floor(temp);		
		float xOffsetA = temp - yOffsetA;
		if (xOffsetA > 0.9999) { xOffsetA = 0.0;  yOffsetA += 1.0; } // Fix for occasional round-off problems

		vec2 tcA = vec2( xOffsetA + pos.x*MxInv, (yOffsetA + pos.y)*MyInv );
		vec4 sampA = texture2D(uSampler, tcA);

		pixValB = sampB.a;
		pixValA = sampA.r;
	} 		
	
	float pixVal = mix( pixValB, pixValA, z-sliceBelow );
	return clamp(pixVal*PixScale - PixOffset, 0.0, 1.0);		
}
#endif



#ifdef PIXEL_LAYOUT_16BIT_NN_MT
///////////////////////////////////////////////////////////////////////////////
//
// Gets the pixel value at a given volume point.
//
///////////////////////////////////////////////////////////////////////////////
float getNormalizedPixVal(vec3 pos)
{
	// Return zero if pos is outside the volume
	if ( any(greaterThan(pos,Ones)) || any(lessThan(pos,Zeros)) ) { return 0.0; }

	// Determine the nearby slice
	float z = pos.z * NzM1;	
	float slice = floor(z);
	
	// Determine the tile and mosaic indices
    float NumSlicesInFirstMosaic = 2.0*uMosaicDims[0]*uMosaicDims[1];
	int mosaicIndex = int( floor(slice/NumSlicesInFirstMosaic) );
	float sliceWithinMosaic = mod(slice, NumSlicesInFirstMosaic);

	// Compute the texture coordinates
	vec2 mInv = (mosaicIndex == NumMosaicsM1) ? MinvLast : MinvFirst;
	float temp = floor(sliceWithinMosaic*0.5) * mInv.x;
	float yOffset = floor(temp);
	float xOffset = temp - yOffset;
	if (xOffset > 0.9999) { xOffset = 0.0;  yOffset += 1.0; } // Fix for occasional round-off problems
	vec2 tc = vec2( xOffset + pos.x*mInv.x,  (yOffset + pos.y)*mInv.y );	

	// Sample the texture
	vec4 samp = sampleTexture(tc, mosaicIndex);

	// Recombine the appropriate (r,g,b,a) components to get the 16-bit pixel value
	vec4 byteMask = mix( ByteMaskRG, ByteMaskBA, mod(slice,2.0) );
	float pixVal = dot(samp, byteMask);
	return clamp(pixVal*PixScale - PixOffset, 0.0, 1.0);		
}
#endif




#ifdef PIXEL_LAYOUT_16BIT_LIN_MT
///////////////////////////////////////////////////////////////////////////////
//
// Gets the pixel value at a given volume point.
//
///////////////////////////////////////////////////////////////////////////////
float getNormalizedPixVal(vec3 pos)
{
	// Return zero if pos is outside the volume
	if ( any(greaterThan(pos,Ones)) || any(lessThan(pos,Zeros)) ) { return 0.0; }

	// Determine the nearby slice
	float z = pos.z * NzM1;	
	float sliceBelow = floor(z);

	// Determine the tile and mosaic indices	
    float NumSlicesInFirstMosaic = 2.0*uMosaicDims[0]*uMosaicDims[1];
	int mosaicIndexBelow = int( floor(sliceBelow/NumSlicesInFirstMosaic) );
	float sliceBelowWithinMosaic = mod(sliceBelow, NumSlicesInFirstMosaic);
	
	// Compute the texture coordinates
	vec2 mBInv = (mosaicIndexBelow == NumMosaicsM1) ? MinvLast : MinvFirst;
	float temp = floor(sliceBelowWithinMosaic*0.5) * mBInv.x;
	float yOffsetB = floor(temp);
	float xOffsetB = temp - yOffsetB;
	if (xOffsetB > 0.9999) { xOffsetB = 0.0;  yOffsetB += 1.0; } // Fix for occasional round-off problems
	vec2 tcB = vec2( xOffsetB + pos.x*mBInv.x,  (yOffsetB + pos.y)*mBInv.y );	

	// Sample the texture
	vec4 sampB = sampleTexture(tcB, mosaicIndexBelow);

	// Pick out the appropriate (r,g,b,a) component
	float pixValA, pixValB;
	bool sliceBelowIsEven = ( mod(sliceBelow, 2.0) < 0.5 );
	if (sliceBelowIsEven) 
	{
		pixValB = dot(sampB, ByteMaskRG); 
		pixValA = dot(sampB, ByteMaskBA); 
	} 
	else // The bracketing slices are in different tiles, so we have more work to do
	{	
		float sliceAbove = min(sliceBelow + 1.0, NzM1);		
		int mosaicIndexAbove = int( floor(sliceAbove/NumSlicesInFirstMosaic) );	
	    float sliceAboveWithinMosaic = mod(sliceAbove, NumSlicesInFirstMosaic);
		vec2 mAInv = (mosaicIndexAbove == NumMosaicsM1) ? MinvLast : MinvFirst;

		float temp = ( floor(sliceAboveWithinMosaic*0.5) * mAInv.x );
		float yOffsetA = floor(temp);		
		float xOffsetA = temp - yOffsetA;
		if (xOffsetA > 0.9999) { xOffsetA = 0.0;  yOffsetA += 1.0; } // Fix for occasional round-off problems
		vec2 tcA = vec2( xOffsetA + pos.x*mAInv.x,   (yOffsetA + pos.y)*mAInv.y );

		vec4 sampA = sampleTexture(tcA, mosaicIndexAbove);
		pixValB = dot(sampB, ByteMaskBA);
		pixValA = dot(sampA, ByteMaskRG);
	} 		
	
	float pixVal = mix( pixValB, pixValA, z-sliceBelow );
	return clamp(pixVal*PixScale - PixOffset, 0.0, 1.0);	
}
#endif




#ifdef PIXEL_LAYOUT_8BIT_NN_MT
///////////////////////////////////////////////////////////////////////////////
//
// Gets the pixel value at a given volume point.
//
///////////////////////////////////////////////////////////////////////////////
float getNormalizedPixVal(vec3 pos)
{
	// Return zero if pos is outside the volume
	if ( any(greaterThan(pos,Ones)) || any(lessThan(pos,Zeros)) ) { return 0.0; }

	// Determine the nearby slice
	float z = pos.z * NzM1;	
	float slice = floor(z);
	
	// Determine the tile and mosaic indices	
    float NumSlicesInFirstMosaic = 4.0*uMosaicDims[0]*uMosaicDims[1];
	int mosaicIndex = int( floor(slice/NumSlicesInFirstMosaic) );
	float sliceWithinMosaic = mod(slice, NumSlicesInFirstMosaic);

	// Compute the texture coordinates
	vec2 mInv = (mosaicIndex == NumMosaicsM1) ? MinvLast : MinvFirst;
	float temp = floor(sliceWithinMosaic*0.25) * mInv.x;
	float yOffset = floor(temp);
	float xOffset = temp - yOffset;
	if (xOffset > 0.9999) { xOffset = 0.0;  yOffset += 1.0; } // Fix for occasional round-off problems
	vec2 tc = vec2( xOffset + pos.x*mInv.x,  (yOffset + pos.y)*mInv.y );	

	// Sample the texture
	vec4 samp = sampleTexture(tc, mosaicIndex);

	// Pick out the appropriate (r,g,b,a) component
	int c = int( mod(slice, 4.0) );
	vec4 byteMask = vec4( float(c==0), float(c==1), float(c==2), float(c==3) );

	float pixVal = dot(samp, byteMask);
	return clamp(pixVal*PixScale - PixOffset, 0.0, 1.0);		
}
#endif




#ifdef PIXEL_LAYOUT_8BIT_LIN_MT
///////////////////////////////////////////////////////////////////////////////
//
// Gets the pixel value at a given volume point.
//
///////////////////////////////////////////////////////////////////////////////
float getNormalizedPixVal(vec3 pos)
{
	// Return zero if pos is outside the volume
	if ( any(greaterThan(pos,Ones)) || any(lessThan(pos,Zeros)) ) { return 0.0; }

	// Determine the nearby slice
	float z = pos.z * NzM1;	
	float sliceBelow = floor(z);

	// Determine the tile and mosaic indices	
    float NumSlicesInFirstMosaic = 4.0*uMosaicDims[0]*uMosaicDims[1];
	int mosaicIndexBelow = int( floor(sliceBelow/NumSlicesInFirstMosaic) );
	float sliceBelowWithinMosaic = mod(sliceBelow, NumSlicesInFirstMosaic);
	
	// Compute the texture coordinates
	vec2 mBInv = (mosaicIndexBelow == NumMosaicsM1) ? MinvLast : MinvFirst;
	float temp = floor(sliceBelowWithinMosaic*0.25) * mBInv.x;
	float yOffsetB = floor(temp);
	float xOffsetB = temp - yOffsetB;
	if (xOffsetB > 0.9999) { xOffsetB = 0.0;  yOffsetB += 1.0; } // Fix for occasional round-off problems
	vec2 tcB = vec2( xOffsetB + pos.x*mBInv.x,  (yOffsetB + pos.y)*mBInv.y );	

	// Sample the texture
	vec4 sampB = sampleTexture(tcB, mosaicIndexBelow);

	// Pick out the appropriate (r,g,b,a) component
	float pixValA, pixValB;
	int colorChannel = int( mod(sliceBelow, 4.0) );
	if (colorChannel < 3) 
	{
		vec3 byteMask = vec3( float(colorChannel==0), float(colorChannel==1), float(colorChannel==2) );
		pixValB = dot(sampB.rgb, byteMask); 
		pixValA = dot(sampB.gba, byteMask); 
	} 
	else // The bracketing slices are in different tiles, so we have more work to do
	{	
		float sliceAbove = min(sliceBelow + 1.0, NzM1);		
		int mosaicIndexAbove = int( floor(sliceAbove/NumSlicesInFirstMosaic) );	
	    float sliceAboveWithinMosaic = mod(sliceAbove, NumSlicesInFirstMosaic);
		vec2 mAInv = (mosaicIndexAbove == NumMosaicsM1) ? MinvLast : MinvFirst;

		float temp = ( floor(sliceAboveWithinMosaic*0.25) * mAInv.x );
		float yOffsetA = floor(temp);		
		float xOffsetA = temp - yOffsetA;
		if (xOffsetA > 0.9999) { xOffsetA = 0.0;  yOffsetA += 1.0; } // Fix for occasional round-off problems
		vec2 tcA = vec2( xOffsetA + pos.x*mAInv.x,   (yOffsetA + pos.y)*mAInv.y );

		vec4 sampA = sampleTexture(tcA, mosaicIndexAbove);
		pixValB = sampB.a;
		pixValA = sampA.r;
	} 		
	
	float pixVal = mix( pixValB, pixValA, z-sliceBelow );
	return clamp(pixVal*PixScale - PixOffset, 0.0, 1.0);			
}
#endif


///////////////////////////////////////////////////////////////////////////////
//
// Determines whether a given volume point is masked.
//
///////////////////////////////////////////////////////////////////////////////
bool isMasked(vec3 pos)
{
	vec2 ToFloat16le = vec2(1.0, 256.0)/257.0;
	vec4 maskSamp = texture2D(uMaskSampler, pos.xy);
	return (pos.z < dot(maskSamp.rg, ToFloat16le)) || (1.0 - pos.z < dot(maskSamp.ba, ToFloat16le));
}
`;


})( window.BigLime = window.BigLime || {} );







/////////////////////////////////////////////////////////////////////////
//
// ShaderCode.1.WinLevel.js
//
// This file contains the WebGL1 shader code for window-leveling. 
//
/////////////////////////////////////////////////////////////////////////
;(function(Namespace, undefined) {
    "use strict";
	Namespace.ShaderCode = Namespace.ShaderCode || {};



/////////////////////////////////////////////////////////////////////////
//
// Vertex shader.
//
/////////////////////////////////////////////////////////////////////////
Namespace.ShaderCode.winLevel_vert_1 = 
`// winLevel_vert_1
//----------------

//<<SYMBOL_DEFS>>//

precision highp float;
precision highp int;

uniform float  uWinWidth;
uniform float  uWinLevel;
attribute vec4 aPosition;
varying float  vPixScale;
varying float  vPixOffset;
varying vec2   vTexCoord;


///////////////////////////////////////////////////////////////////////////////
//
// Program entry point.
//
///////////////////////////////////////////////////////////////////////////////
void main()
{
    // Convert from clip space to texture coordinates
    vTexCoord = (aPosition.xy + 1.0)*0.5;

    // Compute the scale and offset factor for the window/level transform
    float level = uWinLevel*(257.0/65535.0);
    float width = uWinWidth*(257.0/65535.0);
	vPixScale = 1.0/(width + 0.001);
	vPixOffset = level - width/2.0;

    gl_Position = aPosition;    
}
`;




/////////////////////////////////////////////////////////////////////////
//
// Fragment shader.
//
/////////////////////////////////////////////////////////////////////////
Namespace.ShaderCode.winLevel_frag_1 = 
`// winLevel_frag_1
//----------------

//<<SYMBOL_DEFS>>//

precision highp float;
precision highp int;

uniform sampler2D uWLSampler;
uniform sampler2D uLutSampler;
uniform int       uPassThruMode;
uniform int       uColorMapIndex;
uniform vec4      uMarkerColor;
varying float     vPixScale;
varying float     vPixOffset;
varying vec2      vTexCoord;


void main()
{
	// Read the output from the renderer
	vec4 textureVal = texture2D(uWLSampler, vTexCoord);

	if (uPassThruMode > 0) 
	{
		// Pass-thru mode means we don't modify the pixels
		gl_FragColor = textureVal;
	}
	else
	{
		if (textureVal.b != 0.0) 
		{
            // Just render the marker
			gl_FragColor = vec4( ((textureVal.b+2.0)/3.0) * uMarkerColor.rgb, uMarkerColor.a );
	    }
		else
		{
		    // Get the raw pixel value
			float rawPixVal = textureVal.r + 256.0*textureVal.g;
			if (rawPixVal == 0.0) 
			{
			    // We're in the background
				gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0); 
			} 
			else 
			{
			    // Apply the window/level transform 
				float wlPixVal = clamp( vPixScale*(rawPixVal - vPixOffset), 0.0, 1.0 );
				if (uColorMapIndex == 0) {	
					gl_FragColor = vec4(wlPixVal, wlPixVal, wlPixVal, 1.0);
				}
				else {
				    // Apply the lookup table
					gl_FragColor = texture2D(uLutSampler, vec2(LUT_TX_XSCALE*wlPixVal, LUT_TX_YOFFSET + float(uColorMapIndex)*LUT_TX_YSCALE));
				}
			}
		}
	}
}
`;

})( window.BigLime = window.BigLime || {} );







/**
 * This file contains the shader code for x-ray rendering in WebGL 1.
 * 
 */
;(function(Namespace, undefined) {
	"use strict";
	Namespace.ShaderCode = Namespace.ShaderCode || {};


/**
 * Vertex shader.
 * 
 */
Namespace.ShaderCode.xray_vert_1 =
`// xray_vert_1
//-----------

//<<SYMBOL_DEFS>>//

precision highp float; // We need highp to accurately specify locations in large textures
precision highp int;

uniform mat4   uMvpTransform;
uniform mat4   uMvpInvTransform;
uniform float  uPersp;
attribute vec4 aPosition;
varying vec3   vRayStartT;
varying vec3   vRayDirT;



///////////////////////////////////////////////////////////////////////////////
//
// Program entry point.
//
///////////////////////////////////////////////////////////////////////////////
void main()
{
    // Transform the input vertex from world-space to clip-space. (Setting the w-component implements perspective.)
    gl_Position = uMvpTransform * aPosition;
    float w = gl_Position.w = 1.0 + uPersp*(gl_Position.z + 1.0); 

	// Pass the ray's starting point and direction to the fragment shader (in texture coordinates).
	// Note that scaling of vRayDirT by w is necessary for perspective-correct interpolation.
	vRayStartT = aPosition.xyz + 0.5;
	vRayDirT = w * (uMvpInvTransform * vec4(gl_Position.xy*(uPersp/w), 1.0, 0.0)).xyz;
}
`;




/**
 * Fragment shader.
 * 
 */
Namespace.ShaderCode.xray_frag_1 = 
`// xray_frag_1
//-----------

//<<SYMBOL_DEFS>>//

precision highp float; // We need highp to accurately specify locations in large textures
precision highp int;

// Uniforms and varyings
uniform sampler2D  uSampler;                      // For volumes that fit in a single texture
uniform sampler2D  uSamplers[NUM_IMAGE_TEXTURES]; // For volumes that span multiple textures
uniform sampler2D  uMaskSampler;
uniform sampler2D  uLutSampler;
uniform bool   uUseLut;
uniform bool   uMaskEnabled;
uniform float  uOpacityRange[2];
uniform float  uRayStepSize;
uniform vec3   uVolShape;
uniform float  uVolNumImages;
uniform vec4   uMosaicDims;
uniform int    uNumTextures;
uniform float  uSlabInfo[24];
varying vec3   vRayStartT;
varying vec3   vRayDirT;

// Constants
const float BBoxTol   = 0.002; 
const vec3 BboxMin    = vec3(-BBoxTol);
const vec3 BboxMax    = vec3(1.0 + BBoxTol);
const vec3 Zeros      = vec3(0.0);
const vec3 Ones       = vec3(1.0);
const vec4 ByteMaskRG = vec4(1.0, 256.0, 0.0, 0.0);
const vec4 ByteMaskBA = vec4(0.0, 0.0, 1.0, 256.0);
const vec2 ByteMask   = vec2(1.0, 256.0);
const vec2 ToFloat16  = vec2(256.0, 1.0)/257.0; // For converting a pair of bytes to a float 

// Globals
float PixScale, PixOffset;
float NzM1, MxInv, MyInv;
int NumMosaicsM1;
vec2 MinvFirst, MinvLast;
vec3 VolAspect;
#ifdef CLIP_TO_SLAB
vec3 SlabRadii;
mat4 SlabXfrm;
#endif

// Function prototypes
void calcXrayValue(vec3);
float getPixVal(vec3);
vec4 sampleTexture(vec2, int);
vec4 encodeVec3(vec3);
bool isMasked(vec3 pos);
#ifdef CLIP_TO_SLAB
void  initializeSlabInfo(vec3, vec3, out float);
#endif



///////////////////////////////////////////////////////////////////////////////
//
// Program entry point.
//
///////////////////////////////////////////////////////////////////////////////
void main()
{
	// Initialize globals
	PixScale  = 255.0 * uOpacityRange[1];
	PixOffset = uOpacityRange[0] * uOpacityRange[1];

    // Perform ray casting
	vec3 rayDir = normalize(vRayDirT);	
	calcXrayValue(rayDir);
}


///////////////////////////////////////////////////////////////////////////////
//
// Computes the attenuated x-ray value for a given ray.
//
///////////////////////////////////////////////////////////////////////////////
void calcXrayValue(vec3 rayDir)
{
	// Initialize some globals needed by the getPixVal() routines
	NumMosaicsM1 = uNumTextures - 1;	
	NzM1 = uVolNumImages - 1.0;
	MxInv = 1.0/uMosaicDims[0];
	MyInv = 1.0/uMosaicDims[1];    
	MinvFirst = vec2(1.0/uMosaicDims[0], 1.0/uMosaicDims[1]);
	MinvLast  = vec2(1.0/uMosaicDims[2], 1.0/uMosaicDims[3]);
	VolAspect = uVolShape/max(max(uVolShape.x, uVolShape.y), uVolShape.z);
	
	// Initialize the ray
	vec3 pos = vRayStartT;
	vec3 rayStep = rayDir*uRayStepSize;
	bool enteredSlab = false;
	
	// Initialize slab variables
	#ifdef CLIP_TO_SLAB
	float slabOffset;
	initializeSlabInfo(rayDir, pos, slabOffset);
	if (slabOffset - 0.05 > 0.0) { pos += (slabOffset - 0.05)*rayDir; }
	#endif	

	// Walk along the ray
	float totalAtten = 0.0;
	for (int i = 0; i < 32768; i++)
	{		
		// Check whether the ray has exited the volume
		if ( any(lessThan(pos,BboxMin)) || any(greaterThan(pos,BboxMax)) ) { break; }		

		// Honor any slab constraints
		#ifdef CLIP_TO_SLAB
		vec3 pos_s = (SlabXfrm * vec4(pos, 1.0)).xyz;
		if ( any(greaterThan(abs(pos_s), SlabRadii)) ) {
			if ( enteredSlab ) { break; }
			pos += rayStep;
			continue;
		}
		enteredSlab = true;
		#endif

		// Add the current pixel value to the total
		if (!uMaskEnabled || !isMasked(pos)) {
			float pixVal = getPixVal(pos);
			if (uUseLut) {
				float lutArg = clamp(PixScale*pixVal - PixOffset, 0.0, 1.0);	
				pixVal = 257.0 * texture2D(uLutSampler, vec2(lutArg, LUT_TX_YOFFSET)).a; 
			}
			totalAtten = min(255.0, totalAtten + uRayStepSize*pixVal);
		}	

		pos += rayStep;
	}

	// Encode the 16-bit pixel value in two 8-bit color channels	
	totalAtten *= 255.0;
	totalAtten = max(totalAtten, 1.0); // Do't allow zero, as we use zero to indicate background
	float highByte = floor(totalAtten/256.0);
	float lowByte = totalAtten - 256.0*highByte;
    gl_FragColor = vec4(lowByte/255.0, highByte/255.0, 0.0, 1.0);
}


#ifdef CLIP_TO_SLAB
///////////////////////////////////////////////////////////////////////////////
//
// Initializes slab-related variables.
//
///////////////////////////////////////////////////////////////////////////////
void initializeSlabInfo(vec3 rayDir, vec3 rayStart, out float slabOffset)
{
	// Get the corner points in volume coordinates
	vec3 p0 = vec3(uSlabInfo[0],  uSlabInfo[1],  uSlabInfo[2] );
	vec3 p1 = vec3(uSlabInfo[3],  uSlabInfo[4],  uSlabInfo[5] );
	vec3 p2 = vec3(uSlabInfo[6],  uSlabInfo[7],  uSlabInfo[8] );
	vec3 p3 = vec3(uSlabInfo[9],  uSlabInfo[10], uSlabInfo[11]);
	vec3 p4 = vec3(uSlabInfo[12], uSlabInfo[13], uSlabInfo[14]);
	vec3 p5 = vec3(uSlabInfo[15], uSlabInfo[16], uSlabInfo[17]);
	vec3 p6 = vec3(uSlabInfo[18], uSlabInfo[19], uSlabInfo[20]);
	vec3 p7 = vec3(uSlabInfo[21], uSlabInfo[22], uSlabInfo[23]);

	slabOffset = min( 
		min( min(dot(rayDir, p0), dot(rayDir, p1)), min(dot(rayDir, p2), dot(rayDir, p3)) ),
		min( min(dot(rayDir, p4), dot(rayDir, p5)), min(dot(rayDir, p6), dot(rayDir, p7)) ) 
	);
	slabOffset -= dot(rayStart, rayDir);

	// Get the slab axes and center
	p0 *= VolAspect;
	p1 *= VolAspect;
	p2 *= VolAspect;
	p4 *= VolAspect;
	p7 *= VolAspect;
	vec3 slabAxis0 = normalize(p1 - p0);
	vec3 slabAxis1 = normalize(p2 - p0);
	vec3 slabAxis2 = normalize(p4 - p0);
	vec3 slabCtr = (p0 + p7) / 2.0;

	SlabRadii = vec3(length(p1-p0)/2.0, length(p2-p0)/2.0, length(p4-p0)/2.0);

	// Construct the transformation matrix from texture coordinates to slab coordinates
	SlabXfrm = mat4(
		VolAspect.x*slabAxis0.x,  VolAspect.x*slabAxis1.x,  VolAspect.x*slabAxis2.x,  0.0,
		VolAspect.y*slabAxis0.y,  VolAspect.y*slabAxis1.y,  VolAspect.y*slabAxis2.y,  0.0,
		VolAspect.z*slabAxis0.z,  VolAspect.z*slabAxis1.z,  VolAspect.z*slabAxis2.z,  0.0,
       -dot(slabCtr, slabAxis0), -dot(slabCtr, slabAxis1), -dot(slabCtr, slabAxis2),  1.0
	);
}
#endif


///////////////////////////////////////////////////////////////////////////////
//
// Encodes the components of a vec3 in an rgba color.
//
///////////////////////////////////////////////////////////////////////////////
vec4 encodeVec3(vec3 loc)
{
	if ( any(lessThan(loc,Zeros)) || any(greaterThan(loc,Ones)) ) 
	{
		// We indicate an invalid value by setting the rightmost bit
		return vec4(0.0, 0.0, 0.0, 1.0);
	}	

	// Use 10 bits for each coordinate
	highp int xi = int( min(1023.0, (loc.x*1023.0 + 0.5)) );
	highp int yi = int( min(1023.0, (loc.y*1023.0 + 0.5)) );
	highp int zi = int( min(1023.0, (loc.z*1023.0 + 0.5)) );

	int zLo = zi - (zi/128) * 128;
	int zHi = (zi - zLo)/128;

	int yLo = yi - (yi/32) * 32;
	int yHi = (yi - yLo)/32;

	int xLo = xi - (xi/8) * 8;
	int xHi = (xi - xLo)/8;

	float a = float(zLo*2)/255.0;
	float b = float(zHi + 8*yLo)/255.0;
	float g = float(yHi + 32*xLo)/255.0;
	float r = float(xHi)/255.0;

	return vec4(r, g, b, a);
}



#ifdef PIXEL_LAYOUT_16BIT_NN_ST
///////////////////////////////////////////////////////////////////////////////
//
// Gets the pixel value at a given volume point. 
//
///////////////////////////////////////////////////////////////////////////////
float getPixVal(vec3 pos)
{
	// Return zero if pos is outside the volume
	if ( any(greaterThan(pos,Ones)) || any(lessThan(pos,Zeros)) ) { return 0.0; }

	// Determine the nearby slice
	float z = pos.z * NzM1;	
	float slice = floor(z);

	// Calculate the texture coordinate factors
	float temp = floor(slice*0.5) * MxInv;
	float yOffset = floor(temp);
	float xOffset = temp - yOffset;	
	if (xOffset > 0.9999) { xOffset = 0.0;  yOffset += 1.0; } // Fix for occasional round-off problems
	
	// Sample the texture
	vec2 tc = vec2( xOffset + pos.x*MxInv, (yOffset + pos.y)*MyInv );	
	vec4 samp = texture2D(uSampler, tc);

	// Recombine the appropriate (r,g,b,a) components to get the 16-bit pixel value
	vec4 byteMask = mix( ByteMaskRG, ByteMaskBA, mod(slice,2.0) );
	return dot(samp, byteMask);
}
#endif




#ifdef PIXEL_LAYOUT_16BIT_LIN_ST
///////////////////////////////////////////////////////////////////////////////
//
// Gets the pixel value at a given volume point.
//
///////////////////////////////////////////////////////////////////////////////
float getPixVal(vec3 pos)
{
	// Return zero if pos is outside the volume
	if ( any(greaterThan(pos,Ones)) || any(lessThan(pos,Zeros)) ) { return 0.0; }

	// Determine the nearby slice
	float z = pos.z * NzM1;	
	float sliceBelow = floor(z);

	// Calculate the texture coordinate factors
	float temp = floor(sliceBelow*0.5) * MxInv;
	float yOffsetB = floor(temp);
	float xOffsetB = temp - yOffsetB;	
	if (xOffsetB > 0.9999) { xOffsetB = 0.0;  yOffsetB += 1.0; } // Fix for occasional round-off problems

	// Sample the texture
	vec2 tcB = vec2( xOffsetB + pos.x*MxInv, (yOffsetB + pos.y)*MyInv );	
	vec4 sampB = texture2D(uSampler, tcB);

	// Recombine the appropriate (r,g,b,a) components to get the 16-bit pixel values
	float pixValA, pixValB;
	bool sliceBelowIsEven = ( mod(sliceBelow, 2.0) < 0.5 );
	if ( sliceBelowIsEven ) 
	{
		pixValB = dot(sampB.rg, ByteMask);
		pixValA = dot(sampB.ba, ByteMask);
	} 
	else // The bracketing slices are in different tiles, so we have more work to do
	{	
		float sliceAbove = min(sliceBelow + 1.0, NzM1);
		temp = floor(sliceAbove*0.5) * MxInv;
		float yOffsetA = floor(temp);		
		float xOffsetA = temp - yOffsetA;
		if (xOffsetA > 0.9999) { xOffsetA = 0.0;  yOffsetA += 1.0; } // Fix for occasional round-off problems

		vec2 tcA = vec2( xOffsetA + pos.x*MxInv, (yOffsetA + pos.y)*MyInv );
		vec4 sampA = texture2D(uSampler, tcA);
		
		pixValB = dot(sampB.ba, ByteMask);
		pixValA = dot(sampA.rg, ByteMask); 
	} 		
	
	return mix( pixValB, pixValA, z-sliceBelow );
}
#endif




#ifdef PIXEL_LAYOUT_8BIT_NN_ST
///////////////////////////////////////////////////////////////////////////////
//
// Gets the pixel value at a given volume point.
//
///////////////////////////////////////////////////////////////////////////////
float getPixVal(vec3 pos)
{
	// Return zero if pos is outside the volume
	if ( any(greaterThan(pos,Ones)) || any(lessThan(pos,Zeros)) ) { return 0.0; }

	// Determine the nearby slice
	float z = pos.z * NzM1;	
	float slice = floor(z);

	// Calculate the texture coordinate factors
	float temp = floor(slice*0.25) * MxInv;
	float yOffset = floor(temp);
	float xOffset = temp - yOffset;	
	if (xOffset > 0.9999) { xOffset = 0.0;  yOffset += 1.0; } // Fix for occasional round-off problems
	
	// Sample the texture
	vec2 tc = vec2( xOffset + pos.x*MxInv, (yOffset + pos.y)*MyInv );	
	vec4 samp = texture2D(uSampler, tc);

	// Pick out the appropriate (r,g,b,a) component
	int c = int( mod(slice, 4.0) );
	vec4 byteMask = vec4( float(c==0), float(c==1), float(c==2), float(c==3) );
	return dot(samp, byteMask);
}
#endif




#ifdef PIXEL_LAYOUT_8BIT_LIN_ST
///////////////////////////////////////////////////////////////////////////////
//
// Gets the pixel value at a given volume point.
//
///////////////////////////////////////////////////////////////////////////////
float getPixVal(vec3 pos)
{
	// Return zero if pos is outside the volume
	if ( any(greaterThan(pos,Ones)) || any(lessThan(pos,Zeros)) ) { return 0.0; }

	// Determine the nearby slice
	float z = pos.z * NzM1;	
	float sliceBelow = floor(z);

	// Calculate the texture coordinate factors
	float temp = floor(sliceBelow*0.25) * MxInv;
	float yOffsetB = floor(temp);
	float xOffsetB = temp - yOffsetB;	
	if (xOffsetB > 0.9999) { xOffsetB = 0.0;  yOffsetB += 1.0; } // Fix for occasional round-off problems

	// Sample the texture
	vec2 tcB = vec2( xOffsetB + pos.x*MxInv, (yOffsetB + pos.y)*MyInv );	
	vec4 sampB = texture2D(uSampler, tcB);

	// Pick out the appropriate (r,g,b,a) component
	float pixValA, pixValB;
	int colorChannel = int( mod(sliceBelow, 4.0) );
	if (colorChannel < 3) 
	{
		vec3 byteMask = vec3( float(colorChannel==0), float(colorChannel==1), float(colorChannel==2) );
		pixValB = dot(sampB.rgb, byteMask); 
		pixValA = dot(sampB.gba, byteMask); 
	} 
	else // The bracketing slices are in different tiles, so we have more work to do
	{	
		float sliceAbove = min(sliceBelow + 1.0, NzM1);
		temp = floor(sliceAbove*0.25) * MxInv;
		float yOffsetA = floor(temp);		
		float xOffsetA = temp - yOffsetA;
		if (xOffsetA > 0.9999) { xOffsetA = 0.0;  yOffsetA += 1.0; } // Fix for occasional round-off problems

		vec2 tcA = vec2( xOffsetA + pos.x*MxInv, (yOffsetA + pos.y)*MyInv );
		vec4 sampA = texture2D(uSampler, tcA);

		pixValB = sampB.a;
		pixValA = sampA.r;
	} 		
	
	return mix( pixValB, pixValA, z-sliceBelow );
}
#endif
 


#ifdef PIXEL_LAYOUT_16BIT_NN_MT
///////////////////////////////////////////////////////////////////////////////
//
// Gets the pixel value at a given volume point.
//
///////////////////////////////////////////////////////////////////////////////
float getPixVal(vec3 pos)
{
	// Return zero if pos is outside the volume
	if ( any(greaterThan(pos,Ones)) || any(lessThan(pos,Zeros)) ) { return 0.0; }

	// Determine the nearby slice
	float z = pos.z * NzM1;	
	float slice = floor(z);
	
	// Determine the tile and mosaic indices
    float NumSlicesInFirstMosaic = 2.0*uMosaicDims[0]*uMosaicDims[1];
	int mosaicIndex = int( floor(slice/NumSlicesInFirstMosaic) );
	float sliceWithinMosaic = mod(slice, NumSlicesInFirstMosaic);

	// Compute the texture coordinates
	vec2 mInv = (mosaicIndex == NumMosaicsM1) ? MinvLast : MinvFirst;
	float temp = floor(sliceWithinMosaic*0.5) * mInv.x;
	float yOffset = floor(temp);
	float xOffset = temp - yOffset;
	if (xOffset > 0.9999) { xOffset = 0.0;  yOffset += 1.0; } // Fix for occasional round-off problems
	vec2 tc = vec2( xOffset + pos.x*mInv.x,  (yOffset + pos.y)*mInv.y );	

	// Sample the texture
	vec4 samp = sampleTexture(tc, mosaicIndex);

	// Recombine the appropriate (r,g,b,a) components to get the 16-bit pixel value
	vec4 byteMask = mix( ByteMaskRG, ByteMaskBA, mod(slice,2.0) );
	return dot(samp, byteMask);
}
#endif




#ifdef PIXEL_LAYOUT_16BIT_LIN_MT
///////////////////////////////////////////////////////////////////////////////
//
// Gets the pixel value at a given volume point.
//
///////////////////////////////////////////////////////////////////////////////
float getPixVal(vec3 pos)
{
	// Return zero if pos is outside the volume
	if ( any(greaterThan(pos,Ones)) || any(lessThan(pos,Zeros)) ) { return 0.0; }

	// Determine the nearby slice
	float z = pos.z * NzM1;	
	float sliceBelow = floor(z);

	// Determine the tile and mosaic indices	
    float NumSlicesInFirstMosaic = 2.0*uMosaicDims[0]*uMosaicDims[1];
	int mosaicIndexBelow = int( floor(sliceBelow/NumSlicesInFirstMosaic) );
	float sliceBelowWithinMosaic = mod(sliceBelow, NumSlicesInFirstMosaic);
	
	// Compute the texture coordinates
	vec2 mBInv = (mosaicIndexBelow == NumMosaicsM1) ? MinvLast : MinvFirst;
	float temp = floor(sliceBelowWithinMosaic*0.5) * mBInv.x;
	float yOffsetB = floor(temp);
	float xOffsetB = temp - yOffsetB;
	if (xOffsetB > 0.9999) { xOffsetB = 0.0;  yOffsetB += 1.0; } // Fix for occasional round-off problems
	vec2 tcB = vec2( xOffsetB + pos.x*mBInv.x,  (yOffsetB + pos.y)*mBInv.y );	

	// Sample the texture
	vec4 sampB = sampleTexture(tcB, mosaicIndexBelow);

	// Pick out the appropriate (r,g,b,a) component
	float pixValA, pixValB;
	bool sliceBelowIsEven = ( mod(sliceBelow, 2.0) < 0.5 );
	if (sliceBelowIsEven) 
	{
		pixValB = dot(sampB, ByteMaskRG); 
		pixValA = dot(sampB, ByteMaskBA); 
	} 
	else // The bracketing slices are in different tiles, so we have more work to do
	{	
		float sliceAbove = min(sliceBelow + 1.0, NzM1);		
		int mosaicIndexAbove = int( floor(sliceAbove/NumSlicesInFirstMosaic) );	
	    float sliceAboveWithinMosaic = mod(sliceAbove, NumSlicesInFirstMosaic);
		vec2 mAInv = (mosaicIndexAbove == NumMosaicsM1) ? MinvLast : MinvFirst;

		float temp = ( floor(sliceAboveWithinMosaic*0.5) * mAInv.x );
		float yOffsetA = floor(temp);		
		float xOffsetA = temp - yOffsetA;
		if (xOffsetA > 0.9999) { xOffsetA = 0.0;  yOffsetA += 1.0; } // Fix for occasional round-off problems
		vec2 tcA = vec2( xOffsetA + pos.x*mAInv.x,   (yOffsetA + pos.y)*mAInv.y );

		vec4 sampA = sampleTexture(tcA, mosaicIndexAbove);
		pixValB = dot(sampB, ByteMaskBA);
		pixValA = dot(sampA, ByteMaskRG);
	} 		
	
	return mix( pixValB, pixValA, z-sliceBelow );
}
#endif




#ifdef PIXEL_LAYOUT_8BIT_NN_MT
///////////////////////////////////////////////////////////////////////////////
//
// Gets the pixel value at a given volume point.
//
///////////////////////////////////////////////////////////////////////////////
float getPixVal(vec3 pos)
{
	// Return zero if pos is outside the volume
	if ( any(greaterThan(pos,Ones)) || any(lessThan(pos,Zeros)) ) { return 0.0; }

	// Determine the nearby slice
	float z = pos.z * NzM1;	
	float slice = floor(z);
	
	// Determine the tile and mosaic indices	
    float NumSlicesInFirstMosaic = 4.0*uMosaicDims[0]*uMosaicDims[1];
	int mosaicIndex = int( floor(slice/NumSlicesInFirstMosaic) );
	float sliceWithinMosaic = mod(slice, NumSlicesInFirstMosaic);

	// Compute the texture coordinates
	vec2 mInv = (mosaicIndex == NumMosaicsM1) ? MinvLast : MinvFirst;
	float temp = floor(sliceWithinMosaic*0.25) * mInv.x;
	float yOffset = floor(temp);
	float xOffset = temp - yOffset;
	if (xOffset > 0.9999) { xOffset = 0.0;  yOffset += 1.0; } // Fix for occasional round-off problems
	vec2 tc = vec2( xOffset + pos.x*mInv.x,  (yOffset + pos.y)*mInv.y );	

	// Sample the texture
	vec4 samp = sampleTexture(tc, mosaicIndex);

	// Pick out the appropriate (r,g,b,a) component
	int c = int( mod(slice, 4.0) );
	vec4 byteMask = vec4( float(c==0), float(c==1), float(c==2), float(c==3) );
	return dot(samp, byteMask);
}
#endif




#ifdef PIXEL_LAYOUT_8BIT_LIN_MT
///////////////////////////////////////////////////////////////////////////////
//
// Gets the pixel value at a given volume point.
//
///////////////////////////////////////////////////////////////////////////////
float getPixVal(vec3 pos)
{
	// Return zero if pos is outside the volume
	if ( any(greaterThan(pos,Ones)) || any(lessThan(pos,Zeros)) ) { return 0.0; }

	// Determine the nearby slice
	float z = pos.z * NzM1;	
	float sliceBelow = floor(z);

	// Determine the tile and mosaic indices	
    float NumSlicesInFirstMosaic = 4.0*uMosaicDims[0]*uMosaicDims[1];
	int mosaicIndexBelow = int( floor(sliceBelow/NumSlicesInFirstMosaic) );
	float sliceBelowWithinMosaic = mod(sliceBelow, NumSlicesInFirstMosaic);
	
	// Compute the texture coordinates
	vec2 mBInv = (mosaicIndexBelow == NumMosaicsM1) ? MinvLast : MinvFirst;
	float temp = floor(sliceBelowWithinMosaic*0.25) * mBInv.x;
	float yOffsetB = floor(temp);
	float xOffsetB = temp - yOffsetB;
	if (xOffsetB > 0.9999) { xOffsetB = 0.0;  yOffsetB += 1.0; } // Fix for occasional round-off problems
	vec2 tcB = vec2( xOffsetB + pos.x*mBInv.x,  (yOffsetB + pos.y)*mBInv.y );	

	// Sample the texture
	vec4 sampB = sampleTexture(tcB, mosaicIndexBelow);

	// Pick out the appropriate (r,g,b,a) components
	float pixValA, pixValB;
	int colorChannel = int( mod(sliceBelow, 4.0) );
	if (colorChannel < 3) 
	{
		vec3 byteMask = vec3( float(colorChannel==0), float(colorChannel==1), float(colorChannel==2) );
		pixValB = dot(sampB.rgb, byteMask); 
		pixValA = dot(sampB.gba, byteMask); 
	} 
	else // The bracketing slices are in different tiles, so we have more work to do
	{	
		float sliceAbove = min(sliceBelow + 1.0, NzM1);		
		int mosaicIndexAbove = int( floor(sliceAbove/NumSlicesInFirstMosaic) );	
	    float sliceAboveWithinMosaic = mod(sliceAbove, NumSlicesInFirstMosaic);
		vec2 mAInv = (mosaicIndexAbove == NumMosaicsM1) ? MinvLast : MinvFirst;

		float temp = ( floor(sliceAboveWithinMosaic*0.25) * mAInv.x );
		float yOffsetA = floor(temp);		
		float xOffsetA = temp - yOffsetA;
		if (xOffsetA > 0.9999) { xOffsetA = 0.0;  yOffsetA += 1.0; } // Fix for occasional round-off problems
		vec2 tcA = vec2( xOffsetA + pos.x*mAInv.x,   (yOffsetA + pos.y)*mAInv.y );

		vec4 sampA = sampleTexture(tcA, mosaicIndexAbove);
		pixValB = sampB.a;
		pixValA = sampA.r;
	} 		
	
	return mix( pixValB, pixValA, z-sliceBelow );
}
#endif



///////////////////////////////////////////////////////////////////////////////
//
// Samples a given texture at a given texture coordinate.
//
///////////////////////////////////////////////////////////////////////////////
vec4 sampleTexture(vec2 tc, int textureIndex)
{
	// Performance seems to be better if we unroll the first few terms:
	if (textureIndex == 0) {
		return texture2D(uSamplers[0], tc);
	}
	#if NUM_IMAGE_TEXTURES >= 2
	else if (textureIndex == 1) {
		return texture2D(uSamplers[1], tc);
	} 
	#if NUM_IMAGE_TEXTURES >= 3
	else if (textureIndex == 2) {
		return texture2D(uSamplers[2], tc);
	} 
	#if NUM_IMAGE_TEXTURES >= 4
	else if (textureIndex == 3) {
		return texture2D(uSamplers[3], tc);
	} 
	#endif
	#endif
	#endif
	else 
	{
		for (int i=4; i<NUM_IMAGE_TEXTURES; i++) 
		{
			if (i == textureIndex) { return texture2D(uSamplers[i], tc);}
		}
	}
} 


///////////////////////////////////////////////////////////////////////////////
//
// Determines whether a given volume point is masked.
//
///////////////////////////////////////////////////////////////////////////////
bool isMasked(vec3 pos)
{
	vec2 ToFloat16le = vec2(1.0, 256.0)/257.0;
	vec4 maskSamp = texture2D(uMaskSampler, pos.xy);
	return (pos.z < dot(maskSamp.rg, ToFloat16le)) || (1.0 - pos.z < dot(maskSamp.ba, ToFloat16le));
}
`;


})( window.BigLime = window.BigLime || {} );







/**
 * This file contains the shader code for graphics (mesh) rendering in WebGL 2.
 * 
 */
;(function(Namespace, undefined) {
	"use strict";
	Namespace.ShaderCode = Namespace.ShaderCode || {};


/**
 * Vertex shader.
 * 
 */
Namespace.ShaderCode.gfx_vert_2 = 
`#version 300 es
// gfx_vert_2

//<<SYMBOL_DEFS>>//

precision highp float; 
precision highp int;

in vec4 aPosition;
in vec3 aNormal;
in vec4 aColor;
in vec4 aMaterial;

uniform mat4 uMvpTransform;
uniform mat4 uRotMatrix;
uniform float uPersp;

out vec4 vPosition;
out vec3 vNormal;
out vec4 vColor;
out vec4 vMaterial;



///////////////////////////////////////////////////////////////////////////////
//
// Program entry point.
//
///////////////////////////////////////////////////////////////////////////////
void main()
{
    // Transform the input vertex from world-space to clip-space. (Setting the w-component implements perspective.)
    gl_Position = uMvpTransform * aPosition;
    gl_Position.w = 1.0 + uPersp*(gl_Position.z + 1.0); 

    // Transform the normal as well
    vNormal = mat3(uRotMatrix) * aNormal; 

    // Set varying values
    vPosition = gl_Position;
    vMaterial = aMaterial;
    vColor = aColor;
}
`;




/**
 * Fragment shader.
 * 
 */
Namespace.ShaderCode.gfx_frag_2 = 
`#version 300 es
// gfx_frag_2

//<<SYMBOL_DEFS>>//

precision highp float; 
precision highp int;

// Uniforms and varyings
uniform bool  uRenderDepthMap;
in vec4       vPosition;
in vec3       vNormal;
in vec4       vColor;
in vec4       vMaterial;
out vec4      outColor;



///////////////////////////////////////////////////////////////////////////////
//
// Program entry point.
//
///////////////////////////////////////////////////////////////////////////////
void main()
{
    if (uRenderDepthMap) 
    {
        // Encode the depth in the b and a channels of the output color
        float depth = 65535.0*clamp((vPosition.z+1.0)/2.0, 0.0, 1.0);
        float dHigh = floor(depth/256.0);
        float dLo = (depth - dHigh*256.0);
        outColor = vec4(0.0, 0.0, dHigh/255.0, dLo/255.0);
    }
    else
    {
        // Apply lighting to the fragment color
        float mAmbient      = vMaterial.r * 2.0;
        float mDiffuse      = vMaterial.g * 2.0;
        float mSpecStrength = vMaterial.b * 2.0;
        float mSpecPower    = vMaterial.a * 255.0;

        vec3 lightDir = vec3(0.0, 0.0, 1.0);
        float cdot = clamp(-dot(normalize(vNormal), lightDir), 0.0, 1.0);
        float diffuse = mDiffuse*(cdot - 0.6);
        float specular = (mSpecStrength == 0.0) ? 0.0 : mSpecStrength * pow(cdot,mSpecPower);
        
        float light = max(0.0, mAmbient + diffuse + specular );   
        outColor = vec4(vColor.rgb*light, vColor.a);
    }
}
`;

})( window.BigLime = window.BigLime || {} );







/**
 * This file contains the shader code for MIP rendering in WebGL 2.
 * 
 */
;(function(Namespace, undefined) {
	"use strict";
	Namespace.ShaderCode = Namespace.ShaderCode || {};


/**
 * Vertex shader.
 * 
 */
Namespace.ShaderCode.mip_vert_2 =
`#version 300 es
// mip_vert_2

//<<SYMBOL_DEFS>>//

precision highp float; // We need highp to accurately specify locations in large textures
precision highp int;

uniform mat4  uMvpTransform;
uniform mat4  uMvpInvTransform;
uniform float uPersp;
in vec4       aPosition;
out vec3      vRayStartT;
out vec3      vRayDirT;



///////////////////////////////////////////////////////////////////////////////
//
// Program entry point.
//
///////////////////////////////////////////////////////////////////////////////
void main()
{
    // Transform the input vertex from world-space to clip-space. (Setting the w-component implements perspective.)
    gl_Position = uMvpTransform * aPosition;
    float w = gl_Position.w = 1.0 + uPersp*(gl_Position.z + 1.0); 

	// Pass the ray's starting point and direction to the fragment shader (in texture coordinates).
	// Note that scaling of vRayDirT by w is necessary for perspective-correct interpolation.
	vRayStartT = aPosition.xyz + 0.5;
	vRayDirT = w * (uMvpInvTransform * vec4(gl_Position.xy*(uPersp/w), 1.0, 0.0)).xyz;
}
`;




/**
 * Fragment shader.
 * 
 */
Namespace.ShaderCode.mip_frag_2 = 
`#version 300 es
// mip_frag_2

//<<SYMBOL_DEFS>>//

precision highp float; // We need highp to accurately specify locations in large textures
precision highp int;
precision highp sampler3D;

// Uniforms and varyings
uniform sampler3D  uVolumeSampler;
uniform sampler2D  uMaskSampler;
uniform bool       uMaskEnabled;
uniform int    uBitsPerPixel;
uniform float  uRayStepSize;
uniform vec3   uVolShape;
uniform float  uSlabInfo[24];
uniform bool   uPickMode;
uniform vec2   uPickPoint;
uniform bool   uShowMarker;
uniform vec3   uMarkerLoc;
uniform float  uMarkerSize;
in  vec3 vRayStartT;
in  vec3 vRayDirT;
out vec4 outColor;

// Constants
const float BBoxTol = 0.002; 
const vec3 BboxMin  = vec3(-BBoxTol);
const vec3 BboxMax  = vec3(1.0 + BBoxTol);
const vec3 Zeros    = vec3(0.0);
const vec3 Ones     = vec3(1.0);

// Globals
vec2 PixConvert;
vec3 VolAspect;
#ifdef CLIP_TO_SLAB
vec3 SlabRadii;
mat4 SlabXfrm;
#endif

// Function prototypes
bool calcMipValue(vec3);
bool calcPickLocation(vec3);
vec4 encodeVec3(vec3);
bool isMasked(vec3);
#ifdef CLIP_TO_SLAB
void  initializeSlabInfo(vec3, vec3, out float);
#endif


///////////////////////////////////////////////////////////////////////////////
//
// Program entry point.
//
///////////////////////////////////////////////////////////////////////////////
void main()
{
	// Initialize globals
	PixConvert = vec2(1.0, 256.0*float(uBitsPerPixel > 8));
		
    // Perform ray casting
	vec3 rayDir = normalize(vRayDirT);	
	bool stat = calcPickLocation(rayDir) || calcMipValue(rayDir);
}


///////////////////////////////////////////////////////////////////////////////
//
// Computes the maximum intensity along a ray.
//
///////////////////////////////////////////////////////////////////////////////
bool calcMipValue(vec3 rayDir)
{
	VolAspect = uVolShape/max(max(uVolShape.x, uVolShape.y), uVolShape.z);

	// Initialize the ray
	vec3 pos = vRayStartT;
	vec3 rayStep = rayDir*uRayStepSize;
	float rayToMarkerDist = 10.0;
	bool enteredSlab = false;

	// Initialize slab variables
	#ifdef CLIP_TO_SLAB
	float slabOffset;
	initializeSlabInfo(rayDir, pos, slabOffset);
	if (slabOffset - 0.05 > 0.0) { pos += (slabOffset - 0.05)*rayDir; }
	#endif	

	// Walk along the ray
	float maxPixVal = 0.0;
	int NumSteps = int(sqrt(3.0)/uRayStepSize + 0.5);
	for (int i = 0; i < NumSteps; i++)
	{		
		// Check whether the ray has exited the volume
		if ( any(lessThan(pos,BboxMin)) || any(greaterThan(pos,BboxMax)) ) { break; }		

		// Honor any slab constraints
		#ifdef CLIP_TO_SLAB
		vec3 pos_s = (SlabXfrm * vec4(pos, 1.0)).xyz;
		if ( any(greaterThan(abs(pos_s), SlabRadii)) ) {
			if ( enteredSlab ) { break; }
			pos += rayStep;
			continue;
		}
		enteredSlab = true;
		#endif
		
		// Get the current pixel value and compare it with the maximum
		if (!uMaskEnabled || !isMasked(pos)) { 
			vec4 samp = texture(uVolumeSampler, pos);
			float pixVal = dot(samp.rg, PixConvert);			
			maxPixVal = max( maxPixVal, pixVal );
		}	
			
		// Check whether to display a marker
		rayToMarkerDist = min(rayToMarkerDist, length((pos-uMarkerLoc)*VolAspect));	

		pos += rayStep;
	}

	// Encode the 16-bit pixel value in two 8-bit color channels	
	maxPixVal *= 255.0;
	maxPixVal = max(maxPixVal, 1.0); // Don't allow zero, as we use zero to indicate background
	float highByte = floor(maxPixVal/256.0);
	float lowByte = maxPixVal - 256.0*highByte;
	float b = float(uShowMarker) * max(0.0, 1.0-rayToMarkerDist/uMarkerSize);
	outColor = vec4(lowByte/255.0, highByte/255.0, b, 1.0);
	return true;
}


///////////////////////////////////////////////////////////////////////////////
//
// Computes the location of the maximum intensity point along a ray.
//
///////////////////////////////////////////////////////////////////////////////
bool calcPickLocation(vec3 rayDir)
{
    if (!uPickMode) { return false; }

	float tol = 1.0; // NB: Units here are pixels, not fractional texture coordinates
	if ( (abs(gl_FragCoord.x - uPickPoint.x) > tol) ||  (abs(gl_FragCoord.y - uPickPoint.y) > tol) ) 
	{
		// Skip the computation if this is not the target fragment
		outColor = vec4(0.0, 0.0, 0.0, 0.0);
	}
	else
	{	
		VolAspect = uVolShape/max(max(uVolShape.x, uVolShape.y), uVolShape.z);

		// Initialize the ray
		vec3 pos = vRayStartT;
		vec3 rayStep = rayDir*uRayStepSize;
		bool enteredSlab = false;

		// Initialize slab variables
		#ifdef CLIP_TO_SLAB
		float slabOffset;
		initializeSlabInfo(rayDir, pos, slabOffset);
		if (slabOffset - 0.05 > 0.0) { pos += (slabOffset - 0.05)*rayDir; }
		#endif	

		// Initialize max info
		float maxPixVal = 0.0;
		vec3 maxLoc = vec3(-1.0);

		// Walk along the ray
		int NumSteps = int(sqrt(3.0)/uRayStepSize + 0.5);
		for (int i = 0; i < NumSteps; i++)
		{		
			// Check whether the ray has exited the volume
			if ( any(lessThan(pos,BboxMin)) || any(greaterThan(pos,BboxMax)) ) { break; }		

			// Honor any slab constraints
			#ifdef CLIP_TO_SLAB
			vec3 pos_s = (SlabXfrm * vec4(pos, 1.0)).xyz;
			if ( any(greaterThan(abs(pos_s), SlabRadii)) ) {
				if ( enteredSlab ) { break; }
				pos += rayStep;
				continue;
			}
			enteredSlab = true;
			#endif
			
			// Get the current pixel value and compare it with the maximum
			if (!uMaskEnabled || !isMasked(pos)) { 
				vec4 samp = texture(uVolumeSampler, pos);
				float pixVal = dot(samp.rg, PixConvert);			
				if (pixVal > maxPixVal) {
					maxPixVal = pixVal;
					maxLoc = pos;	
				}
			}	
			pos += rayStep;
		}

		// Encode the max location in the output color	
		outColor = encodeVec3(maxLoc);
	}
	return true;
}
	

#ifdef CLIP_TO_SLAB
///////////////////////////////////////////////////////////////////////////////
//
// Initializes slab-related variables.
//
///////////////////////////////////////////////////////////////////////////////
void initializeSlabInfo(vec3 rayDir, vec3 rayStart, out float slabOffset)
{
	// Get the corner points in volume coordinates
	vec3 p0 = vec3(uSlabInfo[0],  uSlabInfo[1],  uSlabInfo[2] );
	vec3 p1 = vec3(uSlabInfo[3],  uSlabInfo[4],  uSlabInfo[5] );
	vec3 p2 = vec3(uSlabInfo[6],  uSlabInfo[7],  uSlabInfo[8] );
	vec3 p3 = vec3(uSlabInfo[9],  uSlabInfo[10], uSlabInfo[11]);
	vec3 p4 = vec3(uSlabInfo[12], uSlabInfo[13], uSlabInfo[14]);
	vec3 p5 = vec3(uSlabInfo[15], uSlabInfo[16], uSlabInfo[17]);
	vec3 p6 = vec3(uSlabInfo[18], uSlabInfo[19], uSlabInfo[20]);
	vec3 p7 = vec3(uSlabInfo[21], uSlabInfo[22], uSlabInfo[23]);

	slabOffset = min( 
		min( min(dot(rayDir, p0), dot(rayDir, p1)), min(dot(rayDir, p2), dot(rayDir, p3)) ),
		min( min(dot(rayDir, p4), dot(rayDir, p5)), min(dot(rayDir, p6), dot(rayDir, p7)) ) 
	);
	slabOffset -= dot(rayStart, rayDir);

	// Get the slab axes and center
	p0 *= VolAspect;
	p1 *= VolAspect;
	p2 *= VolAspect;
	p4 *= VolAspect;
	p7 *= VolAspect;
	vec3 slabAxis0 = normalize(p1 - p0);
	vec3 slabAxis1 = normalize(p2 - p0);
	vec3 slabAxis2 = normalize(p4 - p0);
	vec3 slabCtr = (p0 + p7) / 2.0;

	SlabRadii = vec3(length(p1-p0)/2.0, length(p2-p0)/2.0, length(p4-p0)/2.0);

	// Construct the transformation matrix from texture coordinates to slab coordinates
	SlabXfrm = mat4(
		VolAspect.x*slabAxis0.x,  VolAspect.x*slabAxis1.x,  VolAspect.x*slabAxis2.x,  0.0,
		VolAspect.y*slabAxis0.y,  VolAspect.y*slabAxis1.y,  VolAspect.y*slabAxis2.y,  0.0,
		VolAspect.z*slabAxis0.z,  VolAspect.z*slabAxis1.z,  VolAspect.z*slabAxis2.z,  0.0,
       -dot(slabCtr, slabAxis0), -dot(slabCtr, slabAxis1), -dot(slabCtr, slabAxis2),  1.0
	);
}
#endif


///////////////////////////////////////////////////////////////////////////////
//
// Encodes the components of a vec3 in an rgba color.
//
///////////////////////////////////////////////////////////////////////////////
vec4 encodeVec3(vec3 loc)
{
	if ( any(lessThan(loc,Zeros)) || any(greaterThan(loc,Ones)) ) 
	{
		// We indicate an invalid value by setting the rightmost bit
		return vec4(0.0, 0.0, 0.0, 1.0);
	}	

	// Use 10 bits for each coordinate
	int xi = min(1023, int(loc.x*1023.0 + 0.5));
	int yi = min(1023, int(loc.y*1023.0 + 0.5));
	int zi = min(1023, int(loc.z*1023.0 + 0.5));

	int zLo = zi - (zi/128) * 128;
	int zHi = (zi - zLo)/128;

	int yLo = yi - (yi/32) * 32;
	int yHi = (yi - yLo)/32;

	int xLo = xi - (xi/8) * 8;
	int xHi = (xi - xLo)/8;

	float a = float(zLo*2)/255.0;
	float b = float(zHi + 8*yLo)/255.0;
	float g = float(yHi + 32*xLo)/255.0;
	float r = float(xHi)/255.0;

	return vec4(r, g, b, a);
}


///////////////////////////////////////////////////////////////////////////////
//
// Determines whether a given volume point is masked.
//
///////////////////////////////////////////////////////////////////////////////
bool isMasked(vec3 pos)
{
	vec2 ToFloat16le = vec2(1.0, 256.0)/257.0;
	vec4 maskSamp = texture(uMaskSampler, pos.xy);
	return (pos.z < dot(maskSamp.rg, ToFloat16le)) || (1.0 - pos.z < dot(maskSamp.ba, ToFloat16le));
}
`;

})( window.BigLime = window.BigLime || {} );







/**
 * This file contains the WebGL2 shader code for rendering shadow maps. 
 * 
 */
;(function(Namespace, undefined) {
	"use strict";
	Namespace.ShaderCode = Namespace.ShaderCode || {};



/**
 * Vertex shader.
 * 
 */
Namespace.ShaderCode.shadows_vert_2 = 
`#version 300 es
// shadows_vert_2

//<<SYMBOL_DEFS>>//

precision highp float; // We need highp to accurately specify locations in large textures
precision highp int;

uniform mat4 uShadowMvpTransform;
uniform mat4 uShadowMvpInvTransform;
in vec4      aPosition;
out vec3     vRayStartT;
out vec3     vRayDirT;


///////////////////////////////////////////////////////////////////////////////
//
// Program entry point.
//
///////////////////////////////////////////////////////////////////////////////
void main()
{
    // Transform the input vertex from world-space to clip-space
    gl_Position = uShadowMvpTransform * aPosition; 

    // Pass the ray's starting point and direction, in texture coordinates, to the fragment shader
	vRayStartT = aPosition.xyz + 0.5;
	vRayDirT = (uShadowMvpInvTransform * vec4(0.0, 0.0, 1.0, 0.0)).xyz;
}
`;



/**
 * Fragment shader.
 * 
 */
Namespace.ShaderCode.shadows_frag_2 = 
`#version 300 es
// shadows_frag_2

//<<SYMBOL_DEFS>>//

precision highp float; // We need highp to accurately specify locations in large textures
precision highp int;
precision highp sampler3D;

// Uniforms and varyings
uniform sampler3D  uVolumeSampler;
uniform sampler2D  uLutSampler;
uniform sampler2D  uMaskSampler;
uniform bool       uMaskEnabled;
uniform vec3       uVolShape;
uniform int        uBitsPerPixel;
uniform float      uRayStepSize;
uniform float      uOpacityRange[2];
uniform float      uSlabInfo[24];
uniform mat4       uShadowMvpTransform;

in  vec3 vRayStartT;
in  vec3 vRayDirT;
out vec4 outColor;

// Constants
const vec3 Ones             = vec3(1.0);
const vec3 Zeros            = vec3(0.0);
const float BBoxTol         = 0.002; 
const vec3 BboxMin          = vec3(-BBoxTol);
const vec3 BboxMax          = vec3(1.0+BBoxTol);
const float TransparencySat = 0.02; // Saturation value

// Globals
vec3 VolAspect;
vec2 PixConvert;
float PixScale, PixOffset;
#ifdef CLIP_TO_SLAB
vec3 SlabRadii, SlabAxes[3];
mat4 SlabXfrm;
#endif

// Function prototypes
vec4 renderShadowMap(vec3);
float getNormalizedPixVal(vec3);
vec4  encodeFloat(float);
bool isMasked(vec3);
#ifdef CLIP_TO_SLAB
void  initializeSlabInfo(vec3, vec3, out float);
#endif



///////////////////////////////////////////////////////////////////////////////
//
// Program entry point.
//
///////////////////////////////////////////////////////////////////////////////
void main()
{
	// Initialize globals
	PixConvert = vec2(1.0, 256.0*float(uBitsPerPixel > 8));
	PixScale   = 255.0 * uOpacityRange[1];
	PixOffset  = uOpacityRange[0] * uOpacityRange[1];

	// Compute the shadow map
    outColor = renderShadowMap( normalize(vRayDirT) );
}


///////////////////////////////////////////////////////////////////////////////
//
// Computes the shadow map.
//
///////////////////////////////////////////////////////////////////////////////
vec4 renderShadowMap(vec3 rayDir)
{
	VolAspect = uVolShape/max(max(uVolShape.x, uVolShape.y), uVolShape.z);

	// Initialize locals
	float stepSize   = uRayStepSize;
	vec3  rayStep    = stepSize * rayDir;
	float opacityExp = stepSize * 128.0;
	float bestDelta  = -1.0; 
	float bestDepth  =  1.0;
	vec4 shadowMvp   = vec4(uShadowMvpTransform[0][2], uShadowMvpTransform[1][2], uShadowMvpTransform[2][2], uShadowMvpTransform[3][2]);

	// Initialize the ray
	vec3 pos        = vRayStartT;
	float tTot      = 1.0;
	float tBase     = 1.0;
	bool climbing   = false;
	bool enteredSlab = false;
	
	// Initialize slab variables
	#ifdef CLIP_TO_SLAB
	float slabOffset;
	initializeSlabInfo(rayDir, pos, slabOffset);
	if (slabOffset - 0.05 > 0.0) { pos += (slabOffset - 0.05)*rayDir; }
	#endif

	// Walk along the ray, looking for the largest jump in opacity
	int NumSteps = int(4.0/uRayStepSize); // We'll break out of the loop before hitting NumSteps
	for (int i = 0; i < NumSteps; i++)
	{		
		// Honor any slab constraints
		#ifdef CLIP_TO_SLAB
		vec3 pos_s = (SlabXfrm * vec4(pos, 1.0)).xyz;
		if ( any(greaterThan(abs(pos_s), SlabRadii)) ) {
			if ( enteredSlab ) { break; }
			stepSize = 2.0*uRayStepSize;
			rayStep = stepSize*rayDir;			
			pos += rayStep; 
			continue;
		}
		enteredSlab = true;
		#endif

		if (uMaskEnabled && isMasked(pos)) { 
			pos += rayStep; 
			continue; 
		}

		// Get the cuurent voxel's opacity 
		float opac = texture( uLutSampler, vec2(getNormalizedPixVal(pos), LUT_TX_YOFFSET)).a;
		if (opac == 0.0)
		{
			// We have entered an empty-space region, so increase the stepsize
			stepSize = 2.0*uRayStepSize;
			rayStep = stepSize*rayDir;
		}
		else if (stepSize > 1.5*uRayStepSize) 
		{
			// Revert to normal-size steps, and back-up a bit
			stepSize = uRayStepSize;
			rayStep = stepSize*rayDir;
			pos -= rayStep;
			opac = texture( uLutSampler, vec2(getNormalizedPixVal(pos), LUT_TX_YOFFSET)).a;
		}

		// Update the accumulated transparency
		float t = pow(max(0.0, 1.0-opac), opacityExp);
		tBase = mix(tBase, tTot, float(!climbing));
		tTot *= t;
		climbing = climbing || (t < 0.99);

		// Check whether we are ending a climb, or maybe even the whole ray
		vec3 nextPos = pos + rayStep;
		bool terminateRay = (tTot < TransparencySat) || any(lessThan(nextPos, BboxMin)) || any(greaterThan(nextPos, BboxMax));
		if ( climbing && ((t >= 0.99) || terminateRay) ) // We are ending a climb
		{
			climbing = false;
			float delta = tBase - tTot; 
			float improved = float(delta > bestDelta);
			bestDelta = mix(bestDelta, delta, improved);
			bestDepth = mix(bestDepth, dot(shadowMvp, vec4(pos-0.5, 1.0)), improved);
			terminateRay = terminateRay || (bestDelta >= tTot);  				
		}
		if (terminateRay) { break; }

		pos = nextPos;
	}
	
	// Return the best depth estimate
	float d = (bestDepth + 1.0)/2.0; // Ranges between 0.0 and 1.0
	return encodeFloat(d);
}


///////////////////////////////////////////////////////////////////////////////
//
// Gets the pixel value at a given volume point, normalized to the
//   range [0,1].
//
///////////////////////////////////////////////////////////////////////////////
float getNormalizedPixVal(vec3 pos)
{	
	// Sample the volume
	vec4 samp = texture(uVolumeSampler, pos);

	// Combine color channels to decode the pixel value
	bool inBounds = all(lessThanEqual(pos,Ones)) && all(greaterThanEqual(pos,Zeros));
	float pixVal = dot(samp.rg, PixConvert) * float(inBounds);	

	// Normalize
	return clamp(pixVal*PixScale - PixOffset, 0.0, 1.0);	
}


#ifdef CLIP_TO_SLAB
///////////////////////////////////////////////////////////////////////////////
//
// Initializes slab-related variables.
//
///////////////////////////////////////////////////////////////////////////////
void initializeSlabInfo(vec3 rayDir, vec3 rayStart, out float slabOffset)
{
	// Get the corner points in volume coordinates
	vec3 p0 = vec3(uSlabInfo[0],  uSlabInfo[1],  uSlabInfo[2] );
	vec3 p1 = vec3(uSlabInfo[3],  uSlabInfo[4],  uSlabInfo[5] );
	vec3 p2 = vec3(uSlabInfo[6],  uSlabInfo[7],  uSlabInfo[8] );
	vec3 p3 = vec3(uSlabInfo[9],  uSlabInfo[10], uSlabInfo[11]);
	vec3 p4 = vec3(uSlabInfo[12], uSlabInfo[13], uSlabInfo[14]);
	vec3 p5 = vec3(uSlabInfo[15], uSlabInfo[16], uSlabInfo[17]);
	vec3 p6 = vec3(uSlabInfo[18], uSlabInfo[19], uSlabInfo[20]);
	vec3 p7 = vec3(uSlabInfo[21], uSlabInfo[22], uSlabInfo[23]);

	slabOffset = min( 
		min( min(dot(rayDir, p0), dot(rayDir, p1)), min(dot(rayDir, p2), dot(rayDir, p3)) ),
		min( min(dot(rayDir, p4), dot(rayDir, p5)), min(dot(rayDir, p6), dot(rayDir, p7)) ) 
	);
	slabOffset -= dot(rayStart, rayDir);

	// Get the slab axes and center
	p0 *= VolAspect;
	p1 *= VolAspect;
	p2 *= VolAspect;
	p4 *= VolAspect;
	p7 *= VolAspect;
	SlabAxes[0] = normalize(p1 - p0);
	SlabAxes[1] = normalize(p2 - p0);
	SlabAxes[2] = normalize(p4 - p0);
	vec3 slabCtr = (p0 + p7) / 2.0;

	SlabRadii = vec3(length(p1-p0)/2.0, length(p2-p0)/2.0, length(p4-p0)/2.0);

	// Construct the transformation matrix from texture coordinates to slab coordinates
	SlabXfrm = mat4(
		VolAspect.x*SlabAxes[0].x,  VolAspect.x*SlabAxes[1].x,  VolAspect.x*SlabAxes[2].x,  0.0,
		VolAspect.y*SlabAxes[0].y,  VolAspect.y*SlabAxes[1].y,  VolAspect.y*SlabAxes[2].y,  0.0,
		VolAspect.z*SlabAxes[0].z,  VolAspect.z*SlabAxes[1].z,  VolAspect.z*SlabAxes[2].z,  0.0,
       -dot(slabCtr, SlabAxes[0]), -dot(slabCtr, SlabAxes[1]), -dot(slabCtr, SlabAxes[2]),  1.0
	);
}
#endif


///////////////////////////////////////////////////////////////////////////////
//
// Encodes a float value in the first two components of a vec4.
//
///////////////////////////////////////////////////////////////////////////////
vec4 encodeFloat(float val)
{
	float cVal = 65535.0 * clamp(val, 0.0, 1.0);
	float dHi = floor(cVal/256.0);
	float dLo = cVal - dHi*256.0;
	return vec4(dHi/255.0, dLo/255.0, 0.0, 1.0);
}
	

///////////////////////////////////////////////////////////////////////////////
//
// Determines whether a given volume point is masked.
//
///////////////////////////////////////////////////////////////////////////////
bool isMasked(vec3 pos)
{
	vec2 ToFloat16le = vec2(1.0, 256.0)/257.0;
	vec4 maskSamp = texture(uMaskSampler, pos.xy);
	return (pos.z < dot(maskSamp.rg, ToFloat16le)) || (1.0 - pos.z < dot(maskSamp.ba, ToFloat16le));
}
`;

})( window.BigLime = window.BigLime || {} );







/////////////////////////////////////////////////////////////////////////
//
// ShaderCode.2.Slab.js
//
// This file contains the WebGL2 shader code for drawing a slab wireframe. 
//
/////////////////////////////////////////////////////////////////////////
;(function(Namespace, undefined) {
    "use strict";
	Namespace.ShaderCode = Namespace.ShaderCode || {};



/////////////////////////////////////////////////////////////////////////
//
// Vertex shader.
//
/////////////////////////////////////////////////////////////////////////
Namespace.ShaderCode.slab_vert_2 = 
`#version 300 es
// slab_vert_2

//<<SYMBOL_DEFS>>//

precision highp float;
precision highp int;

in vec4       aPosition;
in vec4       aColor;
out vec4      vColor;
uniform mat4  uMvpTransform;
uniform float uPersp;


///////////////////////////////////////////////////////////////////////////////
//
// Program entry point.
//
///////////////////////////////////////////////////////////////////////////////
void main()
{
    gl_Position = uMvpTransform * aPosition;
    gl_Position.w = 1.0 + uPersp*(gl_Position.z + 1.0);
    vColor = aColor;
}
`;




/////////////////////////////////////////////////////////////////////////
//
// Fragment shader.
//
/////////////////////////////////////////////////////////////////////////
Namespace.ShaderCode.slab_frag_2  = 
`#version 300 es
// slab_frag_2

//<<SYMBOL_DEFS>>//

precision highp float; 
precision highp int;
in vec4 vColor;
out vec4 outColor;


///////////////////////////////////////////////////////////////////////////////
//
// Program entry point.
//
///////////////////////////////////////////////////////////////////////////////
void main()
{
    outColor = vColor;
}
`;


})( window.BigLime = window.BigLime || {} );







/**
 * This file contains the shader code for volume rendering in WebGL 2.
 * 
 */
;(function(Namespace, undefined) {
    "use strict";
	Namespace.ShaderCode = Namespace.ShaderCode || {};



/**
 * Vertex shader.
 * 
 */
Namespace.ShaderCode.vr_vert_2 = 
`#version 300 es
// vr_vert_2

//<<SYMBOL_DEFS>>//

precision highp float; // We need highp to accurately specify locations in large textures
precision highp int;

in vec4       aPosition;
uniform mat4  uMvpTransform;
uniform mat4  uMvpInvTransform;
uniform float uPersp;
out vec3      vRayStartT;
out vec3      vRayDirT;


///////////////////////////////////////////////////////////////////////////////
//
// Program entry point.
//
///////////////////////////////////////////////////////////////////////////////
void main()
{
    // Transform the input vertex from world-space to clip-space. (Setting the w-component implements perspective.)
    gl_Position = uMvpTransform * aPosition;
    float w = gl_Position.w = 1.0 + uPersp*(gl_Position.z + 1.0); 

	// Pass the ray's starting point and direction to the fragment shader (in texture coordinates).
	// Note that scaling of vRayDirT by w is necessary for perspective-correct interpolation.
	vRayStartT = aPosition.xyz + 0.5;
	vRayDirT = w * (uMvpInvTransform * vec4(gl_Position.xy*(uPersp/w), 1.0, 0.0)).xyz;
}
`;




/**
 * Fragment shader.
 * 
 */
Namespace.ShaderCode.vr_frag_2 = 
`#version 300 es
// vr_frag_2

//<<SYMBOL_DEFS>>//

precision highp float; // We need highp to accurately specify locations in large textures
precision highp int;
precision highp sampler3D;

// Uniforms and varyings
uniform sampler3D  uVolumeSampler;
uniform sampler2D  uLutSampler;
uniform sampler2D  uMaskSampler;
uniform bool       uMaskEnabled;
uniform vec3   uVrBackColor;
uniform vec3   uVolShape;
uniform int    uBitsPerPixel;
uniform float  uRayStepSize;
uniform vec2   uOutBufferSize;
uniform float  uOpacityRange[2];
uniform int    uAntiAlias;
uniform float  uSlabInfo[24];
uniform bool   uSealBorders;
uniform bool   uPickMode;
uniform vec2   uPickPoint;
uniform bool   uShowMarker;
uniform vec3   uMarkerLoc;
uniform float  uMarkerSize;
uniform vec4   uMarkerColor;
uniform mat4   uModelTransform;
uniform mat4   uViewTransform;
uniform float  uAmbientLight;
struct Light {
	float diffuse;
	float specStrength;
	float specExp;
	float shadowDarkness;
	float shadowSoftness;
	vec3  dir;
	mat4  shadowMvp;
};
uniform Light uLights[2];

#ifdef RENDER_GRAPHICS
uniform sampler2D uGfxSampler;
uniform float uGfxBlendWeight;
#endif
#ifdef RENDER_SHADOWS
uniform sampler2D uShadowSampler;
#endif

in  vec3 vRayStartT;
in  vec3 vRayDirT;
out vec4 outColor;

 
// Constants
const vec3 UnitVectors[3]   = vec3[3]( vec3(1.0, 0.0, 0.0), vec3(0.0, 1.0, 0.0), vec3(0.0, 0.0, 1.0) );
const vec3 Ones             = vec3(1.0);
const vec3 Zeros            = vec3(0.0);
const float BBoxTol         = 0.002; 
const vec3 BboxMin          = vec3(-BBoxTol);
const vec3 BboxMax          = vec3(1.0 + BBoxTol);
const float TransparencySat = 0.02; // Saturation value
const vec2 ToFloat16        = vec2(256.0, 1.0)/257.0; // For converting a pair of bytes to a float 


// Globals
vec3 VolAspect, BorderNormal, GradOffset;
float BorderNormalWeight, BorderReflectanceWt;
vec2 PixConvert;
float PixScale, PixOffset;
#ifdef CLIP_TO_SLAB
vec3 SlabRadii, SlabAxes[3];
mat4 SlabXfrm;
#endif


// Function prototypes
bool  calcVrValue(vec3);
bool  calcPickLocation(vec3);
float getNormalizedPixVal(vec3);
void  getBorderInfo(vec3, vec3, vec3, float, vec3);
float rand(vec2);
vec4  encodeVec3(vec3);
bool isMasked(vec3);

#ifdef CLIP_TO_SLAB
void  initializeSlabInfo(vec3, vec3, out float);
#endif
#ifdef RENDER_SHADOWS
float calcShadowWeight(vec3, int);
#endif



///////////////////////////////////////////////////////////////////////////////
//
// Program entry point.
//
///////////////////////////////////////////////////////////////////////////////
void main()
{
	// Initialize globals
	PixConvert = vec2(1.0, 256.0*float(uBitsPerPixel > 8));
	PixScale   = 255.0 * uOpacityRange[1];
	PixOffset  = uOpacityRange[0] * uOpacityRange[1];
		
	// Perform ray casting
	vec3 rayDir = normalize(vRayDirT);
    bool stat = calcPickLocation(rayDir) || calcVrValue(rayDir);
}


///////////////////////////////////////////////////////////////////////////////
//
// Computes the integrated color and opacity along a ray.
//
///////////////////////////////////////////////////////////////////////////////
bool calcVrValue(vec3 rayDir)
{
	// Initializations
	VolAspect           = uVolShape/max(max(uVolShape.x, uVolShape.y), uVolShape.z);
	vec3 gdx            = vec3(1.0/uVolShape[0], 0.0, 0.0);      // Offset for computing grad.x
	vec3 gdy            = vec3(0.0, 1.0/uVolShape[1], 0.0);      // Offset for computing grad.y
	vec3 gdz            = vec3(0.0, 0.0, 1.0/uVolShape[2]);      // Offset for computing grad.z
	vec3 gradDelta      = 1.5 * vec3(gdx.x, gdy.y, gdz.z);       // Offsets for computing gradients near borders
	float stepSize      = uRayStepSize;                          // The step-size for raycasting
	vec3 rayStep        = uRayStepSize * rayDir;                 // The ray increment
	float opacityExp    = uRayStepSize * 128.0;                  // For scaling the opacity to the ray step size
	float borderThresh  = uRayStepSize * 5.0;                    // Distance threshold for shading border surfaces 
	float random        = rand(gl_FragCoord.xy);                 // For antialiasing
	int randIndex       = int(10.0*random + 1.0);
	float randRayOffset = float(uAntiAlias) * uRayStepSize * (random - 0.5); 

	// Default border values
	BorderNormal = vec3(1.0, 0.0, 0.0);
	BorderNormalWeight = 0.0;
	BorderReflectanceWt = 1.0;
	GradOffset = vec3(0.0);

	// Initialize the ray
	float tTot            = 1.0;                                 // Accumulated transparency
	vec3 cTot             = vec3(0.0);                           // Accumulated color
	vec3 pos              = vRayStartT;                          // Current ray position
	vec3 pos_s            = vec3(0.0);                           // Current ray position in slab coordinates
	float currPixVal      = getNormalizedPixVal(pos);
	float prevPixVal      = 0.0;
	float nextPixVal      = 0.0;
	vec3 prevGrad         = vec3(0.0);	
	float perpMarkerDist  = length( cross( (pos-uMarkerLoc)*VolAspect, normalize(rayDir*VolAspect) ) );
	bool omitMarkerTest   = !uShowMarker || (perpMarkerDist > uMarkerSize);
	bool enteredSlab      = false;

	
	#ifdef RENDER_GRAPHICS
	vec2 fragCoord = 0.5*gl_FragCoord.xy/uOutBufferSize;
	vec4 gfxColor0 = texture(uGfxSampler, vec2(fragCoord.x,       fragCoord.y      ));
	vec4 gfxDepth0 = texture(uGfxSampler, vec2(fragCoord.x + 0.5, fragCoord.y      ));
	vec4 gfxColor1 = texture(uGfxSampler, vec2(fragCoord.x,       fragCoord.y + 0.5));
	vec4 gfxDepth1 = texture(uGfxSampler, vec2(fragCoord.x + 0.5, fragCoord.y + 0.5));
	float depth0 = 2.0* dot(gfxDepth0.ba, ToFloat16) - 1.0;
	float depth1 = 2.0* dot(gfxDepth1.ba, ToFloat16) - 1.0;
	bool omitG0Test = (depth0 > 0.999);
	bool omitG1Test = (depth1 > 0.999);
	mat4 mvTransform = uViewTransform * uModelTransform;
	vec4 mvTransformZ = vec4(mvTransform[0][2], mvTransform[1][2], mvTransform[2][2], mvTransform[3][2]);
	#endif

	float prevShadowWeight0 = -1.0;
	float prevShadowWeight1 = -1.0;
	float sh0 = uLights[0].shadowDarkness;
	float sh1 = uLights[1].shadowDarkness;
	float drel0 = (uLights[0].diffuse == uLights[1].diffuse) ? 0.5 : uLights[0].diffuse/(uLights[0].diffuse + uLights[1].diffuse + 0.0001);
	float drel1 = 1.0 - drel0;

	// Initialize slab variables
	#ifdef CLIP_TO_SLAB
	float slabOffset;
	initializeSlabInfo(rayDir, pos, slabOffset);
	if (slabOffset - 0.05 > 0.0) { pos += (slabOffset - 0.05)*rayDir; }
	#endif

	// Walk along the ray
	int NumSteps = int(4.0/uRayStepSize); // We'll break out of the loop before hitting NumSteps
	for (int i = 0; i < NumSteps; i++)
	{		
		// We're done if the ray has exited the volume, or if the opacity threshold is exceeded
		if ( (tTot < TransparencySat) || any(lessThan(pos,BboxMin)) || any(greaterThan(pos,BboxMax)) ) { break; }

		// Does the current ray position intersect the marker?
		if (!omitMarkerTest)
		{	
			vec3 pmVec = (pos - uMarkerLoc)*VolAspect;	
			if ( length(pmVec) <= uMarkerSize ) {
				float pmPerpDist = length( cross(pmVec, normalize(rayDir*VolAspect)) );
				float shade = mix(1.0 - pmPerpDist/uMarkerSize, 1.0, 0.4);
				cTot += shade * uMarkerColor.rgb * uMarkerColor.a * tTot;
				tTot *= 1.0 - uMarkerColor.a;
				omitMarkerTest = true;
				continue;
			}
		}
					
		// Apply random ray offset for antialiasing
		pos += (float(i == randIndex) * randRayOffset) * rayDir;

		#ifdef RENDER_GRAPHICS		
		if ( !omitG0Test || !omitG1Test )
		{	
			float gPosZ = dot(mvTransformZ, vec4(pos-0.5, 1.0));
			if ((!omitG1Test) && (gPosZ > depth1)) {
				cTot += gfxColor1.rgb * gfxColor1.a * tTot;
				cTot = mix(cTot, gfxColor1.rgb, uGfxBlendWeight);
				tTot *= 1.0 - gfxColor1.a;
				omitG1Test = true;
				continue;			
			}
			if ((!omitG0Test) && (gPosZ > depth0)) {
				cTot += gfxColor0.rgb * gfxColor0.a * tTot;
				cTot = mix(cTot, gfxColor0.rgb, uGfxBlendWeight);
				tTot *= 1.0 - gfxColor0.a;
				omitG0Test = true;
				continue;			
			}
		}
		#endif		

		// Honor any slab constraints
		#ifdef CLIP_TO_SLAB
		pos_s = (SlabXfrm * vec4(pos, 1.0)).xyz;
		if ( any(greaterThan(abs(pos_s), SlabRadii)) ) {
			if ( enteredSlab ) { break; }
			prevPixVal = 0.0;  currPixVal = 0.0;
			stepSize = 2.0*uRayStepSize;
			rayStep = stepSize*rayDir;			
			pos += rayStep;  
			continue;
		}
		enteredSlab = true;
		#endif

		// Get the pixel value. Use 3-point averaging along the ray
		nextPixVal = getNormalizedPixVal(pos + rayStep);
		float pixVal = 0.25*( prevPixVal + 2.0*currPixVal + nextPixVal );
		prevPixVal = currPixVal;  currPixVal = nextPixVal;

		// Check the opacity value
		vec4 lutVal = (uMaskEnabled && isMasked(pos)) ? vec4(0.0) : texture(uLutSampler, vec2(pixVal, LUT_TX_YOFFSET)); 
		if (lutVal.a == 0.0)
		{
			// We have entered an empty-space region, so increase the stepsize
			stepSize = 2.0*uRayStepSize;
			rayStep = stepSize*rayDir;
		}
		else
		{
			if (stepSize > 1.5*uRayStepSize) {
				// Revert to normal-size steps, and back-up
				stepSize    = uRayStepSize;
				rayStep     = stepSize*rayDir;
				pos        -= rayStep;
				currPixVal  = getNormalizedPixVal(pos);
				prevPixVal  = getNormalizedPixVal(pos - rayStep);
				continue;
			}

			// Check whether we are near a border
			if (uSealBorders) {
				getBorderInfo(pos, rayDir, pos_s, borderThresh, gradDelta);
			}

			// Compute the intensity gradient
			vec3 gpos = pos + GradOffset;
			vec3 grad = vec3( 
				getNormalizedPixVal(gpos + gdx) - getNormalizedPixVal(gpos - gdx),
				getNormalizedPixVal(gpos + gdy) - getNormalizedPixVal(gpos - gdy),
				getNormalizedPixVal(gpos + gdz) - getNormalizedPixVal(gpos - gdz) );	

			// Modify the gradient near borders
			grad = mix(grad, BorderNormal, BorderNormalWeight);
			grad = mix(grad, prevGrad, 0.5);
			prevGrad = grad;
			float gradMag = length(grad);

			// Compute the lighting factors
			vec3 N = grad/gradMag;
			vec3 L0 = uLights[0].dir;
			vec3 L1 = uLights[1].dir;
			vec3 R0 = reflect(-1.0*L0, N); // Assumes that L0, L1 are normalized
			vec3 R1 = reflect(-1.0*L1, N);

			float diffuse0 = 2.0 * uLights[0].diffuse * max(0.0, dot(N,L0));
			float diffuse1 = 2.0 * uLights[1].diffuse * max(0.0, dot(N,L1));

			float sdot0 = max(0.0, dot(R0, rayDir));
			float sdot1 = max(0.0, dot(R1, rayDir));
			float specular0 = 2.0 * uLights[0].specStrength * pow(sdot0, uLights[0].specExp);
			float specular1 = 2.0 * uLights[1].specStrength * pow(sdot1, uLights[1].specExp);

			float dsFactor = float(gradMag > 0.001)*BorderReflectanceWt;
			float light0 = uAmbientLight*drel0 + (diffuse0 + specular0)*dsFactor; 
			float light1 = uAmbientLight*drel1 + (diffuse1 + specular1)*dsFactor; 

			// Maybe draw shadows
			#ifdef RENDER_SHADOWS
			if (sh0 > 0.0) { 
				float shadowWeight0 = ((prevShadowWeight0 < 0.0) || (tTot > 0.10)) ? calcShadowWeight(pos,0) : prevShadowWeight0;
				light0 *= max(0.0, 1.0-sh0*shadowWeight0);
				prevShadowWeight0 = shadowWeight0;
			}
			if (sh1 > 0.0) {
				float shadowWeight1 = ((prevShadowWeight1 < 0.0) || (tTot > 0.10)) ? calcShadowWeight(pos,1) : prevShadowWeight1;
				light1 *= max(0.0, 1.0-sh1*shadowWeight1); 
				prevShadowWeight1 = shadowWeight1;
			}
			#endif // RENDER_SHADOWS

			// Update the total color
			float light = light0 + light1;

			float t = pow(max(0.0, 1.0-lutVal.a), opacityExp);
			vec3 c = lutVal.rgb * (1.0 - t) * light;
			cTot += c*tTot;
			tTot *= t;
		}
			
		pos += rayStep;
	}
	
	cTot += uVrBackColor*tTot;
	outColor = vec4(cTot, 1.0);
	return true;
}



///////////////////////////////////////////////////////////////////////////////
//
// Computes the location of the most salient point along a ray.
//
///////////////////////////////////////////////////////////////////////////////
bool calcPickLocation(vec3 rayDir)
{
    if (!uPickMode) { return false; }

	float tol = 1.0; // NB: Units here are pixels, not fractional texture coordinates
	if ( (abs(gl_FragCoord.x - uPickPoint.x) > tol) ||  (abs(gl_FragCoord.y - uPickPoint.y) > tol) ) 
	{
		// Skip the computation if this is not the target fragment
		outColor = vec4(0.0, 0.0, 0.0, 0.0);
	}
	else
	{
		// Initializations
		VolAspect            = uVolShape/max(max(uVolShape.x, uVolShape.y), uVolShape.z);
		vec3 rayStep         = uRayStepSize * rayDir;
		float opacityExp     = uRayStepSize * 128.0;
		vec3 maxLoc          = vec3(-1.0);
		vec3 runStart        = vec3(-1.0);
		float bestDelta      = -1.0; 

		// Initialize the ray
		vec3 pos = vRayStartT;
		float tTot = 1.0;
		float tBase = -1.0;
		
		// Initialize slab variables
		#ifdef CLIP_TO_SLAB
		float slabOffset;
		initializeSlabInfo(rayDir, pos, slabOffset);
		if (slabOffset - 0.05 > 0.0) { pos += (slabOffset - 0.05)*rayDir; }
		#endif

		// Walk along the ray
		int NumSteps = int(4.0/uRayStepSize); // We'll break out of the loop before hitting NumSteps
		for (int i = 0; i < NumSteps; i++)
		{		
			// Honor any slab constraints
			#ifdef CLIP_TO_SLAB
			vec3 pos_s = (SlabXfrm * vec4(pos, 1.0)).xyz;
			if ( any(greaterThan(abs(pos_s), SlabRadii)) ) {
				pos += rayStep;
				continue;
			}
			#endif

			// Update the accumulated transparency
			float opac = (uMaskEnabled && isMasked(pos)) ? 0.0 : texture(uLutSampler, vec2(getNormalizedPixVal(pos), LUT_TX_YOFFSET)).a;
			float t = pow( max(0.0, 1.0-opac), opacityExp);
			tTot *= t;

			// Check whether the transparency is strictly decreasing
			if ( (t < 0.99) && (runStart.x < 0.0) )  
			{ 
				runStart = pos; // The voxel has some opacity, so we are starting a new run
				tBase = tTot;
			}

			vec3 nextPos = pos + rayStep;
			bool terminateRay = (tTot < TransparencySat) || any(lessThan(nextPos, BboxMin)) || any(greaterThan(nextPos, BboxMax));
			if ( (runStart.x >= 0.0) && ((t >= 0.99) || terminateRay) ) // We are ending a run
			{
				float delta = tBase - tTot; 
				float improved = float(delta > bestDelta);
				bestDelta = mix(bestDelta, delta, improved);
				maxLoc = mix(maxLoc, runStart, improved);
				runStart = vec3(-1.0); 	
				terminateRay = terminateRay || (bestDelta >= tTot);  			
			}
			if (terminateRay) { break; }		

			pos = nextPos;
		}
		
		// Encode the max location in the output color	
		outColor = encodeVec3(maxLoc);
	}
	return true;
}



///////////////////////////////////////////////////////////////////////////////
//
// Gets the pixel value at a given volume point, normalized to the
//   range [0,1].
//
///////////////////////////////////////////////////////////////////////////////
float getNormalizedPixVal(vec3 pos)
{
	// Sample the volume
	vec4 samp = texture(uVolumeSampler, pos);

	// Combine color channels to decode the pixel value
	bool inBounds = all(lessThanEqual(pos,Ones)) && all(greaterThanEqual(pos,Zeros));
	float pixVal = dot(samp.rg, PixConvert) * float(inBounds);	

	// Normalize
	return clamp(pixVal*PixScale - PixOffset, 0.0, 1.0);	
}


#ifdef CLIP_TO_SLAB
///////////////////////////////////////////////////////////////////////////////
//
// Initializes slab-related variables.
//
///////////////////////////////////////////////////////////////////////////////
void initializeSlabInfo(vec3 rayDir, vec3 rayStart, out float slabOffset)
{
	// Get the corner points in volume coordinates
	vec3 p0 = vec3(uSlabInfo[0],  uSlabInfo[1],  uSlabInfo[2] );
	vec3 p1 = vec3(uSlabInfo[3],  uSlabInfo[4],  uSlabInfo[5] );
	vec3 p2 = vec3(uSlabInfo[6],  uSlabInfo[7],  uSlabInfo[8] );
	vec3 p3 = vec3(uSlabInfo[9],  uSlabInfo[10], uSlabInfo[11]);
	vec3 p4 = vec3(uSlabInfo[12], uSlabInfo[13], uSlabInfo[14]);
	vec3 p5 = vec3(uSlabInfo[15], uSlabInfo[16], uSlabInfo[17]);
	vec3 p6 = vec3(uSlabInfo[18], uSlabInfo[19], uSlabInfo[20]);
	vec3 p7 = vec3(uSlabInfo[21], uSlabInfo[22], uSlabInfo[23]);

	slabOffset = min( 
		min( min(dot(rayDir, p0), dot(rayDir, p1)), min(dot(rayDir, p2), dot(rayDir, p3)) ),
		min( min(dot(rayDir, p4), dot(rayDir, p5)), min(dot(rayDir, p6), dot(rayDir, p7)) ) 
	);
	slabOffset -= dot(rayStart, rayDir);

	// Get the slab axes and center
	p0 *= VolAspect;
	p1 *= VolAspect;
	p2 *= VolAspect;
	p4 *= VolAspect;
	p7 *= VolAspect;
	SlabAxes[0] = normalize(p1 - p0);
	SlabAxes[1] = normalize(p2 - p0);
	SlabAxes[2] = normalize(p4 - p0);
	vec3 slabCtr = (p0 + p7) / 2.0;

	SlabRadii = vec3(length(p1-p0)/2.0, length(p2-p0)/2.0, length(p4-p0)/2.0);

	// Construct the transformation matrix from texture coordinates to slab coordinates
	SlabXfrm = mat4(
		VolAspect.x*SlabAxes[0].x,  VolAspect.x*SlabAxes[1].x,  VolAspect.x*SlabAxes[2].x,  0.0,
		VolAspect.y*SlabAxes[0].y,  VolAspect.y*SlabAxes[1].y,  VolAspect.y*SlabAxes[2].y,  0.0,
		VolAspect.z*SlabAxes[0].z,  VolAspect.z*SlabAxes[1].z,  VolAspect.z*SlabAxes[2].z,  0.0,
       -dot(slabCtr, SlabAxes[0]), -dot(slabCtr, SlabAxes[1]), -dot(slabCtr, SlabAxes[2]),  1.0
	);
}
#endif


///////////////////////////////////////////////////////////////////////////////
//
// Gets the distance to the nearest border, and the normal vector of
//   that border.
//
///////////////////////////////////////////////////////////////////////////////
void getBorderInfo(vec3 pos, vec3 rayDir, vec3 pos_s, float borderThresh, vec3 gradDelta)
{
	// Check the volume borders
	float minDist = borderThresh + 1.0;
	bool isSlabBorder = false;
	
	for (int i=0; i<3; i++)
	{
		float p = abs(pos[i]);
		if (p < minDist) { minDist = p;  BorderNormal = UnitVectors[i]; }	

		p = abs(1.0 - pos[i]);
		if (p < minDist) { minDist = p;  BorderNormal = -1.0*UnitVectors[i]; }	

        #ifdef CLIP_TO_SLAB	
		p = abs( SlabRadii[i] + pos_s[i] );
		if ( p < minDist ) { minDist = p;  BorderNormal = SlabAxes[i];  isSlabBorder = true; }

		p = abs( SlabRadii[i] - pos_s[i] );
		if ( p < minDist ) { minDist = p;  BorderNormal = -1.0*SlabAxes[i]; isSlabBorder = true; }	
        #endif							
	}	

	bool doBorderMod    = (minDist < borderThresh);
	float cosFactor     = max( 0.0, dot(normalize(BorderNormal),rayDir) );
	BorderNormalWeight  = doBorderMod ? (1.0 - minDist/borderThresh)*pow(cosFactor,0.25) : 0.0;
	BorderReflectanceWt = doBorderMod ? 1.0 - 0.75*pow(cosFactor,4.0) : 1.0;
	GradOffset          = (doBorderMod && !isSlabBorder ) ? BorderNormal*gradDelta : Zeros;
}


#ifdef RENDER_SHADOWS
///////////////////////////////////////////////////////////////////////////////
//
// Implements percentage-closer filtering for soft shadow edges.
//
///////////////////////////////////////////////////////////////////////////////
float calcShadowWeight(vec3 pos, int lightIndex)
{
	// Initialize constants
	float step = uLights[lightIndex].shadowSoftness * 0.0054;
	float dx = step / max(1.0, uOutBufferSize.x/uOutBufferSize.y);
	float dy = step / max(1.0, uOutBufferSize.y/uOutBufferSize.x);

	// Get the shadow-map coordinates of the input point
	vec4 pt = 0.5*(uLights[lightIndex].shadowMvp * vec4(pos-0.5, 1.0) + 1.0);

	// Apply a random offset to reduce banding artifacts
	float px0 = pt.x + dx * 0.8*(rand(pos.xz) - 0.5); 
	float py0 = pt.y + dy * 0.8*(rand(pos.yz) - 0.5);
		
	// Apply a small z-offset to prevent self-shadowing	
	float pzd = pt.z - 1.0/uVolShape[0]; 

	// Tabulate sampling points
	float pxp1 = px0  + dx;
	float pxm1 = px0  - dx;
	float pxp2 = pxp1 + dx;
	float pxm2 = pxm1 - dx;
	float pxp3 = pxp2 + dx;
	float pxm3 = pxm2 - dx;
	float pxp4 = pxp3 + dx;
	float pxm4 = pxm3 - dx;

	float pyp1 = py0  + dy;
	float pym1 = py0  - dy;
	float pyp2 = pyp1 + dy;
	float pym2 = pym1 - dy;
	float pyp3 = pyp2 + dy;
	float pym3 = pym2 - dy;
	float pyp4 = pyp3 + dy;
	float pym4 = pym3 - dy;

	float fL = float(lightIndex);
	py0  = 0.5*(py0 + fL);
	pyp1 = 0.5*(pyp1 + fL);
	pym1 = 0.5*(pym1 + fL);
	pyp2 = 0.5*(pyp2 + fL);
	pym2 = 0.5*(pym2 + fL);
	pyp3 = 0.5*(pyp3 + fL);
	pym3 = 0.5*(pym3 + fL);
	pyp4 = 0.5*(pyp4 + fL);
	pym4 = 0.5*(pym4 + fL);
	 
	// Unrolled loop for better performance:
	vec4 smTexVal = texture(uShadowSampler, vec2(px0, py0));
	float smDepth = dot(smTexVal.rg, ToFloat16);
	float wt = float(pzd > smDepth);

	wt += float(pzd > dot( texture(uShadowSampler, vec2(pxm1, pym4)).rg, ToFloat16 ));
	wt += float(pzd > dot( texture(uShadowSampler, vec2(px0,  pym4)).rg, ToFloat16 ));
	wt += float(pzd > dot( texture(uShadowSampler, vec2(pxp1, pym4)).rg, ToFloat16 ));

	wt += float(pzd > dot( texture(uShadowSampler, vec2(pxm3, pym3)).rg, ToFloat16 ));
	wt += float(pzd > dot( texture(uShadowSampler, vec2(pxm2, pym3)).rg, ToFloat16 ));
	wt += float(pzd > dot( texture(uShadowSampler, vec2(pxm1, pym3)).rg, ToFloat16 ));
	wt += float(pzd > dot( texture(uShadowSampler, vec2(px0,  pym3)).rg, ToFloat16 ));
	wt += float(pzd > dot( texture(uShadowSampler, vec2(pxp1, pym3)).rg, ToFloat16 ));
	wt += float(pzd > dot( texture(uShadowSampler, vec2(pxp2, pym3)).rg, ToFloat16 ));
	wt += float(pzd > dot( texture(uShadowSampler, vec2(pxp3, pym3)).rg, ToFloat16 ));

	wt += float(pzd > dot( texture(uShadowSampler, vec2(pxm3, pym2)).rg, ToFloat16 ));
	wt += float(pzd > dot( texture(uShadowSampler, vec2(pxm2, pym2)).rg, ToFloat16 ));
	wt += float(pzd > dot( texture(uShadowSampler, vec2(pxm1, pym2)).rg, ToFloat16 ));
	wt += float(pzd > dot( texture(uShadowSampler, vec2(px0,  pym2)).rg, ToFloat16 ));
	wt += float(pzd > dot( texture(uShadowSampler, vec2(pxp1, pym2)).rg, ToFloat16 ));
	wt += float(pzd > dot( texture(uShadowSampler, vec2(pxp2, pym2)).rg, ToFloat16 ));
	wt += float(pzd > dot( texture(uShadowSampler, vec2(pxp3, pym2)).rg, ToFloat16 ));	

	wt += float(pzd > dot( texture(uShadowSampler, vec2(pxm4, pym1)).rg, ToFloat16 ));
	wt += float(pzd > dot( texture(uShadowSampler, vec2(pxm3, pym1)).rg, ToFloat16 ));
	wt += float(pzd > dot( texture(uShadowSampler, vec2(pxm2, pym1)).rg, ToFloat16 ));
	wt += float(pzd > dot( texture(uShadowSampler, vec2(pxm1, pym1)).rg, ToFloat16 ));
	wt += float(pzd > dot( texture(uShadowSampler, vec2(px0,  pym1)).rg, ToFloat16 ));
	wt += float(pzd > dot( texture(uShadowSampler, vec2(pxp1, pym1)).rg, ToFloat16 ));
	wt += float(pzd > dot( texture(uShadowSampler, vec2(pxp2, pym1)).rg, ToFloat16 ));
	wt += float(pzd > dot( texture(uShadowSampler, vec2(pxp3, pym1)).rg, ToFloat16 ));
	wt += float(pzd > dot( texture(uShadowSampler, vec2(pxp4, pym1)).rg, ToFloat16 ));
	
	wt += float(pzd > dot( texture(uShadowSampler, vec2(pxm4, py0)).rg, ToFloat16 ));
	wt += float(pzd > dot( texture(uShadowSampler, vec2(pxm3, py0)).rg, ToFloat16 ));
	wt += float(pzd > dot( texture(uShadowSampler, vec2(pxm2, py0)).rg, ToFloat16 ));
	wt += float(pzd > dot( texture(uShadowSampler, vec2(pxm1, py0)).rg, ToFloat16 ));
	//-------------------------------------------------------------------------------
	wt += float(pzd > dot( texture(uShadowSampler, vec2(pxp1, py0)).rg, ToFloat16 ));
	wt += float(pzd > dot( texture(uShadowSampler, vec2(pxp2, py0)).rg, ToFloat16 ));
	wt += float(pzd > dot( texture(uShadowSampler, vec2(pxp3, py0)).rg, ToFloat16 ));
	wt += float(pzd > dot( texture(uShadowSampler, vec2(pxp4, py0)).rg, ToFloat16 ));

	wt += float(pzd > dot( texture(uShadowSampler, vec2(pxm4, pyp1)).rg, ToFloat16 ));
	wt += float(pzd > dot( texture(uShadowSampler, vec2(pxm3, pyp1)).rg, ToFloat16 ));
	wt += float(pzd > dot( texture(uShadowSampler, vec2(pxm2, pyp1)).rg, ToFloat16 ));
	wt += float(pzd > dot( texture(uShadowSampler, vec2(pxm1, pyp1)).rg, ToFloat16 ));
	wt += float(pzd > dot( texture(uShadowSampler, vec2(px0,  pyp1)).rg, ToFloat16 ));
	wt += float(pzd > dot( texture(uShadowSampler, vec2(pxp1, pyp1)).rg, ToFloat16 ));
	wt += float(pzd > dot( texture(uShadowSampler, vec2(pxp2, pyp1)).rg, ToFloat16 ));
	wt += float(pzd > dot( texture(uShadowSampler, vec2(pxp3, pyp1)).rg, ToFloat16 ));
	wt += float(pzd > dot( texture(uShadowSampler, vec2(pxp4, pyp1)).rg, ToFloat16 ));

	wt += float(pzd > dot( texture(uShadowSampler, vec2(pxm3, pyp2)).rg, ToFloat16 ));
	wt += float(pzd > dot( texture(uShadowSampler, vec2(pxm2, pyp2)).rg, ToFloat16 ));
	wt += float(pzd > dot( texture(uShadowSampler, vec2(pxm1, pyp2)).rg, ToFloat16 ));
	wt += float(pzd > dot( texture(uShadowSampler, vec2(px0,  pyp2)).rg, ToFloat16 ));
	wt += float(pzd > dot( texture(uShadowSampler, vec2(pxp1, pyp2)).rg, ToFloat16 ));
	wt += float(pzd > dot( texture(uShadowSampler, vec2(pxp2, pyp2)).rg, ToFloat16 ));
	wt += float(pzd > dot( texture(uShadowSampler, vec2(pxp3, pyp2)).rg, ToFloat16 ));

	wt += float(pzd > dot( texture(uShadowSampler, vec2(pxm3, pyp3)).rg, ToFloat16 ));
	wt += float(pzd > dot( texture(uShadowSampler, vec2(pxm2, pyp3)).rg, ToFloat16 ));
	wt += float(pzd > dot( texture(uShadowSampler, vec2(pxm1, pyp3)).rg, ToFloat16 ));
	wt += float(pzd > dot( texture(uShadowSampler, vec2(px0,  pyp3)).rg, ToFloat16 ));
	wt += float(pzd > dot( texture(uShadowSampler, vec2(pxp1, pyp3)).rg, ToFloat16 ));
	wt += float(pzd > dot( texture(uShadowSampler, vec2(pxp2, pyp3)).rg, ToFloat16 ));
	wt += float(pzd > dot( texture(uShadowSampler, vec2(pxp3, pyp3)).rg, ToFloat16 ));

	wt += float(pzd > dot( texture(uShadowSampler, vec2(pxm1, pyp4)).rg, ToFloat16 ));
	wt += float(pzd > dot( texture(uShadowSampler, vec2(px0,  pyp4)).rg, ToFloat16 ));
	wt += float(pzd > dot( texture(uShadowSampler, vec2(pxp1, pyp4)).rg, ToFloat16 ));

	return wt/61.0;		
}
#endif

///////////////////////////////////////////////////////////////////////////////
//
// Gets a random number given a 2-component seed.
//
///////////////////////////////////////////////////////////////////////////////
float rand(vec2 xy)
{
    return fract(sin(dot(xy ,vec2(12.9898,78.233))) * 43758.5453);
}


///////////////////////////////////////////////////////////////////////////////
//
// Encodes the components of a vec3 in an rgba color.
//
///////////////////////////////////////////////////////////////////////////////
vec4 encodeVec3(vec3 loc)
{
	if ( any(lessThan(loc,Zeros)) || any(greaterThan(loc,Ones)) ) 
	{
		// We indicate an invalid value by setting the rightmost bit
		return vec4(0.0, 0.0, 0.0, 1.0);
	}	

	// Use 10 bits for each coordinate
	int xi = min(1023, int(loc.x*1023.0 + 0.5));
	int yi = min(1023, int(loc.y*1023.0 + 0.5));
	int zi = min(1023, int(loc.z*1023.0 + 0.5));

	int zLo = zi - (zi/128) * 128;
	int zHi = (zi - zLo)/128;

	int yLo = yi - (yi/32) * 32;
	int yHi = (yi - yLo)/32;

	int xLo = xi - (xi/8) * 8;
	int xHi = (xi - xLo)/8;

	float a = float(zLo*2)/255.0;
	float b = float(zHi + 8*yLo)/255.0;
	float g = float(yHi + 32*xLo)/255.0;
	float r = float(xHi)/255.0;

	return vec4(r, g, b, a);
}
	

///////////////////////////////////////////////////////////////////////////////
//
// Determines whether a given volume point is masked.
//
///////////////////////////////////////////////////////////////////////////////
bool isMasked(vec3 pos)
{
	vec2 ToFloat16le = vec2(1.0, 256.0)/257.0;
	vec4 maskSamp = texture(uMaskSampler, pos.xy);
	return (pos.z < dot(maskSamp.rg, ToFloat16le)) || (1.0 - pos.z < dot(maskSamp.ba, ToFloat16le));
}
`;


})( window.BigLime = window.BigLime || {} );







/////////////////////////////////////////////////////////////////////////
//
// ShaderCode.2.WinLevel.js
//
// This file contains the WebGL2 shader code for window-leveling. 
//
/////////////////////////////////////////////////////////////////////////
;(function(Namespace, undefined) {
    "use strict";
	Namespace.ShaderCode = Namespace.ShaderCode || {};



/////////////////////////////////////////////////////////////////////////
//
// Vertex shader.
//
/////////////////////////////////////////////////////////////////////////
Namespace.ShaderCode.winLevel_vert_2 = 
`#version 300 es
// winLevel_vert_2

//<<SYMBOL_DEFS>>//

precision highp float;
precision highp int;

uniform float uWinWidth;
uniform float uWinLevel;
in vec4       aPosition;
out float     vPixScale;
out float     vPixOffset;
out vec2      vTexCoord;


///////////////////////////////////////////////////////////////////////////////
//
// Program entry point.
//
///////////////////////////////////////////////////////////////////////////////
void main()
{
    // Convert from clip space to texture coordinates
    vTexCoord = (aPosition.xy + 1.0)*0.5;

    // Compute the scale and offset factor for the window/level transform
    float level = uWinLevel*(257.0/65535.0);
    float width = uWinWidth*(257.0/65535.0);
	vPixScale = 1.0/(width + 0.001);
	vPixOffset = level - width/2.0;

    gl_Position = aPosition;    
}
`;




/////////////////////////////////////////////////////////////////////////
//
// Fragment shader.
//
/////////////////////////////////////////////////////////////////////////
Namespace.ShaderCode.winLevel_frag_2 = 
`#version 300 es
// winLevel_frag_2

//<<SYMBOL_DEFS>>//

precision highp float;
precision highp int;

uniform sampler2D uWLSampler;
uniform sampler2D uLutSampler;
uniform int       uPassThruMode;
uniform int       uColorMapIndex;
uniform vec4      uMarkerColor;
in float          vPixScale;
in float          vPixOffset;
in vec2           vTexCoord;
out vec4          outColor;

void main()
{
	// Read the output from the renderer
	vec4 textureVal = texture(uWLSampler, vTexCoord);

	if (uPassThruMode > 0) 
	{
		// Pass-thru mode means we don't modify the pixels
		outColor = textureVal;
	}
	else
	{
		if (textureVal.b != 0.0) 
		{
            // Just render the marker
			outColor = vec4( ((textureVal.b+2.0)/3.0) * uMarkerColor.rgb, uMarkerColor.a );
	    }
		else
		{
		    // Get the raw pixel value
			float rawPixVal = textureVal.r + 256.0*textureVal.g;
			if (rawPixVal == 0.0) 
			{
			    // We're in the background
				outColor = vec4(0.0, 0.0, 0.0, 1.0); 
			} 
			else 
			{
			    // Apply the window/level transform 
				float wlPixVal = clamp( vPixScale*(rawPixVal - vPixOffset), 0.0, 1.0 );
				if (uColorMapIndex == 0) {	
					outColor = vec4(wlPixVal, wlPixVal, wlPixVal, 1.0);
				}
				else {
				    // Apply the lookup table
					outColor = texture(uLutSampler, vec2(LUT_TX_XSCALE*wlPixVal, LUT_TX_YOFFSET + float(uColorMapIndex)*LUT_TX_YSCALE));
				}
			}
		}




		// Recombine the R and G color channels into a 16-bit pixel value
		float rawPixVal = textureVal.r + 256.0*textureVal.g;

		if (textureVal.b == 0.0) {
		    // Apply the window/level transform
			if (uColorMapIndex == 0) {
				float wlPixVal = (rawPixVal == 0.0) ? 0.0 : clamp( vPixScale*(rawPixVal - vPixOffset), 0.0, 1.0 );
				outColor = vec4(wlPixVal, wlPixVal, wlPixVal, 1.0);
			}
			else {
				float wlPixVal = (rawPixVal == 0.0) ? 0.0 : clamp( vPixScale*(rawPixVal - vPixOffset), 0.0, 1.0 );
				outColor = texture(uLutSampler, vec2(LUT_TX_XSCALE*wlPixVal, LUT_TX_YOFFSET + float(uColorMapIndex)*LUT_TX_YSCALE));
			}
		}
		else {
			// Render the marker
			outColor = vec4( ((textureVal.b+2.0)/3.0) * uMarkerColor.rgb, uMarkerColor.a );
		}
	}
}
`;


})( window.BigLime = window.BigLime || {} );







/**
 * This file contains the shader code for x-ray rendering in WebGL 2.
 * 
 */
;(function(Namespace, undefined) {
	"use strict";
	Namespace.ShaderCode = Namespace.ShaderCode || {};


/**
 * Vertex shader.
 * 
 */
Namespace.ShaderCode.xray_vert_2 =
`#version 300 es
// xray_vert_2

//<<SYMBOL_DEFS>>//

precision highp float; // We need highp to accurately specify locations in large textures
precision highp int;

uniform mat4  uMvpTransform;
uniform mat4  uMvpInvTransform;
uniform float uPersp;
in vec4       aPosition;
out vec3      vRayStartT;
out vec3      vRayDirT;



///////////////////////////////////////////////////////////////////////////////
//
// Program entry point.
//
///////////////////////////////////////////////////////////////////////////////
void main()
{
    // Transform the input vertex from world-space to clip-space. (Setting the w-component implements perspective.)
    gl_Position = uMvpTransform * aPosition;
    float w = gl_Position.w = 1.0 + uPersp*(gl_Position.z + 1.0); 

	// Pass the ray's starting point and direction to the fragment shader (in texture coordinates).
	// Note that scaling of vRayDirT by w is necessary for perspective-correct interpolation.
	vRayStartT = aPosition.xyz + 0.5;
	vRayDirT = w * (uMvpInvTransform * vec4(gl_Position.xy*(uPersp/w), 1.0, 0.0)).xyz;
}
`;




/**
 * Fragment shader.
 * 
 */
Namespace.ShaderCode.xray_frag_2 = 
`#version 300 es
// xray_frag_2

//<<SYMBOL_DEFS>>//

precision highp float; // We need highp to accurately specify locations in large textures
precision highp int;
precision highp sampler3D;

// Uniforms and varyings
uniform sampler3D  uVolumeSampler;
uniform sampler2D  uMaskSampler;
uniform sampler2D  uLutSampler;
uniform bool   uUseLut;
uniform bool   uMaskEnabled;
uniform float  uOpacityRange[2];
uniform int    uBitsPerPixel;
uniform float  uRayStepSize;
uniform vec3   uVolShape;
uniform float  uSlabInfo[24];
in  vec3 vRayStartT;
in  vec3 vRayDirT;
out vec4 outColor;

// Constants
const float BBoxTol = 0.002; 
const vec3 BboxMin  = vec3(-BBoxTol);
const vec3 BboxMax  = vec3(1.0 + BBoxTol);
const vec3 Zeros    = vec3(0.0);
const vec3 Ones     = vec3(1.0);

// Globals
vec2 PixConvert;
float PixScale, PixOffset;
vec3 VolAspect;
#ifdef CLIP_TO_SLAB
vec3 SlabRadii;
mat4 SlabXfrm;
#endif

// Function prototypes
void calcXrayValue(vec3);
bool isMasked(vec3);
#ifdef CLIP_TO_SLAB
void  initializeSlabInfo(vec3, vec3, out float);
#endif


///////////////////////////////////////////////////////////////////////////////
//
// Program entry point.
//
///////////////////////////////////////////////////////////////////////////////
void main()
{
	// Initialize globals
	PixConvert = vec2(1.0, 256.0*float(uBitsPerPixel > 8));
	PixScale   = 255.0 * uOpacityRange[1];
	PixOffset  = uOpacityRange[0] * uOpacityRange[1];
		
    // Perform ray casting
	vec3 rayDir = normalize(vRayDirT);	
    calcXrayValue(rayDir);
}


///////////////////////////////////////////////////////////////////////////////
//
// Computes the attenuated x-ray value along a ray.
//
///////////////////////////////////////////////////////////////////////////////
void calcXrayValue(vec3 rayDir)
{
	VolAspect = uVolShape/max(max(uVolShape.x, uVolShape.y), uVolShape.z);

	// Initialize the ray
	vec3 pos = vRayStartT;
	vec3 rayStep = rayDir*uRayStepSize;
	bool enteredSlab = false;

	// Initialize slab variables
	#ifdef CLIP_TO_SLAB
	float slabOffset;
	initializeSlabInfo(rayDir, pos, slabOffset);
	if (slabOffset - 0.05 > 0.0) { pos += (slabOffset - 0.05)*rayDir; }
	#endif	

	// Walk along the ray
	float totalAtten = 0.0;
	int NumSteps = int(sqrt(3.0)/uRayStepSize + 0.5);
	for (int i = 0; i < NumSteps; i++)
	{		
		// Check whether the ray has exited the volume
		if ( any(lessThan(pos,BboxMin)) || any(greaterThan(pos,BboxMax)) ) { break; }		

		// Honor any slab constraints
		#ifdef CLIP_TO_SLAB
		vec3 pos_s = (SlabXfrm * vec4(pos, 1.0)).xyz;
		if ( any(greaterThan(abs(pos_s), SlabRadii)) ) {
			if ( enteredSlab ) { break; }
			pos += rayStep;
			continue;
		}
		enteredSlab = true;
		#endif
		
		// Add the current pixel value to the total
		if (!uMaskEnabled || !isMasked(pos)) {
			vec4 samp = texture(uVolumeSampler, pos);
			float pixVal = dot(samp.rg, PixConvert);	
			if (uUseLut) {
				float lutArg = clamp(PixScale*pixVal - PixOffset, 0.0, 1.0);	
				pixVal = 257.0 * texture(uLutSampler, vec2(lutArg, LUT_TX_YOFFSET)).a; 
			}
			totalAtten = min(255.0, totalAtten + uRayStepSize*pixVal );	
		}

		pos += rayStep;
	}

	// Encode the 16-bit pixel value in two 8-bit color channels	
	totalAtten *= 255.0;
	totalAtten = max(totalAtten, 1.0); // Do't allow zero, as we use zero to indicate background
	float highByte = floor(totalAtten/256.0);
	float lowByte = totalAtten - 256.0*highByte;
	outColor = vec4(lowByte/255.0, highByte/255.0, 0.0, 1.0);
}


#ifdef CLIP_TO_SLAB
///////////////////////////////////////////////////////////////////////////////
//
// Initializes slab-related variables.
//
///////////////////////////////////////////////////////////////////////////////
void initializeSlabInfo(vec3 rayDir, vec3 rayStart, out float slabOffset)
{
	// Get the corner points in volume coordinates
	vec3 p0 = vec3(uSlabInfo[0],  uSlabInfo[1],  uSlabInfo[2] );
	vec3 p1 = vec3(uSlabInfo[3],  uSlabInfo[4],  uSlabInfo[5] );
	vec3 p2 = vec3(uSlabInfo[6],  uSlabInfo[7],  uSlabInfo[8] );
	vec3 p3 = vec3(uSlabInfo[9],  uSlabInfo[10], uSlabInfo[11]);
	vec3 p4 = vec3(uSlabInfo[12], uSlabInfo[13], uSlabInfo[14]);
	vec3 p5 = vec3(uSlabInfo[15], uSlabInfo[16], uSlabInfo[17]);
	vec3 p6 = vec3(uSlabInfo[18], uSlabInfo[19], uSlabInfo[20]);
	vec3 p7 = vec3(uSlabInfo[21], uSlabInfo[22], uSlabInfo[23]);

	slabOffset = min( 
		min( min(dot(rayDir, p0), dot(rayDir, p1)), min(dot(rayDir, p2), dot(rayDir, p3)) ),
		min( min(dot(rayDir, p4), dot(rayDir, p5)), min(dot(rayDir, p6), dot(rayDir, p7)) ) 
	);
	slabOffset -= dot(rayStart, rayDir);

	// Get the slab axes and center
	p0 *= VolAspect;
	p1 *= VolAspect;
	p2 *= VolAspect;
	p4 *= VolAspect;
	p7 *= VolAspect;
	vec3 slabAxis0 = normalize(p1 - p0);
	vec3 slabAxis1 = normalize(p2 - p0);
	vec3 slabAxis2 = normalize(p4 - p0);
	vec3 slabCtr = (p0 + p7) / 2.0;

	SlabRadii = vec3(length(p1-p0)/2.0, length(p2-p0)/2.0, length(p4-p0)/2.0);

	// Construct the transformation matrix from texture coordinates to slab coordinates
	SlabXfrm = mat4(
		VolAspect.x*slabAxis0.x,  VolAspect.x*slabAxis1.x,  VolAspect.x*slabAxis2.x,  0.0,
		VolAspect.y*slabAxis0.y,  VolAspect.y*slabAxis1.y,  VolAspect.y*slabAxis2.y,  0.0,
		VolAspect.z*slabAxis0.z,  VolAspect.z*slabAxis1.z,  VolAspect.z*slabAxis2.z,  0.0,
       -dot(slabCtr, slabAxis0), -dot(slabCtr, slabAxis1), -dot(slabCtr, slabAxis2),  1.0
	);
}
#endif


///////////////////////////////////////////////////////////////////////////////
//
// Determines whether a given volume point is masked.
//
///////////////////////////////////////////////////////////////////////////////
bool isMasked(vec3 pos)
{
	vec2 ToFloat16le = vec2(1.0, 256.0)/257.0;
	vec4 maskSamp = texture(uMaskSampler, pos.xy);
	return (pos.z < dot(maskSamp.rg, ToFloat16le)) || (1.0 - pos.z < dot(maskSamp.ba, ToFloat16le));
}
`;

})( window.BigLime = window.BigLime || {} );







