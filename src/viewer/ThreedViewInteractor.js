/**
 * @classdesc
 * This class implements an interactor for adjusting pan, zoom, rotation and lighting
 * in the 3D viewport.
 * 
 */
class ThreedViewInteractor extends BigLime.MultiInteractor
{ 
    /**
 	 * @constructor
   	 * @param {SegmentViewer} segViewer - A SegmentViewer instance.
     * 
     */
    constructor(segViewer, eventTypes) 
	{ 
		// Inherit from Interactor
		eventTypes = eventTypes || 
			{rot: {btns:0, shift:false, ctrl:false, alt:false},
			pan:  {btns:2, shift:false, ctrl:false, alt:false},
			zoom: {btns:0, shift:true,  ctrl:false, alt:false},
			wl:   {btns:0, shift:false, ctrl:false, alt:true}}	
	
		super(segViewer.threedViewer.canvas, '3dView', eventTypes);

		// Initialize data members
		this.segViewer = segViewer;
        this.mipWWL = [1, 0];
        this.xrayUnmaskedWWL = [1, 0];
        this.xrayMaskedWWL = [1, 0];
		this.mprWWL = [1, 0];
	}


	/**
	 * Handler for start events.
	 * @private
	 * 
	 * @param {Event} event - Event info.
	 * 
	 */
	onStart(event)
	{
		const rp3 = this.segViewer.threedViewer.renderParams;
		const engine = this.segViewer.renderEngine;

		this.setInitialValues({zoom: rp3.zoom, pan: rp3.pan, rot: rp3.rotMatrix,
			lighting: {ambient:rp3.lightSet.ambientLight, shadow:rp3.lightSet.dirLights[0].shadowDarkness},
			wwl:{width:rp3.winWidth, level:rp3.winLevel, levelRange:engine.volume.getAutoWinLevel()[0]}});

		// Start an animation
		engine.animate(15, this.segViewer.render3D.bind(this.segViewer));
	}


	/**
	 * Handler for move events.
	 * @private
	 * 
	 * @param {Event} event - Event info.
	 * 
	 */
	onMove(event)
	{
		if (this.interactMode == 'none') { return; }

		const [vec2, mat4] = [glMatrix.vec2, glMatrix.mat4];
		const v3d = this.segViewer.threedViewer;
		const rp3 = v3d.renderParams;

		switch (this.interactMode)
		{
			case 'zoom':
			case 'wheelzoom':
				rp3.zoom = this.currentZoom;
				break;
				
			case 'pan':
				vec2.copy(rp3.pan, this.currentPan);
				break;

			case 'rotate':
				mat4.copy(rp3.rotMatrix, this.currentRot);
				break;

			case 'light':
				const renderMode = this.segViewer.getRenderMode();
				if (renderMode == 'vr') 
				{
					rp3.lightSet.ambientLight = this.ambient;
					rp3.lightSet.dirLights[0].shadowDarkness = this.shadow;
					v3d.controller.syncWith(rp3);
				} 
				else 
				{
					const currentWWL = [this.winWidth, this.winLevel];
					[rp3.winWidth, rp3.winLevel] = currentWWL;

					if (renderMode == 'mip') {
						this.mipWWL = currentWWL;
					}
					else if (renderMode == 'xray') {
						if (rp3.useMask) {
							this.xrayMaskedWWL = currentWWL;
						} else {
							this.xrayUnmaskedWWL = currentWWL;
						}
					}
					else if (renderMode == 'slice') {
						this.mprWWL = currentWWL;
					}
				}
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
	onEnd(event)
	{
		if (this.interactMode == 'none') return;

		this.segViewer.renderEngine.stopAnimation();
		this.segViewer.render3D(); 
	}
}