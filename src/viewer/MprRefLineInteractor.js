/**
 * @classdesc
 * This class implements an interactor for moving the reference lines in
 * an MPR viewport.
 * 
 */
class MprRefLineInteractor extends BigLime.Interactor
{ 
    /**
 	 * @constructor
   	 * @param {MprViewer} mprViewer - Am MprViewer instance.
     * 
     */
    constructor(mprViewer, eventTypes) 
	{ 
		// Inherit from Interactor	
		eventTypes = eventTypes || {btns:0, shift:false, ctrl:true, alt:false,  meta:false};	
		super(mprViewer.canvas, 'mprRefLine', eventTypes);

		// Initialize data members
		this.mprViewer = mprViewer;
		this.segViewer = mprViewer.owner;
		this.eventTypes = Array.isArray(eventTypes) ? eventTypes : [eventTypes];
		this.enabled = true;
		this.interactMode = 'none';	
		this.initialMprPointVp = -1;
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
			[this.interactMode, this.initialMprPointVp] = this._hitTest(this.currPoint);
		
			if (this.interactMode != 'none') 
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

		const mprViewer = this.mprViewer;
		const segViewer = this.segViewer;

		switch (this.interactMode) 
		{
			case 'drag_x':
				const refPointX = this.initialMprPointVp + this.deltaStart[0];
				segViewer.setMprPoint( Math.max(0, Math.min(1, mprViewer.viewportToTx([refPointX, 0.5])[0])), 0);
				event.stopImmediatePropagation();
				break;

			case 'drag_y':
				const refPointY = this.initialMprPointVp + this.deltaStart[1];
				segViewer.setMprPoint( Math.max(0, Math.min(1, mprViewer.viewportToTx([0.5, refPointY])[1])), 1);
				event.stopImmediatePropagation();
				break;
	
			case 'drag_z':
				if (mprViewer.id == 'top') {
					const refPointZ = this.initialMprPointVp + this.deltaStart[1];
					segViewer.setMprPoint( Math.max(0, Math.min(1, mprViewer.viewportToTx([0.5, refPointZ])[2])), 2);
				}
				else if (mprViewer.id == 'side') {
					const refPointZ = this.initialMprPointVp + this.deltaStart[0];
					segViewer.setMprPoint( Math.max(0, Math.min(1, mprViewer.viewportToTx([refPointZ, 0.5])[2])), 2);
				}
				event.stopImmediatePropagation();
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
		BigLime.Utils.requestAnimFrame( this.segViewer.renderAll.bind(this.segViewer) ); // Render a full resolution image
		this.interactMode = 'none';
		event.stopImmediatePropagation();
	}


	/**
	 * Tests if a point is close to an mpr reference line
	 * @private
	 * 
	 * @param {vec2} point - The point to test.
	 * 
	 */
	_hitTest(point)
	{
		const mprViewer = this.mprViewer;
		const tol = 8;

		if (mprViewer.id == 'top') {
			const mprX = mprViewer.txToViewport(mprViewer.mprPoint)[0];
			const mprZ = mprViewer.txToViewport(mprViewer.mprPoint)[1];
			const dx = Math.abs(mprX - point[0]);
			const dz = Math.abs(mprZ - point[1]);

			if ((dx <= tol) && (dx <= dz)) { 
				return ['drag_x', mprX];
			}
			else if ((dz <= tol) && (dz < dx)) {
				return ['drag_z', mprZ];
			}
		}
		else { // id == 'side'
			const mprY = mprViewer.txToViewport(mprViewer.mprPoint)[1];
			const mprZ = mprViewer.txToViewport(mprViewer.mprPoint)[0];

			const dy = Math.abs(mprY - point[1]);
			const dz = Math.abs(mprZ - point[0]);
			if ((dy <= tol) && (dy <= dz)) {
				return ['drag_y', mprY];
			}
			else if ((dz <= tol) && (dz < dy)) {
				return ['drag_z', mprZ];
			}
		}
		return ['none', null];
	}
}