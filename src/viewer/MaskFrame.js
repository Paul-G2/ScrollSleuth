/**
 * @classdesc
 * This class manages a set of MaskRidges that specify the shape of a relief mask.  
 * 
 */
class MaskFrame
{
   
    /**
     * @constructor
     * 
     */
    constructor(xdim, ydim) 
    {         
        this.xdim = xdim;
        this.ydim = ydim;
        this.topRidges = new Map();
        this.btmRidges = new Map();

        // Set initial ridges
        this.topRidges.set(0, new MaskRidge(xdim));
        this.topRidges.set(ydim-1, new MaskRidge(xdim))

        this.btmRidges.set(0, new MaskRidge(xdim));
        this.btmRidges.set(ydim-1, new MaskRidge(xdim))
    }
    

    /**
     * Indicates whether the MaskFrame doesn't actually mask any voxels.
     * 
     */
    isVoid()
    {
        for (let ridge of this.topRidges.values()) {
            if (!ridge.isVoid()) { return false; }
        }
        for (let ridge of this.btmRidges.values()) {
            if (!ridge.isVoid()) { return false; }  
        }
        return true;
    }


    /**
     * Inserts a (top or bottom) ridge at a given location (replacing any existing one).
     * 
     */
    insertRidge(iLoc, ridge, isTop)
    {
        if ((iLoc < 0) || (iLoc >= this.ydim)) {
            BigLime.Logger.Report('MaskRidge.insertRidge: location is out of range', BigLime.Logger.Severity.Error);
            return;
        }

        let ridges = isTop ? this.topRidges : this.btmRidges;
        const needToSort = !ridges.has(iLoc);
        ridges.set(iLoc, ridge);

        if (needToSort) {
            ridges = new Map( [...ridges.entries()].sort((e1, e2) => e1[0] - e2[0]) );
            if (isTop) {
                this.topRidges = ridges;
            } else {
                this.btmRidges = ridges;
            }
        }
    };


    /**
     * Removes a top or bottom ridge at a given location.
     * 
     */
    removeRidge(iLoc, isTop)
    {
        const ridges = isTop ? this.topRidges : this.btmRidges;
        if (!ridges.has(iLoc)) {
            BigLime.Logger.Report('MaskFrame.removeRidge: Location does not exist in frame.', BigLime.Logger.Severity.Warn);
            return;
        }
        const ridge = ridges.get(iLoc);
        ridges.delete(iLoc);
        return ridge;
    }


    /**
     * Returns true if there is a ridge at the given location.
     * 
     */
    hasRidge(iLoc, isTop)
    {
        return isTop ? this.topRidges.has(iLoc) : this.btmRidges.has(iLoc);
    }


    /**
     * Returns the ridge at the given location, or null if there is none.
     * 
     */
    getRidge(iLoc, isTop)
    {
        return (isTop ? this.topRidges.get(iLoc) : this.btmRidges.get(iLoc)) || null;
    }


    /**
     * Returns the mask profile at a given location.
     * 
     */
    getMaskProfile(loc, isTop)
    {
        const ridges = isTop ? this.topRidges : this.btmRidges;

        if (loc <= 0) { return ridges.get(0); }
        if (loc >= this.ydim-1) { return ridges.get(this.ydim-1); }
        if (ridges.has(loc)) { return ridges.get(loc); }
            
        let [prevLoc, prevRidge] = [0, ridges.get(0)];
        for (let [nextLoc, nextRidge] of ridges) {
            if (nextLoc > loc) {
                const prevWt = (nextLoc - loc) / (nextLoc - prevLoc);
                return MaskRidge.Interpolate(prevRidge, nextRidge, prevWt);
            }
            [prevLoc, prevRidge] = [nextLoc, nextRidge];
        }

        BigLime.Logger.Report('MaskFrame.getProfile failed.', BigLime.Logger.Severity.Error);
        return new MaskRidge(this.xdim);
    }


    /**
     * Gets the locations of ridges that bracket a given location.
     * 
     */
    getBracketingLocs(iLoc, isTop)
    {
        let left = 0;
        let right = this.ydim-1;
        const ridges = isTop ? this.topRidges : this.btmRidges;

        for (let loc of ridges.keys()) {
            if (loc < iLoc) { 
                left = loc; 
            } else if ((loc > iLoc) && (loc < right)) { 
                right = loc; 
            }
        }
        return [left, right];
    }   


    /** 
     * Returns a JSON string representation of the object. 
     * 
     */
    toJsonString()
    {
        const obj =  {
            xdim: this.xdim,
            ydim: this.ydim,
            topRidges: Array.from(this.topRidges.entries()).map(e => [e[0], Array.from(e[1].points.entries())]),
            btmRidges: Array.from(this.btmRidges.entries()).map(e => [e[0], Array.from(e[1].points.entries())])
        }

        return JSON.stringify(obj,  
            function(key, val) { return val.toFixed ? Number(val.toFixed(6)) : val; }, 0
        );       
    }

  
    /**
     * Creates a MaskFrame object from its JSON string representation.
     *  
     */
    static FromJsonString(jsonStr)
    {
        const jsonObj = JSON.parse(jsonStr);

        const topRidges = jsonObj.topRidges.map(e => { 
            const ridge = new MaskRidge(jsonObj.xdim); 
            ridge.points = new Map(e[1]); 
            return [e[0], ridge];
        });

        const btmRidges = jsonObj.btmRidges.map(e => { 
            const ridge = new MaskRidge(jsonObj.xdim); 
            ridge.points = new Map(e[1]); 
            return [e[0], ridge];
        });

        const maskFrame = new MaskFrame(jsonObj.xdim, jsonObj.ydim);
        maskFrame.topRidges = new Map(topRidges);
        maskFrame.btmRidges = new Map(btmRidges);
        
        return maskFrame;
    }


