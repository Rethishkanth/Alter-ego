import os
import urllib.request

def download_sample():
    # URL to a sample speech file (Harvard Sentences source or similar)
    # Using a reliable public sample from standard signal processing datasets
    url = "https://www.signalogic.com/melp/EngSamples/Orig/male.wav"
    
    # Path to backend/mock_data
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    dest_dir = os.path.join(base_dir, "mock_data")
    os.makedirs(dest_dir, exist_ok=True)
    dest_path = os.path.join(dest_dir, "ref_audio.wav")
    
    print(f"Downloading sample audio to {dest_path}...")
    try:
        # User-Agent header is sometimes required
        opener = urllib.request.build_opener()
        opener.addheaders = [('User-agent', 'Mozilla/5.0')]
        urllib.request.install_opener(opener)
        
        urllib.request.urlretrieve(url, dest_path)
        print("Download complete.")
        print("-" * 50)
        print("IMPORTANT: This is a generic 'Male Voice' sample.")
        print("For your Digital Twin to sound like YOU, replace this file:")
        print(f"  {dest_path}")
        print("with a 5-10 second clear recording of your own voice (wav format).")
        print("-" * 50)
    except Exception as e:
        print(f"Failed to download: {e}")

if __name__ == "__main__":
    download_sample()
