/**
 * @classdesc
 * This is container for the app controls.
 * 
 */
class ControlPanel
{
    /**
     * @constructor
     * 
     */
    constructor(site, app) 
    { 
        // Cache the App
        this.app = app;

        // Create our ui elements
        this.mainDiv = BigLime.Ui.CreateElement('div', 'ctrl_panel_maindiv', site,
            {top:'0px', bottom:'0px', left:'10px', right:'0px', fontSize:14, fontFamily:'Verdana',
                backgroundColor:'#7092BE'});

        this.fileChooserBtn = new BigLime.Ui.CreateLoadFileButton({id:'load_btn', parent:this.mainDiv, text:'Load Segment...',
            flatStyle:false, dbTag:'ssImageDir', multiple:true, callback:this.onInputFilesChosen.bind(this),
            styles:{width:'96%', left:'2%', top:'10px', height:'40px', fontSize:'16px', border:'2px solid #606060'}}); 


        // Render settings
        const rsDiv = BigLime.Ui.CreateElement('div', 'threed_mode_div', this.mainDiv, 
            {width:'96%', height:'270px', left:'2%', top:'65px', border:'1px solid #606060', backgroundColor:'#90B2DE'} );

        BigLime.Ui.CreateElement('label', 'renderSettings_label', rsDiv, 
            {top:'4px', width:'100%', display:'flex', justifyContent:'center'},  {innerHTML:'Render Settings'});

        this.vrModeBtn = BigLime.Ui.CreateElement('input', 'threed_mode_vr_btn', rsDiv, 
            {top:'35px', left:'7%', width:'25px', aspectRatio:'1/1'}, {type:'radio', name:'threed_mode', value:'vr', checked:true});
        BigLime.Ui.CreateElement('label', 'threed_mode_vr_lbl', rsDiv, {top:'63px', left:'8.5%'},  {innerHTML:'VR'}); 
        this.vrModeBtn.addEventListener('change', this.onThreedModeChange.bind(this)); 

        this.mipModeBtn = BigLime.Ui.CreateElement('input', 'threed_mode_mip_btn', rsDiv, 
            {top:'35px', left:'32%', width:'25px', aspectRatio:'1/1'}, {type:'radio', name:'threed_mode', value:'mip', checked:false} );
        BigLime.Ui.CreateElement('label', 'threed_mode_mip_lbl', rsDiv, {top:'63px', left:'32%'},  {innerHTML:'MIP'}); 
        this.mipModeBtn.addEventListener('change', this.onThreedModeChange.bind(this)); 
       
        this.xrayModeBtn = BigLime.Ui.CreateElement('input', 'threed_mode_xray_btn', rsDiv, 
            {top:'35px', left:'57%', width:'25px', aspectRatio:'1/1'}, {type:'radio', name:'threed_mode', value:'xray', checked:false} );
        BigLime.Ui.CreateElement('label', 'threed_mode_xray_lbl', rsDiv, {top:'63px', left:'53%'},  {innerHTML:'X-Ray'}); 
        this.xrayModeBtn.addEventListener('change', this.onThreedModeChange.bind(this)); 

        this.sliceModeBtn = BigLime.Ui.CreateElement('input', 'threed_mode_sliceModeBtn_btn', rsDiv, 
            {top:'35px', left:'82%', width:'25px', aspectRatio:'1/1'}, {type:'radio', name:'threed_mode', value:'sliceModeBtn', checked:false} );
        BigLime.Ui.CreateElement('label', 'threed_mode_sliceModeBtn_lbl', rsDiv, {top:'63px', left:'80%'},  {innerHTML:'Slice'}); 
        this.sliceModeBtn.addEventListener('change', this.onThreedModeChange.bind(this)); 

        
        this.onPresetSelected = function(preset) {
            const segViewer = this.app.segViewer;
            const v3d = segViewer.threedViewer;
            v3d.renderParams.updateFrom(preset);
            this.syncWith(v3d.renderParams);
            v3d.controller.syncWith(v3d.renderParams);
            segViewer.updateParamsForCurrentMode();
            segViewer.renderAll();
        }.bind(this);

        /*
        this.preset1Btn = BigLime.Ui.CreateElement('button', 'preset1_btn', rsDiv,
            {top:'92px', height:'39px', left:'5%', width:'25%'}, {innerHTML:"Preset<br>1"});
        this.preset1Btn.addEventListener('click', function() { this.onPresetSelected(Presets.Preset1); }.bind(this)); 
    
        this.preset2Btn = BigLime.Ui.CreateElement('button', 'preset2_btn', rsDiv,
            {top:'92px', height:'39px', left:'37.5%', width:'25%'}, {innerHTML:"Preset<br>2"});
        this.preset2Btn.addEventListener('click', function() { this.onPresetSelected(Presets.Preset2); }.bind(this)); 
    
        this.preset3Btn = BigLime.Ui.CreateElement('button', 'preset3_btn', rsDiv,
            {top:'92px', height:'39px', left:'70%', width:'25%'}, {innerHTML:"Preset<br>3"});
        this.preset3Btn.addEventListener('click', function() { this.onPresetSelected(Presets.Preset3); }.bind(this)); 
        */

        this.loadSettingsBtn = BigLime.Ui.CreateLoadFileButton({id:'load_settings_btn', parent:rsDiv, 
            text:'Load', flatStyle:false, dbTag:'ssSettingsDir', multiple:false, 
            callback:this.onLoadSettings.bind(this), styles:{width:'19%', height:'40px', top:'100px', left:'5%'}} );  

        this.saveSettingsBtn = BigLime.Ui.CreateSaveFileButton({id:'save_settings_btn', parent:rsDiv, 
            text:'Save', flatStyle:false, dbTag:'ssSettingsDir', suggestedName:"settings.txt", 
            callback:this.onSaveSettings.bind(this), styles:{width:'19%', height:'40px', top:'100px', left:'27%'}} );  

        this.editSettingsBtn = BigLime.Ui.CreateElement('button', 'vrcontrols_btn', rsDiv,
            {top:'100px', height:'40px', left:'49%', width:'19%'}, {innerHTML:"Edit"}
        );
        this.editSettingsBtn.addEventListener('click', function() {
            const vrControls = this.app.segViewer.threedViewer.controller;
            if (vrControls.isShown()) { 
                vrControls.hide(); 
            } else {
                vrControls.setRenderParams(this.app.segViewer.threedViewer.renderParams);
                vrControls.show();
            }
        }.bind(this));       

        this.defaultSettingsBtn = BigLime.Ui.CreateElement('button', 'default_settings_btn', rsDiv,
            {top:'100px', height:'40px', left:'71%', width:'25%'}, {innerHTML:"Default"}
        );
        this.defaultSettingsBtn.addEventListener('click', function() { this.onPresetSelected(Presets.Preset1); }.bind(this)); 

        this.resetPoseBtn = BigLime.Ui.CreateElement('button', 'reset_pose_btn', rsDiv,
            {top:'163px', height:'45px', left:'5%', width:'35%'}, {innerHTML:"Reset<br>view"});
        this.resetPoseBtn.addEventListener('click', function() {
            this.app.segViewer.resetPan();
            this.app.segViewer.resetZoom();
            this.app.segViewer.resetOrientation();
            this.app.segViewer.renderAll();
        }.bind(this)); 

        this.hiSpeedBtn = BigLime.Ui.CreateElement('input', 'hi_speed_btn', rsDiv, 
            {top:'163px', left:'50%', width:'20px', height:'20px'}, {type:'radio', name:'interact_mode', value:'hi_speed', checked:true});
        BigLime.Ui.CreateElement('label', 'hi_speed_lbl', rsDiv, {top:'163px', left:'64%'},  {innerHTML:'Hi speed'}); 
        this.hiSpeedBtn.addEventListener('change', function() {
            const sv = this.app.segViewer;
            sv.threedViewer.fastDrawDownsamp = this.hiSpeedBtn.checked ? sv.fastDrawDownsamp : 1.0;
        }.bind(this)); 

        this.hiQualBtn = BigLime.Ui.CreateElement('input', 'hi_qual_btn', rsDiv, 
            {top:'188px', left:'50%',  width:'20px', height:'20px'}, {type:'radio', name:'interact_mode', value:'hi_qual', checked:false} );
        BigLime.Ui.CreateElement('label', 'hi_qual_lbl', rsDiv, {top:'188px', left:'64%'},  {innerHTML:'Hi quality'}); 
        this.hiQualBtn.addEventListener('change', function() {
            const sv = this.app.segViewer;
            sv.threedViewer.fastDrawDownsamp = this.hiSpeedBtn.checked ? sv.fastDrawDownsamp : 1.0;
        }.bind(this)); 

        this.colorMapBtn = BigLime.Ui.CreateElement('input', 'colormap_btn', rsDiv, 
            {top:'230px', left:'5%', width:'22px', height:'22px'}, {type:'checkbox', checked:false});
        BigLime.Ui.CreateElement('label', 'colormap_lbl', rsDiv, {top:'232px', left:'18%'},  {innerHTML:'Heatmap'}); 
        this.colorMapBtn.addEventListener('click', function() {
            this.app.segViewer.threedViewer.renderParams.colorMapIndex = this.colorMapBtn.checked ? 1 : 0;
            this.app.segViewer.renderAll();
        }.bind(this));


        // Mask controls
        const maskDiv = BigLime.Ui.CreateElement('div', 'mask_div', this.mainDiv, 
            {width:'96%', height:'190px', left:'2%', top:'355px', border:'1px solid #606060', backgroundColor:'#90B2DE'} );

        BigLime.Ui.CreateElement('label', 'mask_label', maskDiv, 
            {top:'5px', width:'100%', display:'flex', justifyContent:'center'},  {innerHTML:'Mask'});  

        this.loadMaskBtn = BigLime.Ui.CreateLoadFileButton({id:'load_mask_btn', parent:maskDiv, 
            text:'Load', flatStyle:false, dbTag:'ssMaskDir', multiple:false, 
            callback:this.onLoadMask.bind(this), styles:{width:'37%', height:'30px', top:'30px', left:'10%', fontSize:12}} );  
        this.loadMaskBtn.disabled = true;

        this.saveMaskBtn = BigLime.Ui.CreateSaveFileButton({id:'save_mask_btn', parent:maskDiv, 
            text:'Save', flatStyle:false, dbTag:'ssMaskDir', suggestedName:"mask.json", 
            callback:this.onSaveMask.bind(this), styles:{width:'37%', height:'30px', top:'30px', left:'53%', fontSize:12}} ); 
        this.saveMaskBtn.disabled = true;
        
        this.topMaskBtn = BigLime.Ui.CreateElement('input', 'top_mask_btn', maskDiv, 
            {top:'83px', left:'10%', width:'22px', height:'22px'}, {type:'radio', name:'top_btm_select', value:'top', checked:true});
        BigLime.Ui.CreateElement('label', 'top_mask_lbl', maskDiv, {top:'86px', left:'21%'},  {innerHTML:'Top'}); 
        this.topMaskBtn.addEventListener('change', function() {
            this.lastRemovedRidge = null;
            this.removeRidgeBtn.innerHTML = "Rmv";
        }.bind(this)); 
 
        this.btmMaskBtn = BigLime.Ui.CreateElement('input', 'btm_mask_btn', maskDiv, 
            {top:'111px', left:'10%', width:'22px', height:'22px'}, {type:'radio', name:'top_btm_select', value:'btm', checked:false});
        BigLime.Ui.CreateElement('label', 'btm_mask_lbl', maskDiv, {top:'114px', left:'21%'},  {innerHTML:'Btm'}); 
        this.btmMaskBtn.addEventListener('change', function() {
            this.lastRemovedRidge = null;
            this.removeRidgeBtn.innerHTML = "Rmv";
        }.bind(this)); 

        this.addRidgeBtn = BigLime.Ui.CreateElement('button', 'addRidge_btn', maskDiv,
            {top:'81px', height:'25px', left:'40%', width:'23%'}, {innerHTML:"Add"} );
        this.addRidgeBtn.addEventListener('click', function() {
            const segViewer = this.app.segViewer;
            if (!segViewer.renderEngine.mask) { return; }
            
            const maskFrame = segViewer.maskFrame;
            const iy = parseInt( this.yInput.value );
            const applyToTop = (this.topMaskBtn.checked) ? true : false;
            if (!maskFrame.hasRidge(iy, applyToTop)) {
                maskFrame.insertRidge(iy, maskFrame.getMaskProfile(iy, applyToTop), applyToTop);
                segViewer.maskFrame.copyToReliefMask(segViewer.renderEngine.mask);
                segViewer.renderAll();
            }
        }.bind(this));      

        this.removeRidgeBtn = BigLime.Ui.CreateElement('button', 'removeRidge_btn', maskDiv,
            {top:'81px', height:'25px', left:'65%', width:'23%'}, {innerHTML:"Rmv"} );
        this.removeRidgeBtn.addEventListener('click', function() {
            const segViewer = this.app.segViewer;
            if (!segViewer.renderEngine.mask) { return; }
            
            const maskFrame = segViewer.maskFrame;
            const iy = parseInt( this.yInput.value );
            const applyToTop = (this.topMaskBtn.checked) ? true : false;
            if (this.removeRidgeBtn.innerHTML.includes('Rmv')) 
            {
                if ((iy > 0) && (iy < maskFrame.ydim-1) && maskFrame.hasRidge(iy, applyToTop)) {
                    this.lastRemovedRidge = {iy:iy, ridge:maskFrame.removeRidge(iy, applyToTop), isTop:applyToTop};
                    if (this.lastRemovedRidge.ridge) {
                        this.removeRidgeBtn.innerHTML = '<span style="font-size:8pt">Restore</span>';
                    }
                }
            } 
            else {
                if (this.lastRemovedRidge && this.lastRemovedRidge.ridge && (this.lastRemovedRidge.iy == iy)) {
                    maskFrame.insertRidge(this.lastRemovedRidge.iy, this.lastRemovedRidge.ridge, this.lastRemovedRidge.isTop);
                    this.lastRemovedRidge = null;
                }
                this.removeRidgeBtn.innerHTML = "Rmv";
            }
            maskFrame.copyToReliefMask(segViewer.renderEngine.mask);
            segViewer.renderAll();
        }.bind(this)); 

        this.prevRidgeBtn = BigLime.Ui.CreateElement('button', 'prevRidge_btn', maskDiv,
            {top:'111px', height:'25px', left:'40%', width:'23%'}, {innerHTML:"Prev"} );
        this.prevRidgeBtn.addEventListener('click', function() {
            const maskFrame = this.app.segViewer.maskFrame;
            const iy = parseInt( this.yInput.value );
            const [prevLoc, nextLoc] = maskFrame.getBracketingLocs(iy, this.topMaskBtn.checked);
            this.app.segViewer.setMprPoint(prevLoc/(maskFrame.ydim-1), 1);
            this.app.segViewer.renderAll();
        }.bind(this));      

        this.nextRidgeBtn = BigLime.Ui.CreateElement('button', 'nextRidge_btn', maskDiv,
            {top:'111px', height:'25px', left:'65%', width:'23%'}, {innerHTML:"Next"} );
        this.nextRidgeBtn.addEventListener('click', function() {
            const maskFrame = this.app.segViewer.maskFrame;
            const iy = parseInt( this.yInput.value );
            const [prevLoc, nextLoc] = maskFrame.getBracketingLocs(iy, this.topMaskBtn.checked);
            this.app.segViewer.setMprPoint(nextLoc/(maskFrame.ydim-1), 1);
            this.app.segViewer.renderAll();
        }.bind(this));  

        this.enableMaskBtn = BigLime.Ui.CreateElement('input', 'enable_mask_btn', maskDiv, 
            {top:'156px', left:'28%', width:'22px', height:'22px'}, {type:'checkbox', checked:true});
        BigLime.Ui.CreateElement('label', 'enable_mask_lbl', maskDiv, {top:'158px', left:'41%'},  {innerHTML:'Apply Mask'}); 
        this.enableMaskBtn.addEventListener('click', function() {
            const segViewer = this.app.segViewer;
            const rp3 = segViewer.threedViewer.renderParams;
            rp3.useMask = this.enableMaskBtn.checked;
            segViewer.updateParamsForCurrentMode();
            segViewer.renderAll();
        }.bind(this)); 


        // Position controls
        const positionDiv = BigLime.Ui.CreateElement('div', 'position_div', this.mainDiv, 
            {width:'96%', height:'55px', left:'2%', top:'565px', border:'1px solid #606060', backgroundColor:'#90B2DE'} );

        BigLime.Ui.CreateElement('label', 'x_label', positionDiv, 
            {top:20, left:'1%', width:'7%'},  {innerHTML:'X:'});    
    
        this.xInput = BigLime.Ui.CreateNumericInput( "position_x", positionDiv,
            {left:'8%', width:'20%', height:25, top:15, inpWidth:'100%', fontSize:13, textAlign:'center'}, {min:0, max:99999, val:0, step:1},
            function(e) {
                const segViewer = this.app.segViewer;
                var volShape = segViewer.renderEngine.volume.shape;
                let val = parseInt( this.xInput.value );
                if (val > parseInt(this.xInput.max)) { val = this.xInput.value = parseInt(this.xInput.max); }
                if (val < 0) { val = this.xInput.value = 0; }
                segViewer.setMprPoint(val/(volShape[0]-1), 0);
                segViewer.renderAll();
            }.bind(this)
        );   

        BigLime.Ui.CreateElement('label', 'y_label', positionDiv, 
            {top:20, left:'35%', width:'7%'},  {innerHTML:'Y:'});    
    
        this.yInput = BigLime.Ui.CreateNumericInput( "position_y", positionDiv,
            {left:'42%', width:'20%', height:25, top:15, inpWidth:'100%', fontSize:13, textAlign:'center'}, {min:0, max:99999, val:0, step:1},
            function(e){
                const segViewer = this.app.segViewer;
                var volShape = segViewer.renderEngine.volume.shape;
                let val = parseInt( this.yInput.value );
                if (val > parseInt(this.yInput.max)) { val = this.yInput.value = parseInt(this.yInput.max); }
                if (val < 0) { val = this.yInput.value = 0; }
                segViewer.setMprPoint(val/(volShape[1]-1), 1);
                segViewer.renderAll();
                this.lastRemovedRidge = null;
                this.removeRidgeBtn.innerHTML = "Rmv";
            }.bind(this)
        );   

        BigLime.Ui.CreateElement('label', 'z_label', positionDiv, 
            {top:20, left:'69%', width:'7%'},  {innerHTML:'Z:'});    
    
        this.zInput = BigLime.Ui.CreateNumericInput( "position_z", positionDiv,
            {left:'76%', width:'20%', height:25, top:15, inpWidth:'100%', fontSize:13, textAlign:'center'}, {min:0, max:99999, val:0, step:1},
            function(e){
                const segViewer = this.app.segViewer;
                var volShape = segViewer.renderEngine.volume.shape;
                let val = parseInt( this.zInput.value );
                if (val > parseInt(this.zInput.max)) { val = this.zInput.value = parseInt(this.zInput.max); }
                if (val < 0) { val = this.zInput.value = 0; }
                segViewer.setMprPoint(1-val/Math.max(1, volShape[2]-1), 2);
                segViewer.renderAll();
            }.bind(this)
        );


        // Screenshot button
        const screenshotDiv = BigLime.Ui.CreateElement('div', 'screenshot_div', this.mainDiv, 
            {width:'96%', height:'56px', left:'2%', top:'640px', border:'1px solid #606060', backgroundColor:'#90B2DE'} );

        this.saveScreenshotBtn = BigLime.Ui.CreateSaveFileButton({id:'save_screenshot_btn', parent:screenshotDiv, 
            text:'Screenshot', flatStyle:false, dbTag:'ssScreenshotDir', suggestedName:"screenshot.jpg", 
            callback:this.onSaveScreenshot.bind(this), styles:{top:'13px', height:'30px', left:'28%', width:'44%', fontSize:12}} ); 


        // File-name label
        this.fileNameLabel = BigLime.Ui.CreateElement('label', 'fname_label', this.mainDiv, 
            {bottom:0, left:0, width:'100%', height:'45px', display:'flex', flexDirection:'column', 
                justifyContent:'flex-end'},  {innerHTML:''});    

        // Cache some webgl device properties
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = tempCanvas.height = 1;
        const tempCtx = new BigLime.GLContext(tempCanvas);
        this.glMax2DTextureSize = tempCtx.GlMaxTextureSize;
        this.glMax3DTextureSize = tempCtx.GlMax3DTextureSize;
        tempCtx.destroy();
    }