    /**
     * Copies the mask data to a ReliefMask.
     * 
     */
    copyToReliefMask(reliefMask, yRange=null, copyToTexture=true)
    {
        if ((this.xdim != reliefMask.width) || (this.ydim != reliefMask.height)) {
            BigLime.Logger.Report('MaskFrame.copyToReliefMask: Size mismatch.', BigLime.Logger.Severity.Error);
        }

        const yStart = yRange ? Math.max(0, yRange[0]) : 0;
        const yEnd = yRange ? Math.min(this.ydim-1, yRange[1]) : this.ydim-1;
        for (let y=yStart; y<=yEnd; y++) {
            const topProfile = this.getMaskProfile(y, true);
            const btmProfile = this.getMaskProfile(y, false);
            const yw = y * reliefMask.width;

            let isTop = true;
            [topProfile, btmProfile].forEach(profile => {
                const byteOffset = isTop ? 2 : 0;
                let [prevLoc, prevHeight] = [0, profile.getHeight(0)];
                for (let [currLoc, currHeight] of profile.points) {
                    if (currLoc === 0) { continue; }
                    const slope = (currHeight - prevHeight) / (currLoc - prevLoc);
                    for (let x=prevLoc; x<currLoc; x++) {
                        const height = Math.max(0, Math.min(1, prevHeight + slope*(x - prevLoc)));
                        reliefMask.dataView.setUint16(4*(x + yw) + byteOffset, Math.round(height*65535), true);
                    }
                    prevLoc = currLoc;
                    prevHeight = currHeight;
                }
                const finalHeight = profile.getHeight(this.xdim-1);
                reliefMask.dataView.setUint16(4*(this.xdim-1 + yw) + byteOffset, Math.round(finalHeight*65535), true);
                isTop = !isTop;
            });   
        }

        if (copyToTexture) { reliefMask.copyDataToTexture(yRange); }
    }
};



/**
 * @classdesc
 * This class manages a set of sontrol points that define a piece-wise linear 
 * mask contour. 
 * 
 */
class MaskRidge
{
    /**
     * @constructor
     * 
     */
    constructor(size) 
    {         
        this.size = size;
        this.points = new Map();

        this.points.set(0, 0.0);
        this.points.set(size-1, 0.0);
    }


    /**
     * Returns the number of control points in the ridge.
     * 
     */
    numPoints()
    {
        return this.points.size;
    }


    /**
     * Indicates whether the ridge doesn't actually mask any voxels.
     * 
     */
    isVoid()
    {
        for (let pointHeight of this.points.values()) {
            if (pointHeight !== 0) { return false; }
        }
        return true;
    }

    /**
     * Inserts a control point at a given location (replacing any existing one).
     * 
     */
    insertPoint(iLoc, height, omitSort=false)
    {
        if ((iLoc < 0) || (iLoc >= this.size)) {
            BigLime.Logger.Report('MaskRidge.insertPoint: Location is out of range', BigLime.Logger.Severity.Error);
            return;
        }

        const needToSort = !omitSort && !this.points.has(iLoc);
        this.points.set(iLoc, height);
        if (needToSort) {
            this.points = new Map( [...this.points.entries()].sort((e1, e2) => e1[0] - e2[0]) );
        }
    }


    /**
     * Removes a control point at a given location.
     * 
     */
    removePoint(iLoc)
    {
        if (!this.points.has(iLoc)) {
            BigLime.Logger.Report('MaskRidge.removePoint: Location does not exist in ridge', BigLime.Logger.Severity.Warn);
            return;
        }
        this.points.delete(iLoc);
    }


    /**
     * Gets the control-point locations that bracket a given location.
     * 
     */
    getBracketingLocs(iLoc)
    {
        let left = 0;
        let right = this.size-1;

        for (let loc of this.points.keys()) {
            if (loc < iLoc) { 
                left = loc; 
            } else if ((loc > iLoc) && (loc < right)) { 
                right = loc; 
            }
        }
        return [left, right];
    }


    /**
     * Returns the height of the ridge at a given location.
     * 
     */
    getHeight(loc)
    {
        if (loc <= 0) { 
            return this.points.get(0); 
        }
        else if (loc >= this.size-1) { 
            return this.points.get(this.size-1); 
        }
        else if (this.points.has(loc)) {
            return this.points.get(loc);
        } 
        else {
            const [prev, next] = this.getBracketingLocs(loc);
            const slope = (this.points.get(next) - this.points.get(prev)) / (next - prev);
            return this.points.get(prev) + slope*(loc - prev);
        }
    }


    /**
     * Creates a new MaskRidge by interpolating between two given ones.
     * 
     */
    static Interpolate(ridgeA, ridgeB, weightA)
    {
        const ridgeOut = new MaskRidge(ridgeA.size);

        for (let [ptLoc, ptHeight] of ridgeA.points) {
            const interpHeight = weightA*ptHeight + (1 - weightA)*ridgeB.getHeight(ptLoc);
            ridgeOut.insertPoint(ptLoc, interpHeight, true);
        };

        for (let [ptLoc, ptHeight] of ridgeB.points) {
            if (!ridgeOut.points.has(ptLoc)) {
                const interpHeight = (1 - weightA)*ptHeight + weightA*ridgeA.getHeight(ptLoc);
                ridgeOut.insertPoint(ptLoc, interpHeight, true);
            }
        };

        ridgeOut.points = new Map( [...ridgeOut.points.entries()].sort((e1, e2) => e1[0] - e2[0]) );

        return ridgeOut;
    }
};