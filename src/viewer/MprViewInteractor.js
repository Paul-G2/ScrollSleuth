/**
 * @classdesc
 * This class implements an interactor for adjusting the pan, zoom,
 * and window-width-and-level in an MPR viewport.
 * 
 */
class MprViewInteractor extends BigLime.Interactor
{ 
    /**
 	 * @constructor
   	 * @param {HTMLElement} eventSrc - The html element from which to get mouse events.
     * 
     */
    constructor(mprViewer) 
	{ 
		// Inherit from Interactor	
		const wlEventTypes = {btns:0, shift:false, ctrl:false, alt:true};
		const panEventTypes = {btns:0, shift:false, ctrl:false, alt:false};
		const zoomEventTypes = {btns:0, shift:true, ctrl:false, alt:false};
		super(mprViewer.canvas, 'mpr', [].concat(...[wlEventTypes, panEventTypes, zoomEventTypes]));

		// Initialize data members
		this.mprViewer = mprViewer;
		this.segViewer = mprViewer.owner;

		this.wlEventTypes = [wlEventTypes];
		this.panEventTypes = [panEventTypes];
		this.zoomEventTypes = [zoomEventTypes];
		
		this.wlEnabled = true;
		this.panEnabled = true;
		this.zoomEnabled = true;
		
		this.winWidth = 1.0; 
		this.winLevel = 1.0; 
		this.wlRateOfChange = 1.0;
		this.currentZoom = [1,1];
		this.currentPan = [0,0];	
	}


	/**
	 * Sets the initial values at the start of interaction.
	 * Clients should call this in their 'start' event handler.
	 * 
	 * @param {Object} vals - The values to set.
	 * 
	 */
	setInitialValues(vals={})
	{
		if (vals.wwl) {
			this.winWidth = vals.wwl.width;
			this.winLevel = vals.wwl.level;
			this.wlRateOfChange = Math.max(1, vals.wwl.levelRange)/1024;
		}
		if (vals.pan) {
			glMatrix.vec2.copy(this.currentPan, vals.pan);
		}
		if (vals.zoom) {
			glMatrix.vec2.copy(this.currentZoom, vals.zoom);
		}
	}


	/**
	 * Handler for start events.
	 * @private
	 * 
	 * @param {Event} event - Event info.
	 * 
	 */
	_onStart(event)
	{
		const Matches = BigLime.Interactor.MouseEventMatches;
        const engine = this.segViewer.renderEngine;
        const rp = this.mprViewer.renderParams;

		this.interactMode = 'none';
		if (this.wlEnabled && Matches(event, this.wlEventTypes)) 
		{ 
			this.interactMode = 'winlevel';
			this.setInitialValues( {wwl: {width:rp.winWidth, level:rp.winLevel, levelRange:engine.volume.getAutoWinLevel()[0]}} );
		}
		else if (this.panEnabled && Matches(event, this.panEventTypes)) 
		{ 
			this.interactMode = 'pan';
			this.setInitialValues({pan: rp.pan, zoom: rp.zoom});
		}
		else if (this.zoomEnabled && Matches(event, this.zoomEventTypes)) 
		{ 
			this.interactMode = 'zoom';
			this.setInitialValues({zoom: rp.zoom});
		}
		
		if (this.interactMode != 'none') {
			event.stopImmediatePropagation(); // Don't send the event to anyone else
			engine.animate(15, this.segViewer.renderMprs.bind(this.segViewer));
		}
	}


	/**
	 * Handler for move events.
	 * @private
	 * 
	 * @param {Event} event - Event info.
	 * 
	 */
	_onMove(event)
	{
		if (this.interactMode == 'none') { return; }

        const thisRp = this.mprViewer.renderParams;
		const otherRp = (this.mprViewer.id == 'top') ? this.segViewer.sideViewer.renderParams : this.segViewer.topViewer.renderParams;

		let idx, sign;
		switch (this.interactMode) 
		{
			case 'winlevel':
				this.winLevel += this.wlRateOfChange * this.deltaPrev[1];
				this.winWidth -= this.wlRateOfChange * this.deltaPrev[0];
				this.winWidth = Math.max(this.winWidth, 0.0001);
				thisRp.winWidth = otherRp.winWidth = this.winWidth;
                thisRp.winLevel = otherRp.winLevel = this.winLevel;
				break;

			case 'pan':
				const srcRect = this.eventSources[0].getBoundingClientRect();
				const panScale = 2.0/Math.min(srcRect.width, srcRect.height);
				idx = (this.mprViewer.id == 'top') ? 0 : 1;
				sign = 2*(idx - 0.5);
				this.currentPan[idx] += sign * panScale * this.deltaPrev[idx]/this.currentZoom[idx];
				glMatrix.vec2.copy(thisRp.pan, this.currentPan);	
				break;

			case 'zoom':
				idx = (this.mprViewer.id == 'top') ? 0 : 1;
				sign = 2*(idx - 0.5);
				this.currentZoom[idx] *= Math.pow(1.01, -sign*this.deltaPrev[idx]);	
				this.currentZoom[idx] = Math.min(100, Math.max(0.1, this.currentZoom[idx]));
				glMatrix.vec2.copy(thisRp.zoom, this.currentZoom);
				break;

			default:
				break;
		}
	}


	/**
	 * Handler for end events.
	 * @private
	 * 
	 * @param {Event} event - Event info.
	 * 
	 */
	_onEnd(event)
	{
		if (this.interactMode == 'none') return;

		this.segViewer.renderEngine.stopAnimation();
		BigLime.Utils.requestAnimFrame( this.segViewer.renderMprs.bind(this.segViewer) ); 
		this.interactMode = 'none';
	}
	
}