    /**
     * Syncs the UI with the given settings.
     * 
     */
    syncWith(settings)
    {
        this.vrModeBtn.checked = (settings.renderType == BigLime.RenderType.VR);  
        this.mipModeBtn.checked = (settings.renderType == BigLime.RenderType.MIP) && !this.sliceModeBtn.checked;
        this.xrayModeBtn.checked = (settings.renderType == BigLime.RenderType.XRAY) 
        this.sliceModeBtn.checked = (settings.renderType == BigLime.RenderType.MIP) && this.sliceModeBtn.checked;
        this.colorMapBtn.checked = (settings.colorMapIndex > 0);
    }


    /**
     * Handler for the 'Load Volume' button.
     * @param {FileList} files - The image files to load.
     * 
     */
    async onInputFilesChosen(files)
    {
        if (!files || this.app.segViewer.renderEngine.loadingData) { return; }

        const loadBtn = this.fileChooserBtn;
        try
        {
            // Check the file extensions
            const imgFiles = files.filter(file => file.name.toLowerCase().endsWith('.tiff') 
                || file.name.toLowerCase().endsWith('.tif') || file.name.toLowerCase().endsWith('.nrrd'));
            if (!imgFiles.length) { 
                alert('No .tif or .nrrd files were found in the selection.'); 
                return; 
            }

            // Disable the button
            loadBtn.ignoreClicks = true;     

            // Get an appropriate loader
            const loader = (imgFiles[0].name.toLowerCase().endsWith('.nrrd')) ? new BigLime.NrrdLoader3D() : 
                new BigLime.TiffLoader3D([[65000, 'area_txt'], [65001, 'crop_id'], [65002, 'seg_id']]); 

            // Preliminary check of the image dimensions
            let imgDims;
            try {
                imgDims = await loader.getImageDims(imgFiles[0]);
            }
            catch(err) {
                alert('Failed to read image header (Invalid tif or nrrd file?).\n'  + err);
                loadBtn.ignoreClicks = false;
                return;
            }
            if ((imgDims[0] > this.glMax2DTextureSize) || (imgDims[1] > this.glMax2DTextureSize)) {
                alert('Failed to load images.\nImage dimensions must be less than ' + this.glMax2DTextureSize + '.\n' + 
                    'Current image size is ' + imgDims[0] + 'x' + imgDims[1] + '.');
                loadBtn.ignoreClicks = false;
                return;
            }

            // Create a new segment viewer and load the images into it
            const glVersion = (imgDims[0] <= this.glMax3DTextureSize) && (imgDims[1] <= this.glMax3DTextureSize) ? undefined : 1;
            const prevRenderParams = this.app.segViewer.threedViewer.renderParams;
            this.app.segViewer.destroy();
            this.app.segViewer = new SegmentViewer(document.getElementById('viewer_area'), this.app, glVersion);
            this.app.segViewer.threedViewer.renderParams.updateFrom(prevRenderParams);
            this.syncWith(this.app.segViewer.threedViewer.renderParams);

            this.app.segViewer.loadVolume(files, loader, 
                function(errors, warnings) {
                    if (errors) {
                        alert('Failed to load images.\n'  + errors);
                    } else if (warnings) {
                        alert('Warnings while loading images:\n'  + warnings);
                    }
                    loadBtn.innerHTML = 'Load Segment...';
                    loadBtn.ignoreClicks = false;
                },
                function(current, total) {
                    loadBtn.innerHTML = (current === 0) ? "Loading..." : "Loading " + current + "/" + total;
                }
            );
        }
        catch(err) {
            alert('Failed to load images.\n'  + err);
            loadBtn.innerHTML = 'Load Segment...';
            loadBtn.ignoreClicks = false;
        }
    }


