/**
 * @classdesc
 * This class loads a dummy data set into a volume.
 * 
 */
class MockDataLoader extends BigLime.Loader3D
{ 
    /**
 	 * @constructor
   	 * @param {HTMLElement} eventSrc - The html element from which to get mouse events.
     * 
     */
    constructor() 
	{ 
        super();
        this.imgBufferArray = null;
        this.imgWidth = 640;
        this.imgHeight = 420;
        this.numImgs = 64;
    };


    /**
     * Starts loading files into a volume object.
     * 
     * @param {FileList|File} imgFiles - The image File object(s) to load.
     * @param {VolumeT2|VolumeT3} volume - The volume object that will receive the data.
     * @param {function} [completionCb] - A callback to invoke when loading is complete.
     * @param {function} [progressCb] - A callback to invoke when each image is loaded.
     */
    loadImagesIntoVolume(imgFiles, volume, completionCb, progressCb) 
    {
        this.vol = volume;
        this.errors = null;
        this.warnings = null;
        this.done = false;
        this.loadCompleteCb = completionCb;
        this.loadProgressCb = progressCb;

        try
        {
             // Initialize the volume object   
            this.errors = this.vol.loadBegin([this.imgWidth, this.imgHeight, this.numImgs], 16, 'little');   
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
            this.vol.setAttr("sliceGap", 1);
            this.vol.setAttr("rowDir", [1,0,0]);
            this.vol.setAttr("colDir", [0,1,0]);
            this.vol.setAttr("seg_id", "Artificial segment");
            this.vol.calcNearLphAxes();

            // Start loading the pixel data into the textures.
            this.imgBufferArray = new Array(4);    
            this._createAndLoadData();
        }
        catch (ex) {
            this._onImageLoadingError();
        }
    };



    /**
     * Creates the dummy data and loads it into the gpu.
     * @private 
     * 
     */
    async _createAndLoadData() 
    {
        try
        {
            const [w, h, d] = [this.imgWidth, this.imgHeight, this.numImgs];
            const pad = Math.round(d/5);
            const papThickness = Math.round(d*2/20 + 1);
            const papGap = Math.round((d - 2*pad - 3*papThickness)/2);
            const sliceZcenters = [Math.round(pad+papThickness/2), Math.round(pad+1.5*papThickness+papGap), Math.round(pad+2.5*papThickness+2*papGap)];

            const randGen = new BigLime.SeededRandGen(123);
            const noiseLevel = 15000;

            const imgBuffers = [new Uint16Array(w*h), new Uint16Array(w*h)];
            for (let za = 0; za < this.numImgs; za+=2) {
                for (let dz=0; dz<2; dz++) {  
                    const z = za + dz;    
                    const imgBuffer = imgBuffers[dz];
                    imgBuffer.fill(0);
                    const deltaZs = sliceZcenters.map(c => Math.abs(z - c));
                    const minDeltaZ = Math.min(...deltaZs);
                    
                    if (minDeltaZ <= papThickness/2) {
                        const zCtrIndx = deltaZs.indexOf(minDeltaZ);
                        const zRel = z - sliceZcenters[zCtrIndx];
                        for (let y = pad; y < h-pad; y++) {
                            for (let x = pad; x < w-pad; x++) {
                                if (zRel >= papThickness/2 - 2) {
                                    if (zCtrIndx == 1) {
                                        for (let p=0; p<10; p++) {
                                            if ( (Math.abs(x-64*p) < 5) || (Math.abs(y-64*p) < 5) ) { 
                                                imgBuffer[y*w+x] = 32000; 
                                                break;
                                            }
                                        }
                                    } else {
                                        for (let p=0; p<13; p++) {
                                            if ( (Math.abs(x-50*p) < 4) || (Math.abs(y-50*p) < 4) ) { 
                                                imgBuffer[y*w+x] = 32000; 
                                                break;
                                            }
                                        }
                                    }
                                }
                                else { imgBuffer[y*w+x] = 30000; }
                            }
                        }        
                    }
                    // Add noise
                    for (let n=0; n<w*h; n++) { 
                        imgBuffer[n] = Math.max(0, imgBuffer[n] + randGen.nextInt(noiseLevel) - noiseLevel/2);
                    }
                }
                this._copyImagesToTexture({startIndex:za, endIndex:za+2, imgBuffers:imgBuffers});

                // Report progress
                if (this.loadProgressCb) {
                    this.loadProgressCb(za+2, this.numImgs);
                    await new Promise(r => setTimeout(r, 1));
                    if (this.cancelled) { return; } 
                }
            }
            this.vol.loadEnd();
            this.done = true;            
            if (this.loadCompleteCb) { this.loadCompleteCb(this); }
            return;
        }
        catch (ex) {
            this._onImageLoadingError();
        }
    };


    /**
     * Callback invoked when an error occurs during image loading.
     * @private
     * 
     */
    _onImageLoadingError() 
    {
        if (this.cancelled) { return; } 

        if (!this.done) {
            this.done = true;
            this.errors = "Error loading sample image.";
            if (this.loadCompleteCb) { this.loadCompleteCb(this); }
        }
    };
};



