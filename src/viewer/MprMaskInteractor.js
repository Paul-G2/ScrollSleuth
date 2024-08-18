/**
 * @classdesc
 * This class implements an interactor for editing the relief mask.
 * an MPR viewport.
 * 
 */
class MprMaskInteractor extends BigLime.Interactor
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
		super(mprViewer.canvas, 'mprMask', eventTypes);

		// Add click handler
		mprViewer.canvas.addEventListener('mouseup', this._onClick.bind(this) ); 

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
			[hit_type, this.prevPtLoc, this.bracketingPtLocs, this.initialPtVp, this.activeRidge, this.bracketingRidgeLocs] = this._hitTest(this.currPoint);
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

		const maskFrame = this.segViewer.maskFrame;
		const volShape = this.segViewer.renderEngine.volume.shape;
		
		const modPtVp = glMatrix.vec2.add([0,0], this.initialPtVp, this.deltaStart);
		let modPtTx = this.mprViewer.viewportToTx(modPtVp).map(v => Math.max(0, Math.min(1, v)));
		
		let newPtLoc;
		if ((this.prevPtLoc === 0) || (this.prevPtLoc === maskFrame.xdim-1)) {
			newPtLoc = this.prevPtLoc;
		} else {
			newPtLoc = Math.round( modPtTx[0] * (volShape[0]-1) );
			newPtLoc = Math.max(this.bracketingPtLocs[0]+1, Math.min(this.bracketingPtLocs[1]-1, newPtLoc));
		}

		this.activeRidge.removePoint(this.prevPtLoc);
		this.activeRidge.insertPoint(newPtLoc, (this.interactMode == 'move_top') ? 1-modPtTx[2] : modPtTx[2]);
		this.prevPtLoc = newPtLoc;

		maskFrame.copyToReliefMask(this.segViewer.renderEngine.mask, this.bracketingRidgeLocs);

		event.stopImmediatePropagation();
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
		
		const segViewer = this.segViewer;
		segViewer.renderEngine.stopAnimation();
		this.interactMode = 'none';
		event.stopImmediatePropagation();

		segViewer.maskFrame.copyToReliefMask(segViewer.renderEngine.mask);
		BigLime.Utils.requestAnimFrame( segViewer.renderAll.bind(segViewer) ); // Render a full resolution image
	}


	/**
	 * Handler for click events; adds or removes a mask point.
	 * @priate
	 * 
	 * @param {Event} event - event info.
	 * 
	 */
	_onClick(event) 
	{ 
		try
		{
			if ((event.button !== 2) || (this.interactMode != 'none')) { return; } // Must be a right click
			event.preventDefault();

			const segViewer = this.segViewer;
			const maskFrame = segViewer.maskFrame;

			// Get the event coordinates
			let clickLocVp = BigLime.Interactor._getEventCoordinates(event);
			const rectVp = this.mprViewer.canvas.getBoundingClientRect();
			clickLocVp = [clickLocVp[0] - rectVp.left, clickLocVp[1] - rectVp.top];

			// If a point was right-clicked, then remove it
			let maskModified = false;
			const hitTestResult = this._hitTest(clickLocVp);
			const ridge = hitTestResult[4];

			if ((hitTestResult[0] == 'hit_btm' ) || (hitTestResult[0] == 'hit_top')) {
				let clickedRidgePtLoc = hitTestResult[1];    
				if ((clickedRidgePtLoc > 0) && (clickedRidgePtLoc < maskFrame.xdim-1)) { // Never delete endpoints
					ridge.removePoint(clickedRidgePtLoc);
					maskModified = true;   
				}                
			}
			// Otherwise, add a point
			else if ((hitTestResult[0] == 'near_top') || (hitTestResult[0] == 'near_btm')) {
				ridge.insertPoint(hitTestResult[1], hitTestResult[2]);
				maskModified = true; 
			}

			if (maskModified) {
				const segViewer = this.segViewer;
				segViewer.maskFrame.copyToReliefMask(segViewer.renderEngine.mask);
				segViewer.renderAll();
			}
		}
		catch(err) { 
			BigLime.Logger.Report('MprMaskInteractor._onClick failed. ' + (err ? err.message : ''), BigLime.Logger.Severity.Error); 
		}
	};



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
			const iy = Math.round(mprPoint[1] * (volShape[1]-1));

			for (let top of [true, false]) {
				const ridge = maskFrame.getRidge(iy, top);
				if (!ridge) { continue; }

				let [minDist, bestPtLoc, bestPtVp] = [Infinity, null, null];
				for (let [ptLoc, ptHeight] of ridge.points) {
					ptHeight = (top) ? 1 - ptHeight : ptHeight;
					const ptVp = this.mprViewer.txToViewport( [ptLoc/(volShape[0]-1), mprPoint[1], ptHeight] );
					const dist = glMatrix.vec2.length( glMatrix.vec2.subtract([0,0], ptVp, testPtVp) );
					if (dist < minDist) { [minDist, bestPtLoc, bestPtVp] = [dist, ptLoc, ptVp]; }
				}
				if (minDist < tol) {
					return [(top ? 'hit_top' : 'hit_btm'), bestPtLoc, ridge.getBracketingLocs(bestPtLoc), bestPtVp, ridge,
						maskFrame.getBracketingLocs(iy, top)];
				}
			}

			// No hit. But user may be adding a point at a new location, so figure out whether the 
			// click was closer to the top or bottom ridge
			const testPtTx = this.mprViewer.viewportToTx(testPtVp);  
			if (testPtTx.some(x => x < 0 || x > 1)) { 
				return ['no_hit', null, null, null, null]; // Click was outside the volume
			}

			const imgHasTopRidge = maskFrame.hasRidge(iy, true);
			const imgHasBtmRidge = maskFrame.hasRidge(iy, false);
			if (!imgHasTopRidge && !imgHasBtmRidge) {
				return ['no_hit', null, null, null, null]; // No editable ridge on current image
			}

			const testPtXLoc = Math.round(testPtTx[0] * volShape[0]);
			const topRidgePHeight = imgHasTopRidge ? 1 - maskFrame.getMaskProfile(iy, true).getHeight(testPtXLoc) : Infinity;
			const btmRidgeHeight = imgHasBtmRidge ? maskFrame.getMaskProfile(iy, false).getHeight(testPtXLoc) : Infinity;
			const hitType = (Math.abs(topRidgePHeight - testPtTx[2]) < Math.abs(btmRidgeHeight - testPtTx[2])) ? 'near_top' : 'near_btm';
			const height = (hitType == 'near_top') ? 1 - testPtTx[2] : testPtTx[2];
			return [hitType, testPtXLoc, height, testPtVp, maskFrame.getRidge(iy, (hitType == 'near_top'))];
		}
		catch(err) 
		{ 
			BigLime.Logger.Report('MprMaskInteractor._hitTest failed. ' + (err ? err.message : ''), BigLime.Logger.Severity.Error); 
			return ['no_hit', null, null, null, null];
		}
	}

}