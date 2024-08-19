/**
 * @classdesc
 * This class ... 
 * 
 */
class SegmentViewer
{ 
    /**
     * @constructor
     * 
     */
    constructor(site, app, glVersion) 
    {
        this.site = site;
        this.app = app;

        // Lay out the ui
        this.threedViewerDiv = BigLime.Ui.CreateElement('div', 'segvwr_threedViewerDiv', site, {bottom:0, right:0, backgroundColor:'#7092be'});
        this.topViewerDiv = BigLime.Ui.CreateElement('div', 'segvwr_topViewerDiv', site, {top:0, right:0, backgroundColor:'red'});
        this.sideViewerDiv = BigLime.Ui.CreateElement('div', 'segvwr_sideViewerDiv', site, {bottom:0, left:0, backgroundColor:'yellow'});
        this.topLeftDiv = BigLime.Ui.CreateElement('div', 'segvwr_topLeftDiv', site, {top:0, left:0});

        // Create the app-name text
        this.titleDiv = BigLime.Ui.CreateElement('div', 'appname_div', this.topLeftDiv,
            {width:'100%', height:'70%', display:'flex', alignItems:'center', justifyContent:'center'},
            {innerHTML:'<pre><p style="font-family:verdana; text-align:center; font-size:2.5vmin"><b>Scroll\nSleuth</b></p>'});  
        BigLime.Ui.StyleElement(this.topLeftDiv, {backgroundColor:'#90B2DE'})

        // Create a rendering engine
        this.renderEngine = new BigLime.RenderEngine({options:{glVersion:glVersion}});
        
        // Create the 3D viewer
        this.threedControls = new BigLime.ThreeDControls(document.getElementById('app_area'), this.renderEngine.ctx, 
            {title: 'VR Settings', minimal:true, borderWidth:1, borderColor:'#000000'});
        const v3d = this.threedViewer = new BigLime.ThreeDViewer( {site:this.threedViewerDiv, 
            renderEngine:this.renderEngine, omitInteractor:true, autoResize:false, controller:this.threedControls});
        v3d.id = 'threed';
        v3d.renderParams.updateFrom(Presets.Preset1);
        v3d.renderParams.showMarker = false;
        v3d.renderParams.useMask = true;
        v3d.renderParams.useXrayLut = true;
        v3d.setDefaultOrientation( BigLime.Utils.GetRotMatrix([1,0,0], [0,1,0]) );
        v3d.renderCallbacks.push( this.onViewerRender.bind(this) );
        v3d.calcSlabLines = this.calcSlabLines.bind(this); // Overrides the default
        this.fastDrawDownsamp = 0.5;
        
        // Create the MPR viewers
        const vTop = this.topViewer = new BigLime.MprViewer({site:this.topViewerDiv, autoResize:false, owner:this, id:'top',
            renderEngine:this.renderEngine, initialPlane:[[1,0,0],[0,0,1]], omitInteractor:true, drawOrientLabels:false});
        vTop.renderParams.zoom = [1, 1];
        vTop.renderCallbacks.push( this.onViewerRender.bind(this) );
        
        const vSide = this.sideViewer = new BigLime.MprViewer({site:this.sideViewerDiv, autoResize:false, owner:this, id:'side',
            renderEngine:this.renderEngine, initialPlane:[[0,0,1],[0,1,0]], omitInteractor:true, drawOrientLabels:false});
        vSide.renderParams.zoom = [1, 1];
        vSide.renderCallbacks.push( this.onViewerRender.bind(this) );
        
        this.allViewers = [vTop, vSide, v3d];
        this.mprViewers = [vTop, vSide];
        
        // The viewers will share a common mpr point:
        this.mprPoint = vTop.mprPoint = vSide.mprPoint = [0.5, 0.5, 0.5];

        // Create the clip box
        this.clipBox = v3d.renderParams.slab;
        var ctx = this.renderEngine.ctx;
        this.slabLinesInfo = {
            vertexBuffer: ctx.createAttrBuffer( new Float32Array(64*3), 3, {drawMode: ctx.gl.DYNAMIC_DRAW} ),  
            attrBuffer:   ctx.createAttrBuffer( new Float32Array(64*4), 4, {drawMode: ctx.gl.DYNAMIC_DRAW} ),
            numLines: 0
        }
        this.volumeBbox = new BigLime.Slab(this.renderEngine.volume);

        // Maintain a MaskFrame object
        this.maskFrame = new MaskFrame(2,2);

        // Create interactors
        this.interactors = {
            threedView    : new ThreedViewInteractor(this),
            threedRefLine : new ThreedRefLineInteractor(this),
            sideRefLine   : new MprRefLineInteractor(vSide),
            topRefLine    : new MprRefLineInteractor(vTop),
            sideView      : new MprViewInteractor(vSide),
            topView       : new MprViewInteractor(vTop),
            topMask       : new MprMaskInteractor(vTop),
            sideMask      : new SideMprMaskInteractor(vSide)
        }
        this.interactors.topView.panEnabled = this.interactors.sideView.panEnabled = false;
        this.interactors.topView.zoomEnabled = this.interactors.sideView.zoomEnabled = false;

        // Set up event handlers
        this.resizeListener = this.onResize.bind(this);
        window.addEventListener('resize', this.resizeListener);    
        this.onResize(true);

        // Create a help button
        this.helpBtn = BigLime.Ui.CreateElement('button', 'help_btn', this.topLeftDiv,
            {width:'50%', height:'18%', top:'65%', left:'25%', backgroundColor:'#C0D3ED'}, {innerHTML:'Help!'});  
        this.helpBtn.addEventListener('click', function() {
            if ( this.app.helpDialog.isShown() ) {
                this.app.helpDialog.hide();
            } else {
                this.app.helpDialog.show();
        }}.bind(this));

        this.renderEngine.canvas.addEventListener("webglcontextlost", function(e) { 
            e.preventDefault();
            alert("WebGL context lost"); 
            this.destroy();
            this.app.segViewer = new SegmentViewer(document.getElementById('viewer_area'), this.app);
            this.app.controlPanel.syncWith(this.app.segViewer.threedViewer.renderParams);
        }.bind(this));
    }


