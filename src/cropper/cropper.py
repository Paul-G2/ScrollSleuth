import os
from pathlib import  Path
import math
from threading import Timer
import numpy as np
import tkinter as tk
from tkinter import filedialog, StringVar, ttk, messagebox, Toplevel
from PIL import Image as PILImage, ImageOps as PILImageOps, ImageTk, ImageDraw
import tifffile
from skimage import io, transform
import shelve

def on_select_input_dir_click():
    """Click-handler for the input-directory selection button"""

    # Prompt the user for an input directory
    selected_dir = filedialog.askdirectory(initialdir = user_data['in_dir'] if 'in_dir' in user_data else None )
    if selected_dir:
        # It can take a while to load a big layer image, so pop up a 'wait' message
        x, y, w, h = (main_window.winfo_rootx(), main_window.winfo_rooty(),
                      main_window.winfo_width(), main_window.winfo_height())
        msg_box = Toplevel(main_window)
        msg_box.transient()
        msg_box.title('')
        msg_box.resizable(False, False)
        msg_box.attributes("-toolwindow", True)
        msg_box.geometry("%dx%d+%d+%d" % (0.6*w, 0.6*h, x+0.2*w, y+0.2*h))
        tk.Label(msg_box, text="Working...").pack(expand=True)

        # Process the selection
        Timer(0.5, process_input_dir, [selected_dir, msg_box]).start()