    loadMockData()
    {
        const loadBtn = this.fileChooserBtn;
        if (loadBtn.ignoreClicks) { return; }
        loadBtn.ignoreClicks = true; 

        const prevRenderParams = this.app.segViewer.threedViewer.renderParams;
        this.app.segViewer.destroy();
        const segViewer = this.app.segViewer = new SegmentViewer(document.getElementById('viewer_area'), this.app);
        segViewer.threedViewer.renderParams.updateFrom(prevRenderParams);
        this.syncWith(segViewer.threedViewer.renderParams);

        const maskFrame = MaskFrame.FromJsonString('{"xdim":640,"ydim":420,"topRidges":[[0,[[0,0],[146,0],[177,0.302528],[639,0.300158]]],[91,[[0,0],' + 
            '[122,0],[161,0.373825],[533,0.363834],[639,0.358083]]],[210,[[0,0],[100,0],[160,0.395375],[639,0.347551]]],[301,[[0,0],[100,0],[145,0.08237],' + 
            '[160,0.16352],[216,0.362424],[540,0.363418],[607,0.121116],[639,0]]],[336,[[0,0],[145,0],[216,0.351901],[540,0.365719],[590,0.102422],[639,0]]],' +
            '[369,[[0,0],[74,0.00032],[124,0.05792],[498,0.197209],[574,0],[639,0]]],[419,[[0,0],[639,0]]]],"btmRidges":[[0,[[0,0.437072],[639,0.384413]]],' + 
            '[419,[[0,0.379147],[639,0.368615]]]]}');
       
        try {
            segViewer.loadVolume([], new MockDataLoader(), 
                function(errors, warnings) {
                    if (errors) {
                        alert('Failed to load images.\n'  + errors);
                    } else if (warnings) {
                        alert('Warnings while loading images:\n'  + warnings);
                    }
                    loadBtn.innerHTML = 'Load Segment...';
                    loadBtn.ignoreClicks = false;
                    segViewer.maskFrame = maskFrame;
                    segViewer.maskFrame.copyToReliefMask(segViewer.renderEngine.mask);
                    segViewer.updateParamsForCurrentMode();
                    segViewer.renderAll();
                },
                function(current, total) {
                    loadBtn.innerHTML = (current === 0) ? "Loading..." : "Loading " + current + "/" + total;
                }
            );
        }
        catch(err) {
            alert('Failed to load images.\n'  + err);
            loadBtn.innerHTML = 'Load Segment...';
            loadBtn.ignoreClicks = false;
        }
    }