    /**
     * Deletes the viewer, and any resources that it owns.
     * 
     */
    destroy() 
    { 
        if (!this.renderEngine) { return; } // Already destroyed

        window.removeEventListener('resize', this.resizeListener);
        clearTimeout(this.resizeTimerId);
        BigLime.Utils.cancelAnimFrame(this.rafId);
        
        for (var id in this.interactors) { this.interactors[id].stopListening(); }
        this.allViewers.forEach( function(viewer) { viewer.destroy(); } );
        this.renderEngine.destroy();
        
        this.threedViewerDiv.remove();
        this.topViewerDiv.remove();
        this.sideViewerDiv.remove();
        this.topLeftDiv.remove();
        this.threedControls.mainDiv.remove();

        this.sideViewer = null;
        this.topViewer = null;
        this.threedViewer = null;
        this.renderEngine = null;
    }


    /**
     * Resizes the ui elements to fit the current window.
     * 
     */
    onResize(immediate=false)
    {
        if (this.resizeTimerId) { return; }
        
        const resizeFunc = function() {
            const [sv, tv, vv] = [this.sideViewer, this.topViewer, this.threedViewer]; 
            const prevDefault3dZoom = vv.calcDefaultOrthoZoom();
            const prevDefaultTopZoom = tv.calcDefaultZoom();
            const prevDefaultSideZoom = sv.calcDefaultZoom();
            
            // Update the viewer sizes 
            const sep = 10; // Gap between the viewers
            const bw = 0; // Border width    

            const siteRect = this.site.getBoundingClientRect();
            const dimD = Math.round(0.2 * Math.min(siteRect.width, siteRect.height));
            const dimW = Math.round(siteRect.width - dimD - sep);
            const dimH = Math.round(siteRect.height - dimD - sep);

            [this.topLeftDiv.style.width, this.topLeftDiv.style.height] = [dimD + 'px', dimD + 'px'];
            
            [sv.site.style.width, sv.site.style.height] = [dimD + 'px', dimH + 'px'];
            [tv.site.style.width, tv.site.style.height] = [dimW + 'px', dimD + 'px'];     
            [vv.site.style.width, vv.site.style.height] = [dimW + 'px', dimH + 'px'];

            [sv.canvas.style.width, sv.canvas.style.height] = [dimD-2*bw + 'px', dimH-2*bw + 'px'];
            [tv.canvas.style.width, tv.canvas.style.height] = [dimW-2*bw + 'px', dimD-2*bw + 'px'];     
            [vv.canvas.style.width, vv.canvas.style.height] = [dimW-2*bw + 'px', dimH-2*bw + 'px'];

            [sv.canvas.width, sv.canvas.height] = [dimD-2*bw, dimH-2*bw];
            [tv.canvas.width, tv.canvas.height] = [dimW-2*bw, dimD-2*bw];     
            [vv.canvas.width, vv.canvas.height] = [dimW-2*bw, dimH-2*bw];

            [sv, tv, vv].forEach( function(viewer) { 
                viewer.canvas.style.top = bw + 'px'; viewer.canvas.style.left = bw + 'px'; } );

            vv.renderParams.zoom *= vv.calcDefaultOrthoZoom() / prevDefault3dZoom;
            tv.renderParams.zoom[0] *= tv.calcDefaultZoom() / prevDefaultTopZoom;
            sv.renderParams.zoom[1] *= sv.calcDefaultZoom() / prevDefaultSideZoom;

            this.rafId = BigLime.Utils.requestAnimFrame( this.renderAll.bind(this) );
            this.resizeTimerId = null;
        }.bind(this);

        if (immediate) { resizeFunc(); }
        this.resizeTimerId = window.setTimeout(resizeFunc, 500);
    };