def process_input_dir(selected_dir, wait_messagebox):
    """Displays info about the selected input directory"""
    global in_dir, out_dir, in_img_names, display_img, segment_shape, total_area

    try:
        in_dir = selected_dir.replace('\\', '/')
        in_dir_label.config(text=in_dir)
        user_data['in_dir'] = in_dir

        # Set a default output directory
        out_dir = os.path.join(Path(in_dir).parent, 'layers_cropped').replace('\\', '/')
        out_dir_label.config(text=out_dir)

        # Get the mid-stack image and cache its dimensions
        in_img_names = sorted([fname for fname in os.listdir(in_dir) if '.tif' in fname])
        num_in_imgs = len(in_img_names)
        mid_img = io.imread(os.path.join(in_dir, in_img_names[num_in_imgs // 2]))
        h, w = mid_img.shape
        segment_shape = (num_in_imgs, h, w)

        # Reset the crop widgets
        left_val.set("0")
        top_val.set("0")
        right_val.set(w-1)
        bottom_val.set(h-1)
        xy_downsamp_val.set("1")
        z_downsamp_val.set("1")

        # Make a thumbnail from the mid-stack image, and display it
        hmax = min(640, main_window.winfo_screenheight() - 120 - create_btn.winfo_y() - create_btn.winfo_height())
        display_downsamp = math.ceil(max(h/hmax, w/1024))
        display_img = transform.downscale_local_mean(mid_img, (display_downsamp, display_downsamp)).astype(np.uint16)
        display_img = PILImageOps.autocontrast(PILImage.fromarray((display_img/256).astype(np.uint8)), 1, 0)
        display_img = PILImage.merge('RGB', (display_img, display_img, display_img))
        display_img_copy = display_img.copy()
        draw_clip_box(display_img_copy)
        display_img_tk = ImageTk.PhotoImage(display_img_copy)
        img_label.configure(image = display_img_tk)
        img_label.im = display_img_tk # Prevent display_img_tk from being garbage collected

        # Update info text
        info_str = "Segment volume:    " + str(w) + " x " + str(h) + " x " + str(num_in_imgs) + "  voxels."
        total_area = get_total_area(in_dir)
        info_str += "    " + str(round(float(total_area), 2)) + " cm^2." if total_area else ""
        seg_info_label.config(text = info_str)

        update_out_vol_text()
        update_create_btn()

    except Exception as e:
        create_btn.config(state="disabled")
        img_label.configure(image=None)
        img_label.im = None
        print(e)
        messagebox.showinfo(title="Error", message="Couldn't find and/or load tiff images in the specified directory.")

    finally:
        wait_messagebox.destroy()


def on_select_output_dir_click():
    """Click-callback for the output-directory selection button"""
    global out_dir
    out_dir = filedialog.askdirectory(initialdir = user_data['out_dir'] if 'out_dir' in user_data else None )
    if out_dir:
        out_dir_label.config(text=out_dir)
        user_data['out_dir'] = out_dir
        update_create_btn()


def on_create_btn_click():
    """Click-callback for the Create button"""
    global app_state, cancelled, in_img_names

    if not crop_params_are_valid():
        return

    # Cancel if we're already running
    if app_state == 'running' :
        cancelled = True
        create_btn.config(text="Cancelling...", state='disabled')
        return

    # Get the cropping params
    xy_downsamp = int(xy_downsamp_val.get())
    z_downsamp = int(z_downsamp_val.get())
    right = int(right_val.get())
    bottom = int(bottom_val.get())
    left = int(left_val.get())
    top = int(top_val.get())
    if reverse_sort_val.get():
        in_img_names.sort(reverse=True)
    crop_id_str = ('L' + str(left) + '_T' + str(top) + '_R' + str(right) + '_B' +
        str(bottom) + '_D' + str(xy_downsamp) + '_' + str(z_downsamp))
    out_img_dir = os.path.join(out_dir, crop_id_str)
    output_area = get_output_area()

    proc_args = {'z': 0, 'in_img_names': in_img_names, 'in_img_dir': in_dir, 'out_img_dir': out_img_dir,
                 'crop_id_str':crop_id_str, 'out_vol': None, 'top': top, 'bottom': bottom, 'left': left, 'right': right,
                 'xy_downsamp': xy_downsamp, 'z_downsamp': z_downsamp, 'output_area':output_area}

    # Set our state and start processing slices
    cancelled = False
    app_state = 'running'
    disable_widgets(True)
    update_create_btn()
    Timer(0.25, process_next_slice, [proc_args]).start()


def process_next_slice(args):
    """Reads, crops, and downsamples a single slice."""
    global app_state, cancelled, total_area

    if (cancelled) :
        cancelled = False
        args['out_vol'] = None
        app_state = 'idle'
        disable_widgets(False)
        update_create_btn()
        progress_label.configure(text="")
        return

    try:
        # Read a full-size layer image
        num_in_imgs = len( args['in_img_names'] )
        layer_img = io.imread(os.path.join(args['in_img_dir'], args['in_img_names'][args['z']]))

        # Crop it
        layer_img = layer_img[args['top']:args['bottom'] + 1, args['left']:args['right'] + 1]

        # Maybe downsample it
        if args['xy_downsamp'] > 1:
            layer_img = transform.downscale_local_mean(layer_img, (args['xy_downsamp'], args['xy_downsamp'])).astype(np.uint16)

        # Save it, or write it to a stack for later z-downsampling
        extratags = [
            (65000, 's', None, args['output_area'], True),
            (65001, 's', None, args['out_img_dir'], True),
            (65002, 's', None, Path(in_dir).parent.name, True)]

        if args['z_downsamp'] == 1:
            Path(args['out_img_dir']).mkdir(parents=True, exist_ok=True)
            tifffile.imwrite(os.path.join(args['out_img_dir'], str(args['z']).zfill(3) + '.tif'), layer_img,
                    extratags=extratags)
        else :
            if args['out_vol'] is None:
                args['out_vol'] = np.empty((num_in_imgs, layer_img.shape[0], layer_img.shape[1]), dtype=np.uint16)
            args['out_vol'][args['z'], :, :] = layer_img

        # Carry on with the next slice
        if  args['z'] < num_in_imgs - 1:
            args['z'] = args['z'] + 1
            progress_label.configure(text = "    " + str(args['z']) + " / " + str(num_in_imgs))
            Timer(0.25, process_next_slice, [args]).start()
        else:
            # Optionally downsample in z
            if args['z_downsamp'] > 1:
                args['out_vol'] = transform.downscale_local_mean(args['out_vol'], (args['z_downsamp'], 1, 1)).astype(np.uint16)
                num_out_imgs = args['out_vol'].shape[0]
                Path(args['out_img_dir']).mkdir(parents=True, exist_ok=True)
                for z in range(num_out_imgs):
                    tifffile.imwrite(os.path.join(args['out_img_dir'], str(z).zfill(3) + '.tif'), args['out_vol'][z],
                        extratags=extratags)

            messagebox.showinfo(title="Success", message="Cropped volume was successfully created.")
            args['out_vol'] = None
            app_state = 'idle'
            disable_widgets(False)
            update_create_btn()
            progress_label.configure(text="")

    except Exception as ex:
        messagebox.showinfo(title="Error", message="Failed to create cropped volume. " + str(ex))
        args['out_vol'] = None
        app_state = 'idle'
        disable_widgets(False)
        update_create_btn()
        progress_label.configure(text="")



def on_crop_params_change(self, mode, callback_name):
    """Handler for changes in the crop-param Entry widgets"""
    global display_img
    if not display_img : return

    try:
        display_img_copy = display_img.copy()
        draw_clip_box(display_img_copy)
        display_tk_img = ImageTk.PhotoImage(display_img_copy)
        img_label.configure(image=display_tk_img)
        img_label.im = display_tk_img  # Prevent display_tk_img from being garbage collected
    except:
        pass

    update_create_btn()
    update_out_vol_text()


def crop_params_are_valid():
    """Determines whether the cropping paramaters are valid."""
    try:
        xy_downsamp = int(xy_downsamp_val.get())
        z_downsamp = int(z_downsamp_val.get())
        right = int(right_val.get())
        bottom = int(bottom_val.get())
        left = int(left_val.get())
        top = int(top_val.get())
    except:
        return False

    valid = (xy_downsamp > 0) and (z_downsamp > 0) and (left >= 0) and (right >= left) and (bottom >= top) and \
            (top < segment_shape[1]) and (right < segment_shape[2])
    return valid


def draw_clip_box(img):
    """Draws the current clip-box on the given image"""
    try:
        dsamp = display_img.width / segment_shape[2]
        x0 = float(left_val.get()) * dsamp
        y0 = float(top_val.get()) * dsamp
        x1 = float(right_val.get()) * dsamp
        y1 = float(bottom_val.get()) * dsamp
        draw = ImageDraw.Draw(img)
        draw.rectangle([(x0, y0), (x1, y1)], outline='red', width=3)
        return True

    except:
        return False


def update_out_vol_text():
    """Sets the description text for the cropped volume."""
    text = 'Cropped volume: INVALID'
    if crop_params_are_valid():
        try:
            out_w = math.ceil((int(right_val.get()) - int(left_val.get()) + 1) / int(xy_downsamp_val.get()))
            out_h = math.ceil((int(bottom_val.get()) - int(top_val.get()) + 1) / int(xy_downsamp_val.get()))
            out_d = math.ceil(segment_shape[0] / int(z_downsamp_val.get()))
            gb = round((out_w * out_h * out_d * 2) / 2 ** 30, 3)
            out_area = get_output_area()
            if out_area : out_area = "     " + out_area + " cm^2"
            text = "Cropped volume:  " + str(out_w) + " x " + str(out_h) + " x " + str(out_d) + " voxels" + out_area + ".     " + str(gb) + " GB"
        except:
            pass

    out_info_label.config(text=text)


def update_create_btn():
    """Sets the text and enabled-state for the Create button"""
    if app_state == 'running':
        create_btn.config(text="Cancel", state="normal")
    else:
        create_btn.config(text="Create Cropped Volume", state='normal' if crop_params_are_valid() else 'disabled')


def disable_widgets(val):
    """Enables or disbles the controls"""
    widget_state = 'disabled' if val else 'normal'
    widgets = [in_dir_btn, out_dir_btn, left_entry, top_entry, right_entry, bottom_entry,
               xy_downsamp_entry, z_downsamp_entry, reverse_sort_btn]
    [w.configure(state=widget_state) for w in widgets]


def get_total_area(layers_dir):
    """Tries to read the area_cm2.txt file """
    area = None
    try:
        parent_dirs = Path(layers_dir).parents
        with open(os.path.join(parent_dirs[0], 'area_cm2.txt'), 'r') as f1:
            area = f1.read().strip()
    except:
        pass

    return area


def get_output_area():
    """Gets the area of the output sub-segment"""
    global total_area

    result = ""
    try:
        if total_area is not None:
            out_w = int(right_val.get()) - int(left_val.get()) + 1
            out_h = int(bottom_val.get()) - int(top_val.get()) + 1
            out_area = float(total_area) * (out_w / segment_shape[2]) * (out_h / segment_shape[1])
            result = str(round(float(out_area), 2))
    except:
        pass

    return result



# Main
if __name__ == '__main__':
    in_dir = ""
    out_dir = ""
    in_img_names = []
    segment_shape = (64, 1024, 1024) # (z, y, x) order
    display_img = None
    app_state = 'idle'
    cancelled = False
    total_area = None

    # Create the UI
    main_window = tk.Tk()
    main_window.title("Segment Cropper")
    bt = 15 # outer-border thickness

    s = ttk.Style()
    s.configure('my.TButton', font=('Helvetica', 10))
    s.configure('TLabelframe', background='#e1e1e1')
    s.configure('TLabelframe.Label', background='#e1e1e1', font=('Helvetica', 10))
    s.configure('my.TFrame', background='#e1e1e1')
    s.configure('my.TLabel', background='#e1e1e1', font=('Helvetica', 10))
    s.configure('idim.TLabel', font=('Helvetica', 10))
    s.configure('odim.TLabel', background='#e1e1e1', foreground='#404040', font=('Helvetica', 10))

    in_dir_frame = ttk.Frame()
    in_dir_frame.pack(fill='x', pady=(10, 0))

    in_dir_btn = ttk.Button(in_dir_frame, text="Select Layers Dir...", command=on_select_input_dir_click)
    in_dir_btn.pack(side=tk.LEFT, padx=(bt, 0))

    in_dir_label = ttk.Label(in_dir_frame, text="", borderwidth=1, relief="solid", anchor="w", padding=(0, 4))
    in_dir_label.pack(side=tk.LEFT, expand=True, fill='x', padx=(5, bt))


    out_dir_frame = ttk.Frame()
    out_dir_frame.pack(fill='x', pady=(25, 0))

    out_dir_btn = ttk.Button(out_dir_frame, text="Select Output Dir...", command=on_select_output_dir_click)
    out_dir_btn.pack(side=tk.LEFT, padx=(bt, 0))

    out_dir_label = ttk.Label(out_dir_frame, text="", borderwidth=1, relief="solid", anchor="w", padding=(0, 4))
    out_dir_label.pack(side=tk.LEFT, expand=True, fill='x', padx=(5, bt))


    seg_info_frame = ttk.Frame()
    seg_info_frame.pack(fill='x', pady=(10, 0))

    seg_info_label = ttk.Label(seg_info_frame, text="", anchor="w", padding=(0, 4), style='idim.TLabel')
    seg_info_label.pack(anchor='center') #side=tk.LEFT, expand=True, fill='x', padx=(bt + 120, bt))


    crop_frame = ttk.LabelFrame(text="Define Crop Region", padding=(10,12))
    crop_frame.pack(anchor='center', pady=(25,0), padx=bt)

    crop_entry_frame = ttk.Frame(crop_frame, style='my.TFrame')
    crop_entry_frame.pack(fill='x', pady=(0, 0))

    left_val = StringVar(value='0')
    top_val = StringVar(value='0')
    right_val = StringVar(value='0')
    bottom_val = StringVar(value='0')
    xy_downsamp_val = StringVar(value='1')
    z_downsamp_val = StringVar(value='1')
    [sv.trace_add("write", on_crop_params_change) for sv in
        [left_val, top_val, right_val, bottom_val, xy_downsamp_val, z_downsamp_val]]

    left_label = ttk.Label(crop_entry_frame, text="Left", style='my.TLabel')
    left_label.pack(side=tk.LEFT, pady=(0,8))

    left_entry = ttk.Entry(crop_entry_frame, textvariable=left_val, width=7)
    left_entry.pack(side=tk.LEFT, padx=(2, 25), pady=(0,8))

    top_label = ttk.Label(crop_entry_frame, text="Top", style='my.TLabel')
    top_label.pack(side=tk.LEFT, pady=(0,8))

    top_entry = ttk.Entry(crop_entry_frame, textvariable=top_val, width=7)
    top_entry.pack(side=tk.LEFT, padx=(2, 25), pady=(0,8))

    right_label = ttk.Label(crop_entry_frame, text="Right", style='my.TLabel')
    right_label.pack(side=tk.LEFT, pady=(0,8))

    right_entry = ttk.Entry(crop_entry_frame, textvariable=right_val, width=7)
    right_entry.pack(side=tk.LEFT, padx=(2, 25), pady=(0,8))

    bottom_label = ttk.Label(crop_entry_frame, text="Bottom", style='my.TLabel')
    bottom_label.pack(side=tk.LEFT, pady=(0,8))

    bottom_entry = ttk.Entry(crop_entry_frame, textvariable=bottom_val, width=7)
    bottom_entry.pack(side=tk.LEFT, padx=(2, 60), pady=(0,8))

    xy_downsamp_label = ttk.Label(crop_entry_frame, text="Downsamp:      xy", style='my.TLabel')
    xy_downsamp_label.pack(side=tk.LEFT, pady=(0, 8))

    xy_downsamp_entry = ttk.Entry(crop_entry_frame, textvariable=xy_downsamp_val, width=4)
    xy_downsamp_entry.pack(side=tk.LEFT, padx=(2, 13), pady=(0, 8))

    z_downsamp_label = ttk.Label(crop_entry_frame, text="z", style='my.TLabel')
    z_downsamp_label.pack(side=tk.LEFT, pady=(0, 8))

    z_downsamp_entry = ttk.Entry(crop_entry_frame, textvariable=z_downsamp_val, width=4)
    z_downsamp_entry.pack(side=tk.LEFT, padx=(2, 0), pady=(0, 8))

    out_info_label = ttk.Label(crop_frame, text="", anchor="w", style='odim.TLabel', foreground='#00a2e8')
    out_info_label.pack(anchor='center', pady=(10,0))


    create_btn_frame = ttk.Frame()
    create_btn_frame.pack(anchor='center', pady=(15, 0))

    reverse_sort_val = tk.BooleanVar(value=False)
    reverse_sort_btn = tk.Checkbutton(create_btn_frame, text="Reverse sort", variable=reverse_sort_val, font=('Helvetica', 10))
    reverse_sort_btn.pack(side=tk.LEFT, padx=(0,50))

    create_btn = ttk.Button(create_btn_frame, text="Create Cropped Volume", style='my.TButton', command=on_create_btn_click, padding=(5, 10))
    create_btn.pack(side=tk.LEFT)
    create_btn.config(state="disabled")

    progress_label = ttk.Label(create_btn_frame, text="")
    progress_label.pack(side=tk.LEFT)


    img_frame = ttk.Frame()
    img_frame.pack(anchor='center', pady=(15, bt), padx=bt)
    img_label = tk.Label(img_frame, anchor='center' )
    img_label.pack()

    with shelve.open('user_data') as user_data:
        main_window.mainloop()