    /**
     * Handler for the 'Load settings' button.
     * 
     */
    onLoadSettings(fileHandles)
    {
        if (!fileHandles || !fileHandles.length) { return; }
    
        // Try to read the settings file
        var fileReader = new FileReader();
        fileReader.onload = function(e){
            try {
                const settings = new BigLime.Settings(JSON.parse(e.target.result));
                const segViewer = this.app.segViewer;
                const rp3d = segViewer.threedViewer.renderParams;
                rp3d.updateFrom(settings);
                rp3d.clipToSlab = true; // Override these settings
                rp3d.showSlab = true;
                this.syncWith(rp3d);
                segViewer.threedViewer.controller.syncWith(rp3d);
                segViewer.updateParamsForCurrentMode();
                segViewer.renderAll();
            }
            catch (ex) {  
                BigLime.Logger.Report('Failed to read settings file', BigLime.Logger.Severity.Warn, true);
            }
        }.bind(this);
    
        fileReader.onerror = function() { 
            BigLime.Logger.Report('Failed to read settings file', BigLime.Logger.Severity.Warn, true);
        };
    
        fileHandles[0].getFile().then(
            function(file) { fileReader.readAsText(file); })
        .catch();
    }


    /**
     * Handler for the 'Save settings' button.
     * 
     */
    onSaveSettings(fileHandle)
    {
        if (!fileHandle) { return; }

        try {
            const rp3d = this.app.segViewer.threedViewer.renderParams;
            const settingsString = new BigLime.Settings(rp3d).toJsonString();
            const blob = new Blob([settingsString], {type: 'text/plain'});
    
            fileHandle.createWritable().then(function(writable) {
                writable.write(blob).then(function() {
                    writable.close();
                });
            })
            .catch(err => {
                BigLime.Logger.Report('Failed to save Settings file', BigLime.Logger.Severity.Warn, true);
            });
        }
        catch (ex) {
            BigLime.Logger.Report('Failed to save Settings file', BigLime.Logger.Severity.Warn, true);
        }
    }