    /**
     * Loads image data into the viewer.
     * 
     * @param {FileList|File} files - The image File object(s) to load, and maybe a mask file too.
     * @param {Loader3D} loader - A 3D volume loader.
     * @param {Function} [completionCb] - Callback to be invoked when loading is complete.
     * @param {Function} [progressCb] - Progress callback.
     */
    loadVolume(files, loader, completionCb, progressCb)
    {
        this.allViewers.forEach( function(viewer) { viewer.clear(); } );
        this.app.controlPanel.fileNameLabel.innerHTML = "";

        const imgFiles = files.filter(file => !file.name.toLowerCase().endsWith('.json'));
        const maskFiles = files.filter(file => file.name.toLowerCase().endsWith('.json'));

        const loadCb = function(errMsg, warnings) {
            if (!errMsg) { this.onNewVolumeLoaded(imgFiles, maskFiles); }
            if (completionCb) { completionCb(errMsg, warnings, this); }
        }.bind(this);

        this.renderEngine.loadVolume(
            {imgFiles:imgFiles, loader:loader, completionCb:loadCb, progressCb:progressCb, omitRender:true, omitResetView:true});
    };


    /**
     * Cancels any in-progress loading.
     * (Client callbacks will not be invoked.)
     * 
     */
    cancelLoading()
    {
        this.renderEngine.cancelLoading();
    };


    /**
     * Updates our state when a new volume is loaded.
     * 
     */
    onNewVolumeLoaded(imgFiles, maskFiles)
    {
        try
        {
            const vol = this.renderEngine.volume;
            const cp = this.app.controlPanel;

            // Display the segment name 
            let fname = (imgFiles.length == 1) ? imgFiles[0].name : vol.getAttr('seg_id', "");
            const fontSize = fname.length <= 24 ? 11 : fname.length <= 28 ? 10 : fname.length <= 31 ? 9 : 
                fname.length <= 34 ? 8 : fname.length <= 37 ? 7 : 6;
            let area_txt = vol.getAttr('area_txt', "");
            if (area_txt) { area_txt = 'Area: ' + area_txt + ' cm^2'; }
            cp.fileNameLabel.innerHTML = 
                '<p style="font-family:verdana; margin-bottom:0px; margin-top:0px; font-size:' + fontSize + 'pt">' + fname +
                (area_txt ? '<br/>' + area_txt : '') + '</p>';

            const intr3d = this.interactors.threedView;
            const rp3d = this.threedViewer.renderParams;
            rp3d.clipToSlab = true;
            rp3d.showSlab = true;

            this.resetPan();
            this.resetZoom();
            this.resetOrientation();
            this.volumeBbox.reset();
            this.clipBox.reset();

            this.fastDrawDownsamp = Math.max(0.1, Math.min(0.5, 0.5/Math.sqrt(vol.shape[0]*vol.shape[1]/(2048*2048))));
            this.threedViewer.fastDrawDownsamp = this.app.controlPanel.hiSpeedBtn.checked ? this.fastDrawDownsamp : 1.0;
            
            this.maskFrame = new MaskFrame(vol.shape[0], vol.shape[1]);
            this.maskFrame.copyToReliefMask(this.renderEngine.mask);
        
            const autoWWL = vol.getAutoWinLevel();
            intr3d.mipWWL = [0.65*autoWWL[0], autoWWL[1] + 0.5*autoWWL[0]];
            intr3d.xrayUnmaskedWWL = [32768, 32768]; // The LUT maps xray pixvals to this range
            intr3d.xrayMaskedWWL = this.maskFrame.isVoid() ? [32768, 32768] :[32768, 32768/3];
            intr3d.mprWWL = [autoWWL[0], autoWWL[1]];
            [rp3d.winWidth, rp3d.winLevel] = intr3d.mipWWL;
            if (rp3d.renderType == BigLime.RenderType.XRAY) {
                [rp3d.winWidth, rp3d.winLevel] = (rp3d.useMask ? intr3d.xrayMaskedWWL : intr3d.xrayUnmaskedWWL);
            }     

            cp.xInput.max = vol.shape[0] - 1;
            cp.yInput.max = vol.shape[1] - 1;
            cp.zInput.max = vol.shape[2] - 1;
            cp.loadMaskBtn.disabled = false;
            cp.saveMaskBtn.disabled = false;
            this.setMprPoint([0.5, 0.5, 0.5]);  

            this.mprViewers.forEach( function(viewer) { 
                viewer.resetWindowWidthAndLevel(); 
                viewer.renderParams.useMask = false;
            } );

            // Load the mask file if the user specified one.
            if (maskFiles && maskFiles.length) {
                cp.onLoadMask(maskFiles);
            } else {
                if (imgFiles && imgFiles.length) { BigLime.UtilityDb.Instance().put('ssMaskDir', imgFiles[0]); }
                this.updateParamsForCurrentMode();
                this.renderAll();
            }
        }
        catch (err) { 
            BigLime.Logger.Report("Failed to load images.\n" + err, BigLime.Logger.Severity.Error, true); 
        }
    };


