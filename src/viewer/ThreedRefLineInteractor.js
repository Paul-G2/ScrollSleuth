/**
 * @classdesc
 * This class implements an interactor for moving the reference lines in 
 * a 3D viewport.
 * 
 */
class ThreedRefLineInteractor extends BigLime.Interactor
{ 
    /**
 	 * @constructor
   	 * @param {SegmentViewer} segViewer - A SegmentViewer instance.
     * 
     */
    constructor(segViewer, eventTypes) 
	{ 
		// Inherit from Interactor	
		eventTypes = eventTypes || {btns:0, shift:false, ctrl:true, alt:false,  meta:false};	
		super(segViewer.threedViewer.canvas, '3dRefLine', eventTypes);

		// Add click handler
		segViewer.threedViewer.canvas.addEventListener('mouseup', this._onClick.bind(this) ); 

		// Initialize data members
		this.segViewer = segViewer;
		this.eventTypes = Array.isArray(eventTypes) ? eventTypes : [eventTypes];
		this.enabled = true;
		this.interactMode = 'none';
		this.initialMouseOffsetTx = [-1, -1, -1];
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
			[this.interactMode, this.initialMouseOffsetTx] = this._hitTest(this.currPoint);
			this.moved = false;
		
			if (['xy', 'x', 'y'].includes(this.interactMode)) 
			{
				this.segViewer.renderEngine.animate(15, this.segViewer.renderAll.bind(this.segViewer));
				event.stopImmediatePropagation(); // Don't send the event to anyone else
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
		if (this.interactMode == 'none') { return; }

		const [vec2, vec3] = [glMatrix.vec2, glMatrix.vec3];
		const segViewer = this.segViewer;
		const v3d = segViewer.threedViewer;

		if (['xy', 'x', 'y'].includes(this.interactMode)) 
		{
			// Project the cuurent mouse point to texture coordinates
			const mousePointVp = this.currPoint;
			const mousePointTx1 = v3d.viewportToTx(mousePointVp, -1);
			const mousePointTx2 = v3d.viewportToTx(mousePointVp,  1);

			const viewDirZ = -v3d.renderParams.rotMatrix[10];
			const clipBoxVertsTx = segViewer.volumeBbox.getVerticesTx();
			const slabSurfaceTxZ = viewDirZ > 0 ? clipBoxVertsTx[4][2] : clipBoxVertsTx[0][2];
			const alpha = (slabSurfaceTxZ - mousePointTx1[2]) / (mousePointTx2[2] - mousePointTx1[2]);

			const mousePointTx = vec3.scale([0,0,0], mousePointTx1, (1-alpha));
			vec3.scaleAndAdd(mousePointTx, mousePointTx, mousePointTx2, alpha);

			// Correct for the initial mouse offset
			vec3.subtract(mousePointTx, mousePointTx, this.initialMouseOffsetTx);

			switch (this.interactMode) 
			{
				case 'xy':
					segViewer.setMprPoint( Math.max(0, Math.min(1, mousePointTx[0])), 0);
					segViewer.setMprPoint( Math.max(0, Math.min(1, mousePointTx[1])), 1);
					break;

				case 'x':
					segViewer.setMprPoint( Math.max(0, Math.min(1, mousePointTx[0])), 0);
					break;

				case 'y':
					segViewer.setMprPoint( Math.max(0, Math.min(1, mousePointTx[1])), 1);
					break;
			}
			this.moved = true;
			event.stopImmediatePropagation();
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
		BigLime.Utils.requestAnimFrame( this.segViewer.renderAll.bind(this.segViewer) ); // Render a full resolution image
		this.interactMode = 'none';
	}


	/**
	 * Tests if a point is close to an mpr reference line
	 * @private
	 * 
	 * @param {vec2} testPointVp - The point to test.
	 * 
	 */
	_hitTest(testPointVp)
	{
		const [vec2, vec3] = [glMatrix.vec2, glMatrix.vec3];
		const segViewer = this.segViewer;
		const v3d = segViewer.threedViewer;

		// Get the MPR point projected into viewport coordinates
		const viewDirZ = -v3d.renderParams.rotMatrix[10];
		const clipBoxVertsTx = segViewer.volumeBbox.getVerticesTx();
		const slabSurfaceTxZ = viewDirZ > 0 ? clipBoxVertsTx[4][2] : clipBoxVertsTx[0][2];
		const mprPointTx = [segViewer.mprPoint[0], segViewer.mprPoint[1], slabSurfaceTxZ];
		const mprPointVp = v3d.txToViewport(mprPointTx);

		// Get the test point projected into texture coordinates
		const testPointTx1 = v3d.viewportToTx(testPointVp, -1);
		const testPointTx2 = v3d.viewportToTx(testPointVp,  1);
		const alpha = (slabSurfaceTxZ - testPointTx1[2]) / (testPointTx2[2] - testPointTx1[2]);
		const testPointTx = vec3.scale([0,0,0], testPointTx1, (1-alpha));
		vec3.scaleAndAdd(testPointTx, testPointTx, testPointTx2, alpha);
		const initialMouseOffsetTx = vec3.sub([0,0,0], testPointTx, mprPointTx);

		// Check if the test point is close to the MPR point
		const tol = 8;
		const dxVp = Math.abs(mprPointVp[0] - testPointVp[0]);
		const dyVp = Math.abs(mprPointVp[1] - testPointVp[1]);
		if ((dxVp <= tol) && (dyVp <= tol)) {
			return ['xy', initialMouseOffsetTx];		
		}
		else 
		{
			let ptA = v3d.txToViewport( [segViewer.mprPoint[0], 0, slabSurfaceTxZ] );
			let ptB = v3d.txToViewport( [segViewer.mprPoint[0], 1, slabSurfaceTxZ] );
			let dsq = BigLime.Utils.SquaredDistanceToLineSegment(testPointVp, ptA, ptB);
			if (dsq < tol * tol) {
				return ['x', initialMouseOffsetTx];
			} 
			else {
				ptA = v3d.txToViewport( [0, segViewer.mprPoint[1], slabSurfaceTxZ] );
				ptB = v3d.txToViewport( [1, segViewer.mprPoint[1], slabSurfaceTxZ] );
				dsq = BigLime.Utils.SquaredDistanceToLineSegment(testPointVp, ptA, ptB);
				if (dsq < tol * tol) {
					return ['y', initialMouseOffsetTx];
				}
			}
		}		
		return ['none', null];
	}


	/**
	 * Handler for click events; sets the crosshair location.
	 * @priate
	 * 
	 * @param {Event} event - event info.
	 * 
	 */
	_onClick(event) 
	{ 
		if ((event.button !== 0) || (!event.ctrlKey && !event.metaKey) || this.moved) { return; } // Must be a ctrl-left click
		event.preventDefault();

		const segViewer = this.segViewer;
		const v3d = segViewer.threedViewer;

		// Get the event coordinates
		let clickPointVp = BigLime.Interactor._getEventCoordinates(event);
		const rectVp = v3d.canvas.getBoundingClientRect();
		clickPointVp = [clickPointVp[0] - rectVp.left, clickPointVp[1] - rectVp.top];


		// Get the test point projected into texture coordinates
		const viewDirZ = -v3d.renderParams.rotMatrix[10];
		const clipBoxVertsTx = segViewer.volumeBbox.getVerticesTx();
		const slabSurfaceTxZ = viewDirZ > 0 ? clipBoxVertsTx[4][2] : clipBoxVertsTx[0][2];
		const clickPointTx1 = v3d.viewportToTx(clickPointVp, -1);
		const clickPointTx2 = v3d.viewportToTx(clickPointVp,  1);
		const alpha = (slabSurfaceTxZ - clickPointTx1[2]) / (clickPointTx2[2] - clickPointTx1[2]);
		const clickPointTx = glMatrix.vec3.scale([0,0,0], clickPointTx1, (1-alpha));
		glMatrix.vec3.scaleAndAdd(clickPointTx, clickPointTx, clickPointTx2, alpha);
		if (clickPointTx.every(c => (c >= -0.0001) && (c <= 1.0001))) {
			segViewer.setMprPoint(clickPointTx[0], 0);
			segViewer.setMprPoint(clickPointTx[1], 1);
			segViewer.renderAll();
		}
	};
}