/**
 * @classdesc
 * This class implements a dialog for displaying help info.
 * 
 */
class HelpDialog extends BigLime.Dialog
{

    /**
     * @constructor
     * 
     * @param {HTMLElement} parent - The html div that will host the dialog.
     */
    constructor(parent) 
    {
        const height = BigLime.Utils.isTouchDevice() ? '850px' : '740px';
        super({parent:parent, title:'Help', width:'512px', height:height, borderWidth:4, borderColor:'#ffffff'});

        // Content div
        const scrollDiv = BigLime.Ui.CreateElement('div', 'help_dlg_scrolldiv', null, 
            {overflowX:'auto', overflowY:'auto'} 
        );
        const textDiv = BigLime.Ui.CreateElement('div', 'help_dlg_contentdiv', scrollDiv, 
            {padding:'10px 20px 10px 0px'} );
        
        this.setContent(scrollDiv);

        const mobileText = BigLime.Utils.isTouchDevice() ? 
            `<br/><ul style="list-style-type:none;">
                <li><b>Note: This app is not designed for mobile devices. Some features work only on desktop/laptop machines.</b></li>
            </ul><br/>` : '';

        textDiv.innerHTML = mobileText +
            `<ul>
                <li>For a quick test-drive, you can <text id="load_mock_data" style="color:blue;"><u>click here</u></text> to load an artificial scroll image. Give it a few seconds to appear,
                then: </li>
                <br />
                <ul>
                    <li>Left mouse to Rotate the main image.</li>
                    <br />
                    
                    <li>Right mouse to shift the main image.</li>
                    <br />
                    
                    <li>Shift-left-mouse or mouse-wheel to zoom.</li>
                    <br />
                    
                    <li>Alt-left-mouse to adjust brightness and contrast in any viewport.</li>
                    <br />

                    <li>Ctrl-left-mouse to drag the (red, green, and blue) cross-reference lines.</li>
                    <br />
                    
                    <li>Select a rendering mode:
                    <ul>
                        <li>VR: Volume Rendering</li>
                        <li>MIP: Maximum Intensity Projection</li>
                        <li>X-ray: Transmission X-ray</li>
                        <li>Slice: Axial cross-section.</li>
                    </ul>
                    </li>
                    <br />
                    
                    <li>Toggle the <i>Heatmap</i> checkbox to apply coloring in MIP, X-ray, or Slice mode.</li>
                    <br />

                    <li>Edit the cut-away mask by dragging the yellow control points in the left and top viewports. 
                    <ul>
                        <li>Add or delete mask points by right-clicking.</li>
                        <li>If no control points are visible on the current slice, click the <i>Add</i> button to create them.</li>
                    </ul>
                    </li>
                </ul>
                <br />
                <li>For more information, please visit the <a href="https://github.com/Paul-G2/ScrollSleuth" target="_blank" rel="noopener noreferrer">project website</a>.</li>
            </ul>
            `;
    } 
};