    /**
     * Re-renders all viewports.
     * 
     */
    renderAll()
    {
        this.allViewers.forEach( function(viewer) { viewer.render(); } );
    }


    /**
     * Re-renders just the 3D viewport.
     * 
     */
    render3D()
    {
        this.threedViewer.render();
    }


    /**
     * Re-renders just the mpr viewports.
     * 
     */
    renderMprs()
    {
        this.mprViewers.forEach( function(viewer) { viewer.render(); } );
    }



    /**
     * Gets the current render mode.
     * 
     */
    getRenderMode()
    {
        const cp = this.app.controlPanel;
        return cp.mipModeBtn.checked ? 'mip' : cp.vrModeBtn.checked ? 'vr' : cp.xrayModeBtn.checked ?  'xray': 'slice';
    }


    /**
     * Callback invoked when any of the viewers finishes rendering.
     * 
     */
    onViewerRender(viewer)
    {
        const vec3 = glMatrix.vec3;
        const canv = viewer.canvas;
        const vol = this.renderEngine.volume;
        const mprPoint = this.mprPoint;

        // Overlay colors
        const mprClipBoxColor = 'yellow';
        const maskColor = '#F455F0'; // pink
        const maskPointsColor = 'yellow';
        const yRefLIneColor = 'red';
        const xRefLineColor = '#0EF24C'; // green
        const zRefLineColor = '#8CDDFF'; // blue

        if (viewer != this.threedViewer)
        {
            // Draw the MPR bounding boxes
            let v = this.volumeBbox.getVerticesTx();
            const edges = (viewer === this.topViewer) ? 
                [[v[0], v[1]],  [v[4], v[5]],  [v[0], v[4]],  [v[1], v[5]]] : 
                [[v[0], v[2]],  [v[4], v[6]],  [v[0], v[4]],  [v[2], v[6]]];
            edges.forEach( edge => {
                const [p0, p1] = [viewer.txToViewport(edge[0]), viewer.txToViewport(edge[1])];
                BigLime.Utils.DrawLine(canv, p0, p1, {lineWidth:1, strokeStyle:mprClipBoxColor});
            });


            // Draw the MPR reference lines
            const xVec = vec3.subtract([0,0,0], v[1], v[0]);
            const yVec = vec3.subtract([0,0,0], v[2], v[0]); 
            const zVec = vec3.subtract([0,0,0], v[4], v[0]); 
            if (viewer === this.sideViewer) {
                const pa = viewer.txToViewport( vec3.scaleAndAdd([0,0,0], v[0], yVec, mprPoint[1]) );
                BigLime.Utils.DrawLine(canv, [0, pa[1]], [canv.width, pa[1]], {lineWidth:2, strokeStyle:yRefLIneColor});
                if (this.getRenderMode() == 'slice') {
                    const pc = viewer.txToViewport( vec3.scaleAndAdd([0,0,0], v[0], zVec, mprPoint[2]) );
                    BigLime.Utils.DrawLine(canv, [pc[0],0], [pc[0],canv.height], {lineWidth:2, strokeStyle:zRefLineColor});
                }
            }
            else if (viewer === this.topViewer) {
                const pb = viewer.txToViewport( vec3.scaleAndAdd([0,0,0], v[0], xVec, mprPoint[0]) );
                BigLime.Utils.DrawLine(canv, [pb[0], 0], [pb[0], canv.height], {lineWidth:2, strokeStyle:xRefLineColor});
                if (this.getRenderMode() == 'slice') {
                    const pc = viewer.txToViewport( vec3.scaleAndAdd([0,0,0], v[0], zVec, mprPoint[2]) );
                    BigLime.Utils.DrawLine(canv, [0, pc[1]], [canv.width, pc[1]], {lineWidth:2, strokeStyle:zRefLineColor});                    
                }
            }            

            // Draw the masks
            let startLoc, startHeight, startPtVp;
            const maskFrame = this.maskFrame;
            if (viewer.id == 'top') {              
                const iy = Math.round( mprPoint[1]*(vol.shape[1]-1) );
                for (let isTop of [true, false]) {        
                    const profile = maskFrame.getMaskProfile(iy, isTop);
                    const circleLocs = [];

                    [startLoc, startHeight] = [0, profile.getHeight(0)];
                    startHeight = isTop ? 1 - startHeight : startHeight;
                    startPtVp = viewer.txToViewport( [startLoc/(vol.shape[0]-1), mprPoint[1], startHeight] );
                    circleLocs.push(startPtVp);
                    
                    // Draw the mask edge-lines
                    const ctx = canv.getContext('2d');
                    ctx.lineWidth = 2;
                    ctx.strokeStyle = maskColor;
                    ctx.beginPath();
                    ctx.moveTo(startPtVp[0], startPtVp[1]);
                    for (let [currLoc, currHeight] of profile.points) {
                        if (currLoc === 0) { continue; }
                        currHeight = isTop ? 1 - currHeight : currHeight;
                        const currPtVp = viewer.txToViewport( [currLoc/(vol.shape[0]-1), mprPoint[1], currHeight] );
                        ctx.lineTo(currPtVp[0], currPtVp[1]);
                        circleLocs.push(currPtVp);
                    } 
                    ctx.stroke();
                    if ( maskFrame.hasRidge(iy, isTop) ) { 
                        circleLocs.forEach( ctr => BigLime.Utils.DrawCircle(canv, ctr, 2.5, {fill:true, fillStyle:maskPointsColor}) ); 
                    }  
                    
                    if (this.drawFilledMasks) {
                        // Fill-in the mask region
                        var prevAlpha = ctx.globalAlpha;
                        ctx.globalAlpha = 0.2;
                        ctx.fillStyle = maskColor;
                        ctx.beginPath();
                        const startPt = viewer.txToViewport( isTop ? [0, 0, 1] : [0, 0, 0]);
                        ctx.moveTo(startPt[0], startPt[1]);
                        for (let [currLoc, currHeight] of profile.points) {
                            currHeight = isTop ? 1 - currHeight : currHeight;
                            const currPtVp = viewer.txToViewport( [currLoc/vol.shape[0], mprPoint[1], currHeight] );
                            ctx.lineTo(currPtVp[0], currPtVp[1]);
                        }
                        const endPt = viewer.txToViewport( isTop ? [1, 0, 1] : [1, 0, 0]);
                        ctx.lineTo(endPt[0], endPt[1]);
                        ctx.closePath();
                        ctx.fill();
                        ctx.globalAlpha = prevAlpha;
                    }
                }     
            }
            else if (viewer.id == 'side') {              
                const ix = Math.round( mprPoint[0]*(vol.shape[0]-1) );
                for (let isTop of [true, false]) { 
                    const circleLocs = [];
                    const ridges = isTop ? maskFrame.topRidges : maskFrame.btmRidges;    
                    [startLoc, startHeight] = [0, ridges.get(0).getHeight(ix)];                 
                    startHeight = isTop ? 1 - startHeight : startHeight;
                    startPtVp = viewer.txToViewport( [mprPoint[0], startLoc/(vol.shape[1]-1), startHeight] );
                    circleLocs.push(startPtVp);
                    
                    // Draw the mask edge-lines
                    const ctx = canv.getContext('2d');
                    ctx.lineWidth = 2;
                    ctx.strokeStyle = maskColor;
                    ctx.beginPath();
                    ctx.moveTo(startPtVp[0], startPtVp[1]);
                    for (let [currLoc, ridge] of ridges) {
                        if (currLoc === 0) { continue; }
                        let currHeight = ridge.getHeight(ix);
                        currHeight = isTop ? 1 - currHeight : currHeight;
                        const currPtVp = viewer.txToViewport( [mprPoint[0], currLoc/(vol.shape[1]-1), currHeight] );
                        ctx.lineTo(currPtVp[0], currPtVp[1]);
                        circleLocs.push(currPtVp);
                    } 
                    ctx.stroke();
                    circleLocs.forEach( ctr => BigLime.Utils.DrawCircle(canv, ctr, 2.5, {fill:true, fillStyle:maskPointsColor}) ); 

                    if (this.drawFilledMasks) {
                        // Fill-in the mask region
                        var prevAlpha = ctx.globalAlpha;
                        ctx.globalAlpha = 0.2;
                        ctx.fillStyle = maskColor;
                        ctx.beginPath();
                        const startPt = viewer.txToViewport( isTop ? [0, 0, 1] : [0, 0, 0]);
                        ctx.moveTo(startPt[0], startPt[1]);
                        for (let [currLoc, ridge] of ridges) {
                            let currHeight = ridge.getHeight(ix);
                            currHeight = isTop ? 1 - currHeight : currHeight;
                            const currPtVp = viewer.txToViewport( [mprPoint[0], currLoc/vol.shape[1], currHeight] );
                            ctx.lineTo(currPtVp[0], currPtVp[1]);
                        }
                        const endPt = viewer.txToViewport( isTop ? [0, 1, 1] : [0, 1, 0]);
                        ctx.lineTo(endPt[0], endPt[1]);
                        ctx.closePath();
                        ctx.fill();
                        ctx.globalAlpha = prevAlpha;
                    }
                }     
            }
        }
    }


