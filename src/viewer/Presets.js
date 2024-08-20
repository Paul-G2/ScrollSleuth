/**
 * @classdesc
 * This class is just a container for hard-coded presets.
 * 
 */
class Presets
{
    static Preset1 = 
    { 
        renderType: BigLime.RenderType.VR,
        persp: 1,
        antiAlias: true,
        interpType: BigLime.Interp3D.TriLinear,
        vrBackColor: new BigLime.Color.Black(),
        opacityCurveStr: "[0](255, 66, 66, 0); [390](255, 66, 66, 0); [486](219, 195, 77, 105); [505](203, 185, 98, 219); [1023](255, 255, 255, 227)",
        markerSize: 0.0075,
        markerColor: new BigLime.Color(0, 128, 0, 255),
        sealBorders: false, 
        lightSet: new BigLime.LightSet({
            ambientLight:0.66, 
            dirLights:[
            {
                diffuse: 0.22, 
                specStrength: 0.22, 
                specExp: 2, 
                shadowDarkness: 1.02, 
                shadowSoftness: 0.75, 
                dir: glMatrix.vec3.fromValues(0.483, -0.420, 0.768)
            },
            {
                diffuse: 0,
                specStrength: 0,
                specExp: 1,
                shadowDarkness: 0,
                shadowSoftness: 0.75,
                dir: glMatrix.vec3.fromValues(-0.9, 0, 0.4359)
            }
        ]})
    };

    static Preset2 = 
    { 
        renderType: BigLime.RenderType.VR,
        persp: 1,
        antiAlias: true,
        interpType: BigLime.Interp3D.TriLinear,
        vrBackColor: new BigLime.Color.Black(),
        opacityCurveStr: "[0](255, 66, 66, 0); [390](255, 66, 66, 0); [486](219, 195, 77, 105); [505](203, 185, 98, 219); [1023](255, 255, 255, 227)",
        markerSize: 0.0075,
        markerColor: new BigLime.Color(0, 128, 0, 255),
        sealBorders: false, 
        lightSet: new BigLime.LightSet({
            ambientLight:1.118, 
            dirLights:[
            {
                diffuse: 0.14, 
                specStrength: 0.21, 
                specExp: 2, 
                shadowDarkness: 1.02, 
                shadowSoftness: 0.75, 
                dir: glMatrix.vec3.fromValues(0.73, -0.43, 0.53)
            },
            {
                diffuse: 0,
                specStrength: 0,
                specExp: 1,
                shadowDarkness: 0,
                shadowSoftness: 0.75,
                dir: glMatrix.vec3.fromValues(-0.9, 0, 0.4359)
            }
        ]})
    };
        

    static Preset3 = 
    {
        renderType: BigLime.RenderType.VR,
        persp: 1,
        antiAlias: true,
        interpType: BigLime.Interp3D.TriLinear,
        vrBackColor: new BigLime.Color.Black(),
        opacityCurveStr: "[0](255, 0, 0, 0); [424](166, 145, 38, 0); [829](203, 185, 98, 65); [841](203, 185, 98, 126); [1023](255, 255, 255, 255)",
        markerSize: 0.0075,
        markerColor: new BigLime.Color(0, 128, 0, 255),
        sealBorders: false, 
        lightSet: new BigLime.LightSet({
            ambientLight: 0.93289,
            dirLights:[
            {
                diffuse: 0.23, 
                specStrength: 0.0, 
                specExp: 1, 
                shadowDarkness: 0.33, 
                shadowSoftness: 0.75, 
                dir: glMatrix.vec3.fromValues(-0.05, -0.075, 0.995929)
            },
            {
                diffuse: 0,
                specStrength: 0,
                specExp: 1,
                shadowDarkness: 0,
                shadowSoftness: 0.75,
                dir: glMatrix.vec3.fromValues(-0.9, 0, 0.4359)
            }
        ]})
    };
        

};


