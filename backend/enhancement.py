import cv2
import numpy as np

def enhance_clahe(image, clip_limit=2.0, tile_grid_size=(8, 8)):
    # Convert to LAB color space
    lab = cv2.cvtColor(image, cv2.COLOR_BGR2LAB)
    l, a, b = cv2.split(lab)
    
    # Apply CLAHE to L-channel
    clahe = cv2.createCLAHE(clipLimit=clip_limit, tileGridSize=tile_grid_size)
    cl = clahe.apply(l)
    
    # Merge channels and convert back to BGR
    limg = cv2.merge((cl, a, b))
    enhanced = cv2.cvtColor(limg, cv2.COLOR_LAB2BGR)
    return enhanced

def enhance_gamma(image, gamma=1.5):
    invGamma = 1.0 / gamma
    table = np.array([((i / 255.0) ** invGamma) * 255 for i in np.arange(0, 256)]).astype("uint8")
    return cv2.LUT(image, table)

def enhance_bilateral(image, d=9, sigma_color=75, sigma_space=75):
    return cv2.bilateralFilter(image, d, sigma_color, sigma_space)

def get_dark_channel(image, window_size):
    b, g, r = cv2.split(image)
    min_chan = cv2.min(cv2.min(r, g), b)
    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (window_size, window_size))
    dark = cv2.erode(min_chan, kernel)
    return dark

def get_atm_light(image, dark, top_percent=0.001):
    h, w = image.shape[:2]
    num_pixels = h * w
    num_top = int(max(num_pixels * top_percent, 1))
    
    dark_vec = dark.reshape(num_pixels)
    im_vec = image.reshape(num_pixels, 3)
    
    indices = np.argsort(dark_vec)[::-1][:num_top]
    
    atm_sum = np.zeros(3)
    for idx in indices:
        atm_sum += im_vec[idx]
        
    atm_light = atm_sum / num_top
    return atm_light

def get_transmission(image, atm_light, omega=0.95, window_size=15):
    norm_im = image.astype(np.float32) / atm_light
    dark = get_dark_channel(norm_im, window_size)
    transmission = 1 - omega * dark
    return transmission

def enhance_dark_channel_prior(image, window_size=15):
    # Normalize image
    im_float = image.astype(np.float32) / 255.0
    
    dark = get_dark_channel(im_float, window_size)
    atm_light = get_atm_light(im_float, dark)
    
    transmission = get_transmission(im_float, atm_light, window_size=window_size)
    
    # Refine transmission (optional, skipped for speed/simplicity, using rough map)
    # Clamp transmission to avoid division by zero
    t_min = 0.1
    transmission = np.maximum(transmission, t_min)
    
    # Recover image
    recovered = np.empty_like(im_float)
    for i in range(3):
        recovered[:, :, i] = (im_float[:, :, i] - atm_light[i]) / transmission + atm_light[i]
        
    # Clip to valid range
    recovered = np.clip(recovered, 0, 1)
    return (recovered * 255).astype(np.uint8)

def process_all_enhancements(image, params=None):
    if params is None:
        params = {}
        
    results = {
        "original": image,
        "clahe": enhance_clahe(image, clip_limit=params.get("clahe_clip", 2.0)),
        "gamma": enhance_gamma(image, gamma=params.get("gamma_val", 1.5)),
        "bilateral": enhance_bilateral(image, d=params.get("bilateral_d", 9)),
        "dark_channel": enhance_dark_channel_prior(image, window_size=params.get("dark_window", 15))
    }
    return results