    /**
     * Sets the MPR point (in texture coodinates).
     * 
     */
    setMprPoint(mprPoint, index=-1)
    {
        const vec3 = glMatrix.vec3;
        if (index == -1) {
            vec3.copy(this.mprPoint, mprPoint);
        } else {
            this.mprPoint[index] = mprPoint;
        }
        vec3.max(this.mprPoint, [0,0,0], this.mprPoint);
        vec3.min(this.mprPoint, [1,1,1], this.mprPoint); 

        // Update the clip box
        const volShape = this.renderEngine.volume.shape;
        this.clipBox.center[2] = this.mprPoint[2] * (volShape[2]-1);

        // Update the control panel widgets
        const cp = this.app.controlPanel;
        const prevIy = parseInt(cp.yInput.value)
        const ix = Math.max(0, Math.min(volShape[0]-1, Math.round( (volShape[0] - 1) * this.mprPoint[0] )));
        const iy = Math.max(0, Math.min(volShape[1]-1, Math.round( (volShape[1] - 1) * this.mprPoint[1] )));
        const iz = Math.max(0, Math.min(volShape[2]-1, Math.round( (volShape[2] - 1) * (1 -this.mprPoint[2]) )));
        if (parseInt(cp.xInput.value) !== ix) { cp.xInput.value = ix; }
        if (parseInt(cp.yInput.value) !== iy) { cp.yInput.value = iy; }
        if (parseInt(cp.zInput.value) !== iz) { cp.zInput.value = iz; }

        if (iy != prevIy) { 
            cp.lastRemovedRidge = null;
            cp.removeRidgeBtn.innerHTML = "Rmv";
        }

        // Hack to avoid a blank viewport when we're right at the edge of the volume
        this.topViewer.setMprThickness(  (iy == 0) || (iy == 1) || (iy == volShape[1]-1) ? 4 : 1 );
        this.sideViewer.setMprThickness( (ix == 0) || (ix == 1) || (ix == volShape[0]-1) ? 4 : 1 );
    }