    /**
     * Handler for the '3D mode' buttons.
     *  
     */
    onThreedModeChange()
    {
        const segViewer = this.app.segViewer;

        const mode = (this.mipModeBtn.checked || this.sliceModeBtn.checked) ? BigLime.RenderType.MIP : 
            this.vrModeBtn.checked ? BigLime.RenderType.VR : BigLime.RenderType.XRAY;

        const rp3d = segViewer.threedViewer.renderParams;
        rp3d.renderType = mode;
        segViewer.updateParamsForCurrentMode();
        segViewer.renderAll(); 
    }

    
    /**
     * Handler for the 'Load settings' button.
     * 
     */
    onLoadMask(fileHandles)
    {
        if (!fileHandles || !fileHandles.length) { return; }
    
        // Try to read the mask file
        var fileReader = new FileReader();
        fileReader.onload = function(e){
            try {
                const segViewer = this.app.segViewer;
                const engine = segViewer.renderEngine;
                const maskFrame = MaskFrame.FromJsonString(e.target.result);
                if (!engine.mask || (engine.mask.width != maskFrame.xdim) || (engine.mask.height != maskFrame.ydim)) {
                    alert('Cannot load mask.\nMask size does not match image size, or there is no image loaded.');
                }
                else {
                    segViewer.maskFrame = maskFrame;
                    segViewer.maskFrame.copyToReliefMask(engine.mask);
                    segViewer.updateParamsForCurrentMode(); 
                    BigLime.UtilityDb.Instance().put('ssMaskDir', fileHandles[0]);
                }
            }
            catch (ex) {  
                BigLime.Logger.Report('Failed to read mask file', BigLime.Logger.Severity.Warn, true);
            }
            finally {
                this.app.segViewer.renderAll();
            }
        }.bind(this);
    
        fileReader.onerror = function() { 
            BigLime.Logger.Report('Failed to read mask file', BigLime.Logger.Severity.Warn, true);
            this.app.segViewer.renderAll();
        };
    
        fileHandles[0].getFile().then(
            function(file) { fileReader.readAsText(file); })
        .catch(err => {
            BigLime.Logger.Report('Failed to read mask file', BigLime.Logger.Severity.Warn, true);
            this.app.segViewer.renderAll();
        });
    }


