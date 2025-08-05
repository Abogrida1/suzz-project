import requests
import os

image_urls = [
    "https://www.pythonanywhere.com/user/battbot/files/home/battbot/WhatsApp%20Image%202025-08-04%20at%2003.22.59_8508aa3a.jpg",
    "https://www.pythonanywhere.com/user/battbot/files/home/battbot/WhatsApp%20Image%202025-08-04%20at%2003.23.05_d23941ee.jpg"
]

output_dir = "static/images"
os.makedirs(output_dir, exist_ok=True)

for url in image_urls:
    filename = url.split("/")[-1]
    filepath = os.path.join(output_dir, filename)
    try:
        print(f"Downloading {url} ...")
        response = requests.get(url, stream=True)
        response.raise_for_status()
        with open(filepath, "wb") as f:
            for chunk in response.iter_content(1024):
                f.write(chunk)
        print(f"Saved to {filepath}")
    except Exception as e:
        print(f"Failed to download {url}: {e}")