    /**
     * Resets the pan in all viewports.
     * 
     */
    resetPan()
    {
        this.allViewers.forEach( function(viewer) { viewer.renderParams.pan = [0,0]; } );
    }


    /**
     * Resets the zoom in all viewports.
     * 
     */
    resetZoom()
    {
        const v3d = this.threedViewer;
        const vol = this.renderEngine.volume;
        const rp3d = v3d.renderParams;

        const default3dOrthoZoom = 0.95 * this.threedViewer.calcDefaultOrthoZoom();
        rp3d.zoom = default3dOrthoZoom * (1 + rp3d.persp*(1 - vol.aspect[2]));

        const mprZoomZ = 0.9*vol.diagSize/vol.shape[2];
        this.topViewer.renderParams.zoom[0] = 0.98 * this.topViewer.calcDefaultZoom();
        this.sideViewer.renderParams.zoom[1] = 0.98 * this.sideViewer.calcDefaultZoom();      
        this.topViewer.renderParams.zoom[1] = mprZoomZ;
        this.sideViewer.renderParams.zoom[0] = mprZoomZ;
    }

    
    /**
     * Resets the orientation in the 3d viewport.
     * 
     */
    resetOrientation()
    {
        this.threedViewer.resetOrientation();
    }


    /**
     * Updates parameters for the current mode.
     * 
     */
    updateParamsForCurrentMode()
    {
        const rp3d = this.threedViewer.renderParams;
        const intr3dViewer = this.interactors.threedView;

        const mode = this.getRenderMode(); 
        const masked = this.app.controlPanel.enableMaskBtn.checked;

        if (mode == 'mip') {
            [rp3d.winWidth, rp3d.winLevel] = intr3dViewer.mipWWL;
        } 
        else if (mode == 'xray') {
            [rp3d.winWidth, rp3d.winLevel] = masked ? intr3dViewer.xrayMaskedWWL : intr3dViewer.xrayUnmaskedWWL;
            this.sanityCheckXrayWWL();
        }
        else if (mode == 'slice') {
            [rp3d.winWidth, rp3d.winLevel] = intr3dViewer.mprWWL;
        }

        this.clipBox.shape[2] = (mode == 'slice') ? 1 : 2*this.clipBox.vol.shape[2];
    }


