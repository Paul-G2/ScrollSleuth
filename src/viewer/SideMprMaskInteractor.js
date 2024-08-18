/**
 * @classdesc
 * This class implements an interactor for editing the relief mask.
 * the side MPR viewport.
 * 
 */
class SideMprMaskInteractor extends BigLime.Interactor
{ 
    /**
 	 * @constructor
   	 * @param {MprViewer} mprViewer - Am MprViewer instance.
     * 
     */
    constructor(mprViewer, eventTypes) 
	{ 
		// Inherit from Interactor	
		eventTypes = eventTypes || {btns:0, shift:false, ctrl:false, alt:false};	
		super(mprViewer.canvas, 'sideMprMask', eventTypes);

		// Initialize data members
		this.eventTypes = Array.isArray(eventTypes) ? eventTypes : [eventTypes];
		this.mprViewer = mprViewer;
		this.segViewer = mprViewer.owner;
		this.enabled = true;
		this.interactMode = 'none';	
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
		if (this.interactMode != 'none') { return; }

		if (this.enabled && BigLime.Interactor.MouseEventMatches(event, this.eventTypes)) 
		{
			let hit_type;
			[hit_type, this.acivePtLocX, this.initialPtVp, this.activeRidge] = this._hitTest(this.currPoint);
			this.interactMode = (hit_type === 'hit_top') ? 'move_top' : (hit_type === 'hit_btm') ? 'move_btm' : 'none';
			if (this.interactMode !== 'none') 
			{
				this.segViewer.renderEngine.animate(15, this.segViewer.renderAll.bind(this.segViewer));
				event.stopImmediatePropagation(); 
			}
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
		if ((this.interactMode != 'move_top') && (this.interactMode != 'move_btm')) { return; }
		event.stopImmediatePropagation();

		const modPtVp = glMatrix.vec2.add([0,0], this.initialPtVp, [this.deltaStart[0], 0]);
		let modPtTx = this.mprViewer.viewportToTx(modPtVp).map(v => Math.max(0, Math.min(1, v)));
		this.activeRidge.insertPoint(this.acivePtLocX, (this.interactMode == 'move_top') ? 1-modPtTx[2] : modPtTx[2]);

		this.segViewer.maskFrame.copyToReliefMask(this.segViewer.renderEngine.mask);
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
		event.stopImmediatePropagation();
		
		const segViewer = this.segViewer;
		segViewer.renderEngine.stopAnimation();
		this.interactMode = 'none';
		
		segViewer.maskFrame.copyToReliefMask(segViewer.renderEngine.mask);
		BigLime.Utils.requestAnimFrame( segViewer.renderAll.bind(segViewer) );
	}


	/**
	 * Tests if a point is close to an mpr reference line
	 * @private
	 * 
	 * @param {vec2} testPtVp - The point to test.
	 * 
	 */
	_hitTest(testPtVp)
	{
		try
		{
			const tol = 8;
			const volShape = this.segViewer.renderEngine.volume.shape;
			const mprPoint = this.segViewer.mprPoint;
			const maskFrame = this.segViewer.maskFrame;
			const ix = Math.round(mprPoint[0] * (volShape[0]-1));

			for (let top of [true, false]) {
				const ridges = top ? maskFrame.topRidges : maskFrame.btmRidges;   
				
				let [minDist, bestPtLoc, bestPtVp, bestRidge] = [Infinity, null, null, null];
				               
				for (let [iy, ridge] of ridges) {
					let ptHeight = ridge.getHeight(ix);
					ptHeight = top ? 1 - ptHeight : ptHeight;
					const ptVp = this.mprViewer.txToViewport( [mprPoint[0], iy/(volShape[1]-1), ptHeight] );
					const dist = glMatrix.vec2.length( glMatrix.vec2.subtract([0,0], ptVp, testPtVp) );
					if (dist < minDist) { [minDist, bestPtLoc, bestPtVp, bestRidge] = [dist, ix, ptVp, ridge]; }
				} 
				if (minDist < tol) {
					return [(top ? 'hit_top' : 'hit_btm'), bestPtLoc, bestPtVp, bestRidge];
				}
			}

			return ['no_hit', null, null, null, null];
		}
		catch(err) 
		{ 
			BigLime.Logger.Report('SideMprMaskInteractor._hitTest failed. ' + (err ? err.message : ''), BigLime.Logger.Severity.Error); 
			return ['no_hit', null, null, null, null];
		}
	}

}