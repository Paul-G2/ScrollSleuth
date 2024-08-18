/**
 * @classdesc
 * This is the main class for the App.  
 * 
 * Author: Paul Geiger
 */
class App
{
   
    /**
     * @constructor
     * 
     */
    constructor() 
    {         
        // Create the app components
        BigLime.UtilityDbName = "ScrollSleuth_BigLimeDB";
        this.segViewer = new SegmentViewer(document.getElementById('viewer_area'), this);
        this.controlPanel = new ControlPanel(document.getElementById('controls_area'), this);

        this.helpDialog = new HelpDialog(document.getElementById('app_area'));
        document.getElementById('load_mock_data').addEventListener('click', 
            function(){ this.controlPanel.loadMockData(); }.bind(this));

        // Disable selection and right-click context menus
        const frame = document.getElementById('frame_area');
        frame.addEventListener('contextmenu', function(e) {e.preventDefault();} );  
        BigLime.Ui.StyleElement(frame, {userSelect:'none', MsUserSelect:'none', MozUserSelect:'none', WebkitUserSelect:'none'});    

        // Disable elastic scrolling
        document.body.addEventListener('touchmove', function(e) {e.preventDefault();}, {passive:false});
    }
};