    /**
     * The appropriate wwl for x-ray images is quite sensitive to the mask thickness; 
     * this function reduces the chance of displaying a totally black or totally white image due
     * to a bad wwl.)
     * 
     */
    sanityCheckXrayWWL()
    {
        const engine = this.renderEngine;
        const rp = this.threedViewer.renderParams;
        if (!engine.hasImageData() || (rp.renderType != BigLime.RenderType.XRAY)) { return; }

        // Render to framebuffer with the current x-ray params
        engine.setRenderParams(rp);
        engine.sizeRasterToMatch(this.threedViewer.canvas, 1);
        engine.render();

        // Read the rendered pixel values from the framebuffer
        const gl = engine.ctx.gl;
        const fb = engine.frameBuffers.threed;
        const wh = fb.width * fb.height;
        const buf = new ArrayBuffer(4*wh);
        const buf8 = new Uint8Array(buf);
        gl.bindFramebuffer(gl.FRAMEBUFFER, fb.glFrameBuffer);
        gl.readPixels(0,0, fb.width, fb.height, gl.RGBA, gl.UNSIGNED_BYTE, buf8);

        // Compute some pixel statistics
        const buf16 = new Uint16Array(buf);
        const currWWL = [rp.winWidth, rp.winLevel];
        const loThresh  = currWWL[1] - 0.4*currWWL[0];
        const hiThresh  = currWWL[1] + 0.4*currWWL[0];
        let numAboveLoThresh = 0;
        let numBelowHiThresh = 0;
        let sum = 0;
        for (let i=0; i<wh; i++) { 
            const pixVal = buf16[2*i];
            if (pixVal > loThresh) { numAboveLoThresh++; }
            if (pixVal < hiThresh) { numBelowHiThresh++; }
            sum += pixVal;
        }
        const avg = sum / wh;

        // Adjust the window width and level if necessary
        if ((numAboveLoThresh < 0.1*wh) || (numBelowHiThresh < 0.7*wh)) {
            [rp.winWidth, rp.winLevel] = [currWWL[0], 1.5*avg];
        }
    }