    /**
     * Handler for the 'Save mask' button.
     * 
     */
    onSaveMask(fileHandle)
    {
        if (!fileHandle) { return; }

        try {
            const maskString = this.app.segViewer.maskFrame.toJsonString()
            const blob = new Blob([maskString], {type: 'text/plain'});
    
            fileHandle.createWritable().then(function(writable) {
                writable.write(blob).then(function() {
                    writable.close();
                });
            })
            .catch(err => {
                BigLime.Logger.Report('Failed to save Mask file', BigLime.Logger.Severity.Warn, true);
            });
        }
        catch (ex) {
            BigLime.Logger.Report('Failed to save Mask file', BigLime.Logger.Severity.Warn, true);
        }
    }



    /**
     * Handler for the 'Screenshot' button.
     * 
     */
    onSaveScreenshot(fileHandle)
    {
        if (!fileHandle) { return; }

        try {
            this.app.segViewer.threedViewer.canvas.toBlob(function(blob) {
                fileHandle.createWritable().then(function(writable) {
                    writable.write(blob).then(function() {
                        writable.close();
                    });
                })
                .catch(err => {
                    BigLime.Logger.Report('Failed to save screenshot', BigLime.Logger.Severity.Warn, true);
                });
            }, 'image/jpeg', 0.9);
        }
        catch (ex) {
            BigLime.Logger.Report('Failed to savescreenshot.', BigLime.Logger.Severity.Warn, true);
        }
    }

};