    /**
     * Calculates the wireframe lines for the slab.
     * 
     */
    calcSlabLines(transforms)
    { 
        const rp = this.threedViewer.renderParams;
        const slab = this.volumeBbox;

        const vec3 = glMatrix.vec3;
        const edgeColor = [1.000, 1.000, 0.000, 1,   1.000, 1.000, 0.000, 1]; // yellow-yellow
        const xRefColor = [0.055, 0.949, 0.298, 1,   0.055, 0.949, 0.298, 1]; // green-green
        const yRefColor = [1.000, 0.000, 0.000, 1,   1.000, 0.000, 0.000, 1]; // red-red
        const visibleLines = new Float32Array(64*3);
        const lineAttrs = new Float32Array(64*4);


        // Determine whether a face is visible (ie forward-facing)
        function isVisible(face) {
            const edgeA = vec3.subtract([0,0,0], cornersC[face[1]], cornersC[face[0]]);  
            const edgeB = vec3.subtract([0,0,0], cornersC[face[2]], cornersC[face[0]]);  
            vec3.normalize(edgeA, edgeA);
            vec3.normalize(edgeB, edgeB);
            return (edgeA[0]*edgeB[1] - edgeA[1]*edgeB[0] > 1e-4); // z-component of cross product
        }

        // Get the slab corners in model space
        const cornersM = slab.getVerticesTx().map(v => vec3.subtract([0,0,0], v, [0.5, 0.5, 0.5]));
    
        // Transform them to clip-space,  
        const cornersC = cornersM.map(mc => {
            const cc = vec3.transformMat4([0,0,0], mc, transforms.mvp);
            const pScale = 1 + rp.persp*(cc[2] + 1);
            return vec3.divide(cc, cc, [pScale, pScale, 1]);            
        });

        // Draw visible faces and reference lines
        let vbIndex = 0, abIndex = 0; 
        const xVecM = vec3.subtract([0,0,0], cornersM[1], cornersM[0]);
        const yVecM = vec3.subtract([0,0,0], cornersM[2], cornersM[0]);  
        const faces = [[0,1,2,3], [1,5,3,7], [2,3,6,7], [4,0,6,2], [4,5,0,1], [5,4,7,6]];
        for (let i=0; i<faces.length; i++) 
        {
            const face = faces[i];
            if (!isVisible(face)) { continue; } 
            
            // Draw slab edges
            var verts = [face[0], face[1],  face[0], face[2],  face[3], face[1],  face[3], face[2]];
            for (let i=0; i<verts.length; i+=2) {
                const [ia, ib] = [verts[i], verts[i+1]];
                visibleLines.set(cornersM[ia].concat(cornersM[ib]), vbIndex);
                lineAttrs.set(edgeColor, abIndex);
                vbIndex += 6;
                abIndex += 8;
            }

            let pa, pb;
            if (i == 5) { 
                const aspect = this.renderEngine.volume.aspect;
                const maxAspect = Math.max(aspect[0], aspect[1]);
                pa = vec3.scaleAndAdd([0,0,0], cornersM[4], xVecM, 0.02*maxAspect/aspect[0]);
                pb = vec3.scaleAndAdd([0,0,0], cornersM[4], yVecM, 0.02*maxAspect/aspect[1]);
                visibleLines.set(pa.concat(pb), vbIndex);
                lineAttrs.set(edgeColor, abIndex);      
                vbIndex += 6; abIndex += 8;                   
            }

            // Draw reference lines
            const mprPoint = this.topViewer.mprPoint;
            switch(i)
            {
                case 0:
                    pa = vec3.scaleAndAdd([0,0,0], cornersM[0], xVecM, mprPoint[0]);
                    pb = vec3.scaleAndAdd([0,0,0], cornersM[2], xVecM, mprPoint[0]);
                    visibleLines.set(pa.concat(pb), vbIndex);
                    lineAttrs.set(xRefColor, abIndex);      
                    vbIndex += 6; abIndex += 8;                  
                    
                    pa = vec3.scaleAndAdd([0,0,0], cornersM[0], yVecM, mprPoint[1]);
                    pb = vec3.scaleAndAdd([0,0,0], cornersM[1], yVecM, mprPoint[1]);
                    visibleLines.set(pa.concat(pb), vbIndex);
                    lineAttrs.set(yRefColor, abIndex);      
                    vbIndex += 6; abIndex += 8;                  
                    break;

                case 1:
                    pa = vec3.scaleAndAdd([0,0,0], cornersM[1], yVecM, mprPoint[1]);
                    pb = vec3.scaleAndAdd([0,0,0], cornersM[5], yVecM, mprPoint[1]);
                    visibleLines.set(pa.concat(pb), vbIndex);
                    lineAttrs.set(yRefColor, abIndex);      
                    vbIndex += 6; abIndex += 8;  
                    break;

                case 2:
                    pa = vec3.scaleAndAdd([0,0,0], cornersM[2], xVecM, mprPoint[0]);
                    pb = vec3.scaleAndAdd([0,0,0], cornersM[6], xVecM, mprPoint[0]);
                    visibleLines.set(pa.concat(pb), vbIndex);
                    lineAttrs.set(xRefColor, abIndex);      
                    vbIndex += 6; abIndex += 8;  
                    break;

                case 3:
                    pa = vec3.scaleAndAdd([0,0,0], cornersM[0], yVecM, mprPoint[1]);
                    pb = vec3.scaleAndAdd([0,0,0], cornersM[4], yVecM, mprPoint[1]);
                    visibleLines.set(pa.concat(pb), vbIndex);
                    lineAttrs.set(yRefColor, abIndex);      
                    vbIndex += 6; abIndex += 8;  
                    break;

                case 4:
                    pa = vec3.scaleAndAdd([0,0,0], cornersM[0], xVecM, mprPoint[0]);
                    pb = vec3.scaleAndAdd([0,0,0], cornersM[4], xVecM, mprPoint[0]);
                    visibleLines.set(pa.concat(pb), vbIndex);
                    lineAttrs.set(xRefColor, abIndex);      
                    vbIndex += 6; abIndex += 8;  
                    break;
                    
                case 5:
                    pa = vec3.scaleAndAdd([0,0,0], cornersM[4], xVecM, mprPoint[0]);
                    pb = vec3.scaleAndAdd([0,0,0], cornersM[6], xVecM, mprPoint[0]);
                    visibleLines.set(pa.concat(pb), vbIndex);
                    lineAttrs.set(xRefColor, abIndex);      
                    vbIndex += 6; abIndex += 8;                  
                    
                    pa = vec3.scaleAndAdd([0,0,0], cornersM[4], yVecM, mprPoint[1]);
                    pb = vec3.scaleAndAdd([0,0,0], cornersM[5], yVecM, mprPoint[1]);
                    visibleLines.set(pa.concat(pb), vbIndex);
                    lineAttrs.set(yRefColor, abIndex);      
                    vbIndex += 6; abIndex += 8;    
                    break;

                default:
                    break;
            }
        }

        this.slabLinesInfo.vertexBuffer.setData(visibleLines);
        this.slabLinesInfo.attrBuffer.setData(lineAttrs);
        this.slabLinesInfo.numLines = vbIndex/6;

        return this.slabLinesInfo;
    };

}